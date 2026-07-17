use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, StreamConfig};
use ringbuf::traits::{Consumer, Observer, Producer, Split};
use ringbuf::HeapRb;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use crate::audio::types::{AudioDeviceInfo, AudioError};

/// Buffer size for the ring buffer (enough for ~1 second at 48kHz).
const RING_BUFFER_SIZE: usize = 48000;
const OWNER_ACK_TIMEOUT: Duration = Duration::from_secs(2);

struct CaptureState {
    running: AtomicBool,
    generation: AtomicU64,
    error: std::sync::Mutex<Option<AudioError>>,
    active_device_name: std::sync::Mutex<Option<String>>,
}

impl CaptureState {
    fn new() -> Self {
        Self {
            running: AtomicBool::new(false),
            generation: AtomicU64::new(0),
            error: std::sync::Mutex::new(None),
            active_device_name: std::sync::Mutex::new(None),
        }
    }

    fn runtime_error(&self, generation: u64, error: AudioError) {
        if self.generation.load(Ordering::Acquire) == generation {
            let mut current_error = self.error.lock().unwrap();
            *current_error = Some(error);
            self.running.store(false, Ordering::Release);
            *self.active_device_name.lock().unwrap() = None;
        }
    }
}

/// Manages CPAL audio input through a dedicated owner thread.
/// The non-`Send` stream never crosses that thread boundary.
pub struct AudioCapture {
    owner: Box<dyn CaptureControl>,
    consumer: Option<ringbuf::HeapCons<f32>>,
    sample_rate: u32,
    state: Arc<CaptureState>,
}

struct CaptureStart {
    sample_rate: u32,
    device_name: String,
    consumer: ringbuf::HeapCons<f32>,
}

trait CaptureControl: Send {
    fn start(
        &mut self,
        device_name: Option<String>,
        state: Arc<CaptureState>,
    ) -> Result<CaptureStart, AudioError>;
    fn stop(&mut self) -> Result<(), AudioError>;
}

enum CaptureCommand {
    Start {
        device_name: Option<String>,
        state: Arc<CaptureState>,
        reply: mpsc::SyncSender<Result<CaptureStart, AudioError>>,
    },
    Stop(mpsc::SyncSender<()>),
    Shutdown,
}

struct CaptureOwner {
    commands: mpsc::Sender<CaptureCommand>,
    thread: Option<thread::JoinHandle<()>>,
    timeout: Duration,
}

trait OwnedCaptureStream {
    fn play(&mut self) -> Result<(), AudioError>;
}

trait CaptureBackend: Send + 'static {
    fn build(
        &mut self,
        device_name: Option<&str>,
        on_error: Arc<dyn Fn(AudioError) + Send + Sync>,
    ) -> Result<(Box<dyn OwnedCaptureStream>, CaptureStart), AudioError>;
}

struct CpalCaptureBackend;
struct CpalCaptureStream(cpal::Stream);

impl OwnedCaptureStream for CpalCaptureStream {
    fn play(&mut self) -> Result<(), AudioError> {
        self.0
            .play()
            .map_err(|e| AudioError::Unknown(format!("Failed to start stream: {}", e)))
    }
}

impl CaptureOwner {
    fn spawn() -> Self {
        Self::spawn_with(Box::new(CpalCaptureBackend), OWNER_ACK_TIMEOUT)
    }

    fn spawn_with(backend: Box<dyn CaptureBackend>, timeout: Duration) -> Self {
        let (commands, receiver) = mpsc::channel();
        let thread = thread::Builder::new()
            .name("audio-capture-owner".into())
            .spawn(move || capture_owner_loop(receiver, backend))
            .expect("failed to spawn audio capture owner");
        Self {
            commands,
            thread: Some(thread),
            timeout,
        }
    }
}

impl CaptureControl for CaptureOwner {
    fn start(
        &mut self,
        device_name: Option<String>,
        state: Arc<CaptureState>,
    ) -> Result<CaptureStart, AudioError> {
        let (reply, response) = mpsc::sync_channel(1);
        self.commands
            .send(CaptureCommand::Start {
                device_name,
                state: state.clone(),
                reply,
            })
            .map_err(|_| AudioError::AudioSubsystemUnavailable)?;
        response.recv_timeout(self.timeout).map_err(|_| {
            state.generation.fetch_add(1, Ordering::AcqRel);
            state.running.store(false, Ordering::Release);
            *state.error.lock().unwrap() = Some(AudioError::AudioSubsystemUnavailable);
            AudioError::AudioSubsystemUnavailable
        })?
    }

    fn stop(&mut self) -> Result<(), AudioError> {
        let (reply, response) = mpsc::sync_channel(0);
        self.commands
            .send(CaptureCommand::Stop(reply))
            .map_err(|_| AudioError::AudioSubsystemUnavailable)?;
        response
            .recv_timeout(self.timeout)
            .map_err(|_| AudioError::AudioSubsystemUnavailable)
    }
}

impl Drop for CaptureOwner {
    fn drop(&mut self) {
        let _ = self.commands.send(CaptureCommand::Shutdown);
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

fn capture_owner_loop(
    commands: mpsc::Receiver<CaptureCommand>,
    mut backend: Box<dyn CaptureBackend>,
) {
    // The stream is created, used, and dropped exclusively on this thread.
    let mut stream: Option<Box<dyn OwnedCaptureStream>> = None;
    while let Ok(command) = commands.recv() {
        match command {
            CaptureCommand::Start {
                device_name,
                state,
                reply,
            } => {
                stream = None;
                state.running.store(false, Ordering::Release);
                *state.error.lock().unwrap() = None;
                let generation = state.generation.fetch_add(1, Ordering::AcqRel) + 1;
                let callback_state = state.clone();
                let on_error = Arc::new(move |error| {
                    callback_state.runtime_error(generation, error);
                });
                let result = backend.build(device_name.as_deref(), on_error).and_then(
                    |(mut new_stream, start)| {
                        new_stream.play()?;
                        if state.generation.load(Ordering::Acquire) != generation {
                            return Err(AudioError::AudioSubsystemUnavailable);
                        }
                        let current_error = state.error.lock().unwrap();
                        if let Some(error) = current_error.clone() {
                            return Err(error);
                        }
                        stream = Some(new_stream);
                        state.running.store(true, Ordering::Release);
                        drop(current_error);
                        Ok(start)
                    },
                );
                if let Err(error) = &result {
                    *state.error.lock().unwrap() = Some(error.clone());
                }
                let _ = reply.send(result);
            }
            CaptureCommand::Stop(reply) => {
                stream = None;
                let _ = reply.send(());
            }
            CaptureCommand::Shutdown => break,
        }
    }
    drop(stream);
}

impl CaptureBackend for CpalCaptureBackend {
    fn build(
        &mut self,
        device_name: Option<&str>,
        on_error: Arc<dyn Fn(AudioError) + Send + Sync>,
    ) -> Result<(Box<dyn OwnedCaptureStream>, CaptureStart), AudioError> {
        let host = cpal::default_host();
        let device = get_device(&host, device_name)?;
        let resolved_device_name = device.name().unwrap_or_default();
        let config = find_config(&device)?;
        let sample_rate = config.sample_rate.0;
        let rb = HeapRb::<f32>::new(RING_BUFFER_SIZE);
        let (mut producer, consumer) = rb.split();
        let stream = device
            .build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    let _ = producer.push_slice(data);
                },
                move |err| {
                    log::error!("CPAL stream error: {}", err);
                    on_error(AudioError::StreamInterrupted);
                },
                None,
            )
            .map_err(|e| AudioError::Unknown(format!("Failed to build input stream: {}", e)))?;
        Ok((
            Box::new(CpalCaptureStream(stream)),
            CaptureStart {
                sample_rate,
                device_name: resolved_device_name,
                consumer,
            },
        ))
    }
}

fn get_device(host: &cpal::Host, device_name: Option<&str>) -> Result<Device, AudioError> {
    if let Some(name) = device_name {
        let devices = host
            .input_devices()
            .map_err(|_| AudioError::NoMicrophoneAvailable)?;
        for device in devices {
            if device.name().ok().as_deref() == Some(name) {
                return Ok(device);
            }
        }
        log::warn!("Requested device '{}' not found, using default", name);
    }
    host.default_input_device()
        .ok_or(AudioError::NoMicrophoneAvailable)
}

fn find_config(device: &Device) -> Result<StreamConfig, AudioError> {
    let supported = device
        .supported_input_configs()
        .map_err(|e| AudioError::Unknown(format!("Failed to query input configs: {}", e)))?;
    let configs: Vec<_> = supported.collect();
    for &target_rate in &[44100u32, 48000] {
        for cfg in &configs {
            if cfg.channels() >= 1
                && cfg.min_sample_rate().0 <= target_rate
                && cfg.max_sample_rate().0 >= target_rate
            {
                return Ok(StreamConfig {
                    channels: 1,
                    sample_rate: cpal::SampleRate(target_rate),
                    buffer_size: cpal::BufferSize::Default,
                });
            }
        }
    }
    Err(AudioError::UnsupportedSampleRate)
}

impl AudioCapture {
    pub fn new() -> Self {
        Self {
            owner: Box::new(CaptureOwner::spawn()),
            consumer: None,
            sample_rate: 44100,
            state: Arc::new(CaptureState::new()),
        }
    }

    #[cfg(test)]
    fn with_owner(owner: Box<dyn CaptureControl>) -> Self {
        Self {
            owner,
            consumer: None,
            sample_rate: 44100,
            state: Arc::new(CaptureState::new()),
        }
    }

    /// List available audio input devices.
    pub fn list_devices(&self) -> Result<Vec<AudioDeviceInfo>, AudioError> {
        let host = cpal::default_host();
        let default_name = host
            .default_input_device()
            .and_then(|d| d.name().ok())
            .unwrap_or_default();

        let devices = host
            .input_devices()
            .map_err(|e| AudioError::Unknown(format!("Failed to enumerate devices: {}", e)))?;

        let mut infos = Vec::new();
        for device in devices {
            if let Ok(name) = device.name() {
                infos.push(AudioDeviceInfo {
                    device_name: name.clone(),
                    is_default: name == default_name,
                });
            }
        }

        if infos.is_empty() {
            return Err(AudioError::NoMicrophoneAvailable);
        }

        Ok(infos)
    }

    /// Start capturing audio from the specified device (or default).
    pub fn start(&mut self, device_name: Option<&str>) -> Result<u32, AudioError> {
        if self.state.running.load(Ordering::Acquire) {
            self.stop();
        }

        let started = self
            .owner
            .start(device_name.map(str::to_owned), self.state.clone())?;
        self.sample_rate = started.sample_rate;
        *self.state.active_device_name.lock().unwrap() = Some(started.device_name.clone());
        self.consumer = Some(started.consumer);

        log::info!(
            "Audio capture started: {} Hz, device: {}",
            self.sample_rate,
            started.device_name
        );

        Ok(self.sample_rate)
    }

    /// Stop the audio capture stream.
    pub fn stop(&mut self) {
        self.state.generation.fetch_add(1, Ordering::AcqRel);
        self.state.running.store(false, Ordering::Release);
        if let Err(error) = self.owner.stop() {
            *self.state.error.lock().unwrap() = Some(error);
        }
        self.consumer = None;
        *self.state.active_device_name.lock().unwrap() = None;
        log::info!("Audio capture stopped");
    }

    /// Read available samples from the ring buffer into the provided vec.
    /// Returns the number of samples read.
    pub fn read_samples(&mut self, buffer: &mut Vec<f32>) -> usize {
        if let Some(consumer) = &mut self.consumer {
            let available = consumer.occupied_len();
            if available == 0 {
                return 0;
            }
            buffer.resize(available, 0.0);
            consumer.pop_slice(&mut buffer[..available]);
            available
        } else {
            0
        }
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    pub fn is_running(&self) -> bool {
        self.state.running.load(Ordering::Acquire)
    }

    pub fn active_device_name(&self) -> Option<String> {
        self.state.active_device_name.lock().unwrap().clone()
    }

    #[allow(dead_code)]
    pub fn last_error(&self) -> Option<AudioError> {
        self.state.error.lock().unwrap().clone()
    }
}

impl Drop for AudioCapture {
    fn drop(&mut self) {
        self.state.generation.fetch_add(1, Ordering::AcqRel);
        self.state.running.store(false, Ordering::Release);
        let _ = self.owner.stop();
        *self.state.active_device_name.lock().unwrap() = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    type ErrorCallback = Arc<dyn Fn(AudioError) + Send + Sync>;

    enum Plan {
        BuildFail,
        PlayFail,
        Ok,
        Slow,
    }
    struct FakeBackend {
        plans: Arc<std::sync::Mutex<VecDeque<Plan>>>,
        callbacks: Arc<std::sync::Mutex<Vec<ErrorCallback>>>,
    }
    struct FakeStream {
        play_fail: bool,
        delay: Duration,
    }
    impl OwnedCaptureStream for FakeStream {
        fn play(&mut self) -> Result<(), AudioError> {
            if !self.delay.is_zero() {
                thread::sleep(self.delay);
            }
            if self.play_fail {
                Err(AudioError::Unknown("play failed".into()))
            } else {
                Ok(())
            }
        }
    }
    impl CaptureBackend for FakeBackend {
        fn build(
            &mut self,
            _name: Option<&str>,
            callback: ErrorCallback,
        ) -> Result<(Box<dyn OwnedCaptureStream>, CaptureStart), AudioError> {
            let plan = self.plans.lock().unwrap().pop_front().unwrap();
            if matches!(plan, Plan::BuildFail) {
                return Err(AudioError::Unknown("build failed".into()));
            }
            self.callbacks.lock().unwrap().push(callback);
            let rb = HeapRb::<f32>::new(8);
            let (_, consumer) = rb.split();
            Ok((
                Box::new(FakeStream {
                    play_fail: matches!(plan, Plan::PlayFail),
                    delay: if matches!(plan, Plan::Slow) {
                        Duration::from_millis(60)
                    } else {
                        Duration::ZERO
                    },
                }),
                CaptureStart {
                    sample_rate: 48000,
                    device_name: "Test input".into(),
                    consumer,
                },
            ))
        }
    }
    fn capture(
        plans: Vec<Plan>,
        timeout: Duration,
    ) -> (AudioCapture, Arc<std::sync::Mutex<Vec<ErrorCallback>>>) {
        let callbacks = Arc::new(std::sync::Mutex::new(Vec::new()));
        let backend = FakeBackend {
            plans: Arc::new(std::sync::Mutex::new(plans.into())),
            callbacks: callbacks.clone(),
        };
        let owner = CaptureOwner::spawn_with(Box::new(backend), timeout);
        (AudioCapture::with_owner(Box::new(owner)), callbacks)
    }

    #[test]
    fn production_protocol_reports_build_failure() {
        let (mut c, _) = capture(vec![Plan::BuildFail], Duration::from_secs(1));
        assert!(c
            .start(None)
            .unwrap_err()
            .to_string()
            .contains("build failed"));
        assert!(!c.is_running());
    }
    #[test]
    fn production_protocol_reports_play_failure() {
        let (mut c, _) = capture(vec![Plan::PlayFail], Duration::from_secs(1));
        assert!(c
            .start(None)
            .unwrap_err()
            .to_string()
            .contains("play failed"));
        assert!(!c.is_running());
    }
    #[test]
    fn runtime_error_clears_running_and_active_metadata() {
        let (mut c, callbacks) = capture(vec![Plan::Ok], Duration::from_secs(1));
        c.start(None).unwrap();
        callbacks.lock().unwrap()[0](AudioError::StreamInterrupted);
        assert!(!c.is_running());
        assert_eq!(c.active_device_name(), None);
        assert!(matches!(
            c.last_error(),
            Some(AudioError::StreamInterrupted)
        ));
    }
    #[test]
    fn stale_callback_cannot_stop_restarted_stream() {
        let (mut c, callbacks) = capture(vec![Plan::Ok, Plan::Ok], Duration::from_secs(1));
        c.start(None).unwrap();
        c.start(None).unwrap();
        callbacks.lock().unwrap()[0](AudioError::StreamInterrupted);
        assert!(c.is_running());
    }
    #[test]
    fn acknowledgement_timeout_is_typed_and_invalidates_late_success() {
        let (mut c, _) = capture(vec![Plan::Slow], Duration::from_millis(5));
        assert!(matches!(
            c.start(None),
            Err(AudioError::AudioSubsystemUnavailable)
        ));
        thread::sleep(Duration::from_millis(80));
        assert!(!c.is_running());
        assert_eq!(c.active_device_name(), None);
    }
}
