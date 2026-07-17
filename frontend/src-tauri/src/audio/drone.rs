use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::StreamConfig;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use crate::audio::types::{AudioError, AudioRuntimeError, DroneRuntimeStatus};

const OWNER_ACK_TIMEOUT: Duration = Duration::from_secs(2);

struct DroneState {
    playing: AtomicBool,
    generation: AtomicU64,
    error: std::sync::Mutex<Option<AudioError>>,
}
impl DroneState {
    fn new() -> Self {
        Self {
            playing: AtomicBool::new(false),
            generation: AtomicU64::new(0),
            error: std::sync::Mutex::new(None),
        }
    }
    fn runtime_error(&self, generation: u64, error: AudioError) {
        if self.generation.load(Ordering::Acquire) == generation {
            let mut current_error = self.error.lock().unwrap();
            *current_error = Some(error);
            self.playing.store(false, Ordering::Release);
        }
    }
}

/// Drone synthesizer — generates a warm, brass-like sustained tone via CPAL output.
///
/// Uses additive synthesis: fundamental + overtones at decreasing amplitudes
/// with a gentle attack/release envelope to avoid clicks.
pub struct DroneSynth {
    owner: Box<dyn DroneControl>,
    state: Arc<DroneState>,
    /// Shared fundamental frequency (written atomically from main thread).
    frequency: Arc<std::sync::atomic::AtomicU64>,
    /// Master volume 0.0–1.0 stored as u64 bits.
    volume: Arc<std::sync::atomic::AtomicU64>,
}

trait DroneControl: Send {
    fn start(
        &mut self,
        frequency_hz: f64,
        frequency: Arc<std::sync::atomic::AtomicU64>,
        volume: Arc<std::sync::atomic::AtomicU64>,
        state: Arc<DroneState>,
    ) -> Result<String, AudioError>;
    fn stop(&mut self) -> Result<(), AudioError>;
}

enum DroneCommand {
    Start {
        frequency_hz: f64,
        frequency: Arc<std::sync::atomic::AtomicU64>,
        volume: Arc<std::sync::atomic::AtomicU64>,
        state: Arc<DroneState>,
        reply: mpsc::SyncSender<Result<String, AudioError>>,
    },
    Stop(mpsc::SyncSender<()>),
    Shutdown,
}

struct DroneOwner {
    commands: mpsc::Sender<DroneCommand>,
    thread: Option<thread::JoinHandle<()>>,
    timeout: Duration,
    wedged: Arc<AtomicBool>,
}

trait OwnedDroneStream {
    fn play(&mut self) -> Result<(), AudioError>;
}
trait DroneBackend: Send + 'static {
    fn build(
        &mut self,
        frequency_hz: f64,
        frequency: Arc<AtomicU64>,
        volume: Arc<AtomicU64>,
        is_active: Arc<dyn Fn() -> bool + Send + Sync>,
        on_error: Arc<dyn Fn(AudioError) + Send + Sync>,
    ) -> Result<(Box<dyn OwnedDroneStream>, String), AudioError>;
}
struct CpalDroneBackend;
struct CpalDroneStream(cpal::Stream);
impl OwnedDroneStream for CpalDroneStream {
    fn play(&mut self) -> Result<(), AudioError> {
        self.0
            .play()
            .map_err(|e| AudioError::Unknown(format!("Failed to start output stream: {}", e)))
    }
}

impl DroneOwner {
    fn spawn() -> Self {
        Self::spawn_with(Box::new(CpalDroneBackend), OWNER_ACK_TIMEOUT)
    }
    fn spawn_with(backend: Box<dyn DroneBackend>, timeout: Duration) -> Self {
        let (commands, receiver) = mpsc::channel();
        let wedged = Arc::new(AtomicBool::new(false));
        let thread = thread::Builder::new()
            .name("audio-drone-owner".into())
            .spawn(move || drone_owner_loop(receiver, backend))
            .expect("failed to spawn drone owner");
        Self {
            commands,
            thread: Some(thread),
            timeout,
            wedged,
        }
    }
}

impl DroneControl for DroneOwner {
    fn start(
        &mut self,
        frequency_hz: f64,
        frequency: Arc<std::sync::atomic::AtomicU64>,
        volume: Arc<std::sync::atomic::AtomicU64>,
        state: Arc<DroneState>,
    ) -> Result<String, AudioError> {
        let (reply, response) = mpsc::sync_channel(1);
        self.commands
            .send(DroneCommand::Start {
                frequency_hz,
                frequency,
                volume,
                state: state.clone(),
                reply,
            })
            .map_err(|_| AudioError::AudioSubsystemUnavailable)?;
        response.recv_timeout(self.timeout).map_err(|_| {
            self.wedged.store(true, Ordering::Release);
            state.generation.fetch_add(1, Ordering::AcqRel);
            state.playing.store(false, Ordering::Release);
            *state.error.lock().unwrap() = Some(AudioError::AudioSubsystemUnavailable);
            AudioError::AudioSubsystemUnavailable
        })?
    }

    fn stop(&mut self) -> Result<(), AudioError> {
        let (reply, response) = mpsc::sync_channel(0);
        self.commands
            .send(DroneCommand::Stop(reply))
            .map_err(|_| AudioError::AudioSubsystemUnavailable)?;
        response.recv_timeout(self.timeout).map_err(|_| {
            self.wedged.store(true, Ordering::Release);
            AudioError::AudioSubsystemUnavailable
        })
    }
}

impl Drop for DroneOwner {
    fn drop(&mut self) {
        let _ = self.commands.send(DroneCommand::Shutdown);
        if let Some(thread) = self.thread.take() {
            if self.wedged.load(Ordering::Acquire) {
                log::error!("Detaching wedged drone owner during shutdown");
                drop(thread);
            } else {
                let _ = thread.join();
            }
        }
    }
}

fn drone_owner_loop(commands: mpsc::Receiver<DroneCommand>, mut backend: Box<dyn DroneBackend>) {
    let mut stream: Option<Box<dyn OwnedDroneStream>> = None;
    while let Ok(command) = commands.recv() {
        match command {
            DroneCommand::Start {
                frequency_hz,
                frequency,
                volume,
                state,
                reply,
            } => {
                stream = None;
                state.playing.store(false, Ordering::Release);
                *state.error.lock().unwrap() = None;
                let generation = state.generation.fetch_add(1, Ordering::AcqRel) + 1;
                let callback_state = state.clone();
                let on_error =
                    Arc::new(move |error| callback_state.runtime_error(generation, error));
                let active_state = state.clone();
                let is_active = Arc::new(move || active_state.playing.load(Ordering::Acquire));
                let result = backend
                    .build(frequency_hz, frequency, volume, is_active, on_error)
                    .and_then(|(mut new_stream, device_name)| {
                        new_stream.play()?;
                        if state.generation.load(Ordering::Acquire) != generation {
                            return Err(AudioError::AudioSubsystemUnavailable);
                        }
                        let current_error = state.error.lock().unwrap();
                        if let Some(error) = current_error.clone() {
                            return Err(error);
                        }
                        stream = Some(new_stream);
                        state.playing.store(true, Ordering::Release);
                        drop(current_error);
                        Ok(device_name)
                    });
                if let Err(error) = &result {
                    *state.error.lock().unwrap() = Some(error.clone());
                }
                let _ = reply.send(result);
            }
            DroneCommand::Stop(reply) => {
                thread::sleep(std::time::Duration::from_millis(100));
                stream = None;
                let _ = reply.send(());
            }
            DroneCommand::Shutdown => break,
        }
    }
    drop(stream);
}

/// Overtone recipe for a warm, brass-like timbre.
/// (partial_number, relative_amplitude)
const PARTIALS: [(f64, f64); 5] = [
    (1.0, 1.0),  // fundamental
    (2.0, 0.45), // octave
    (3.0, 0.20), // twelfth
    (4.0, 0.10), // double octave
    (5.0, 0.04), // major third + 2 octaves
];

/// Master gain — keep low to prevent clipping.
const MASTER_GAIN: f64 = 0.18;

/// Attack/release time in seconds (smooth fade to avoid clicks).
const ENVELOPE_TIME: f64 = 0.08;

impl DroneSynth {
    pub fn new() -> Self {
        Self {
            owner: Box::new(DroneOwner::spawn()),
            state: Arc::new(DroneState::new()),
            frequency: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            volume: Arc::new(std::sync::atomic::AtomicU64::new(f64::to_bits(0.7))),
        }
    }

    #[cfg(test)]
    fn with_owner(owner: Box<dyn DroneControl>) -> Self {
        Self {
            owner,
            state: Arc::new(DroneState::new()),
            frequency: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            volume: Arc::new(std::sync::atomic::AtomicU64::new(f64::to_bits(0.7))),
        }
    }

    /// Start the drone at the given concert-pitch frequency.
    pub fn start(&mut self, frequency_hz: f64) -> Result<(), String> {
        // Stop any existing drone first
        if self.is_playing() {
            self.stop();
        }

        let device_name = self
            .owner
            .start(
                frequency_hz,
                self.frequency.clone(),
                self.volume.clone(),
                self.state.clone(),
            )
            .map_err(|e| e.to_string())?;

        log::info!(
            "Drone started: {:.1} Hz, device: {}",
            frequency_hz,
            device_name
        );

        Ok(())
    }

    /// Stop the drone with a quick fade-out.
    pub fn stop(&mut self) {
        self.state.generation.fetch_add(1, Ordering::AcqRel);
        self.state.playing.store(false, Ordering::Release);
        if let Err(error) = self.owner.stop() {
            *self.state.error.lock().unwrap() = Some(error);
        }

        log::info!("Drone stopped");
    }

    /// Change the drone frequency on the fly (crossfade handled by envelope).
    pub fn set_frequency(&self, frequency_hz: f64) {
        self.frequency
            .store(f64::to_bits(frequency_hz), Ordering::Relaxed);
    }

    /// Set volume (0.0–1.0). Will be exposed via Tauri command.
    #[allow(dead_code)]
    pub fn set_volume(&self, vol: f64) {
        let clamped = vol.clamp(0.0, 1.0);
        self.volume.store(f64::to_bits(clamped), Ordering::Relaxed);
    }

    pub fn is_playing(&self) -> bool {
        self.state.playing.load(Ordering::Acquire)
    }

    pub fn last_error(&self) -> Option<AudioError> {
        self.state.error.lock().unwrap().clone()
    }

    pub fn runtime_status(&self) -> DroneRuntimeStatus {
        DroneRuntimeStatus {
            is_playing: self.is_playing(),
            runtime_error: self.last_error().as_ref().map(AudioRuntimeError::from),
        }
    }
}

impl Drop for DroneSynth {
    fn drop(&mut self) {
        self.state.generation.fetch_add(1, Ordering::AcqRel);
        self.state.playing.store(false, Ordering::Release);
        let _ = self.owner.stop();
    }
}

impl DroneBackend for CpalDroneBackend {
    fn build(
        &mut self,
        frequency_hz: f64,
        frequency: Arc<std::sync::atomic::AtomicU64>,
        volume: Arc<std::sync::atomic::AtomicU64>,
        is_active: Arc<dyn Fn() -> bool + Send + Sync>,
        on_error: Arc<dyn Fn(AudioError) + Send + Sync>,
    ) -> Result<(Box<dyn OwnedDroneStream>, String), AudioError> {
        let host = cpal::default_host();
        let device = require_output_device(host.default_output_device())?;
        let config = find_output_config(&device).map_err(AudioError::Unknown)?;
        let sample_rate = config.sample_rate.0 as f64;
        let channels = config.channels as usize;
        frequency.store(f64::to_bits(frequency_hz), Ordering::Relaxed);
        let freq_atom = frequency;
        let vol_atom = volume;
        let mut phases = [0.0f64; PARTIALS.len()];
        let mut envelope = 0.0f64;
        let stream = device
            .build_output_stream(
                &config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    let freq = f64::from_bits(freq_atom.load(Ordering::Relaxed));
                    let vol = f64::from_bits(vol_atom.load(Ordering::Relaxed));
                    let active = is_active();
                    let envelope_step = 1.0 / (sample_rate * ENVELOPE_TIME);
                    for frame in data.chunks_mut(channels) {
                        if active && freq > 0.0 {
                            envelope = (envelope + envelope_step).min(1.0);
                        } else {
                            envelope = (envelope - envelope_step).max(0.0);
                        }
                        let mut sample = 0.0f64;
                        for (i, &(partial, amp)) in PARTIALS.iter().enumerate() {
                            let phase_inc = freq * partial / sample_rate;
                            phases[i] = (phases[i] + phase_inc) % 1.0;
                            sample += (phases[i] * 2.0 * std::f64::consts::PI).sin() * amp;
                        }
                        let out = (sample * MASTER_GAIN * vol * envelope) as f32;
                        frame.fill(out);
                    }
                },
                move |err| {
                    log::error!("Drone output stream error: {}", err);
                    on_error(AudioError::StreamInterrupted);
                },
                None,
            )
            .map_err(|e| AudioError::Unknown(format!("Failed to build output stream: {}", e)))?;
        Ok((
            Box::new(CpalDroneStream(stream)),
            device.name().unwrap_or_default(),
        ))
    }
}

fn require_output_device(device: Option<cpal::Device>) -> Result<cpal::Device, AudioError> {
    device.ok_or(AudioError::NoAudioOutputAvailable)
}

fn find_output_config(device: &cpal::Device) -> Result<StreamConfig, String> {
    let configs: Vec<_> = device
        .supported_output_configs()
        .map_err(|e| format!("Failed to query output configs: {}", e))?
        .collect();
    for &target_rate in &[44100u32, 48000] {
        for cfg in &configs {
            if cfg.min_sample_rate().0 <= target_rate && cfg.max_sample_rate().0 >= target_rate {
                return Ok(StreamConfig {
                    channels: cfg.channels().min(2),
                    sample_rate: cpal::SampleRate(target_rate),
                    buffer_size: cpal::BufferSize::Default,
                });
            }
        }
    }
    Err("No suitable output config found".to_string())
}

// ── Note-to-frequency conversion ──

const NOTE_NAMES: [&str; 12] = [
    "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];

/// Convert a note name + octave to frequency in Hz using the given reference A4.
pub fn note_to_frequency(note_name: &str, octave: i8, reference_a4: f64) -> Option<f64> {
    let note_index = NOTE_NAMES.iter().position(|&n| n == note_name)? as i32;
    // MIDI note number: C4 = 60, A4 = 69
    let midi = (octave as i32 + 1) * 12 + note_index;
    let semitones_from_a4 = midi - 69;
    Some(reference_a4 * 2.0f64.powf(semitones_from_a4 as f64 / 12.0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    type ErrorCallback = Arc<dyn Fn(AudioError) + Send + Sync>;
    #[derive(Clone, Copy)]
    enum Plan {
        BuildFail,
        PlayFail,
        Ok,
        Slow,
        VerySlow,
    }
    struct FakeBackend {
        plans: Arc<std::sync::Mutex<VecDeque<Plan>>>,
        callbacks: Arc<std::sync::Mutex<Vec<ErrorCallback>>>,
    }
    struct FakeStream {
        fail: bool,
        delay: Duration,
    }
    impl OwnedDroneStream for FakeStream {
        fn play(&mut self) -> Result<(), AudioError> {
            if !self.delay.is_zero() {
                thread::sleep(self.delay);
            }
            if self.fail {
                Err(AudioError::Unknown("play failed".into()))
            } else {
                Ok(())
            }
        }
    }
    impl DroneBackend for FakeBackend {
        fn build(
            &mut self,
            _hz: f64,
            _frequency: Arc<AtomicU64>,
            _volume: Arc<AtomicU64>,
            _active: Arc<dyn Fn() -> bool + Send + Sync>,
            callback: ErrorCallback,
        ) -> Result<(Box<dyn OwnedDroneStream>, String), AudioError> {
            let plan = self.plans.lock().unwrap().pop_front().unwrap();
            if matches!(plan, Plan::BuildFail) {
                return Err(AudioError::Unknown("build failed".into()));
            }
            self.callbacks.lock().unwrap().push(callback);
            Ok((
                Box::new(FakeStream {
                    fail: matches!(plan, Plan::PlayFail),
                    delay: match plan {
                        Plan::Slow => Duration::from_millis(60),
                        Plan::VerySlow => Duration::from_millis(300),
                        _ => Duration::ZERO,
                    },
                }),
                "Test output".into(),
            ))
        }
    }
    fn drone(
        plans: Vec<Plan>,
        timeout: Duration,
    ) -> (DroneSynth, Arc<std::sync::Mutex<Vec<ErrorCallback>>>) {
        let callbacks = Arc::new(std::sync::Mutex::new(Vec::new()));
        let backend = FakeBackend {
            plans: Arc::new(std::sync::Mutex::new(plans.into())),
            callbacks: callbacks.clone(),
        };
        (
            DroneSynth::with_owner(Box::new(DroneOwner::spawn_with(Box::new(backend), timeout))),
            callbacks,
        )
    }

    #[test]
    fn production_protocol_reports_build_failure() {
        let (mut d, _) = drone(vec![Plan::BuildFail], Duration::from_secs(1));
        assert!(d.start(440.0).unwrap_err().contains("build failed"));
        assert!(!d.is_playing());
    }
    #[test]
    fn production_protocol_reports_play_failure() {
        let (mut d, _) = drone(vec![Plan::PlayFail], Duration::from_secs(1));
        assert!(d.start(440.0).unwrap_err().contains("play failed"));
        assert!(!d.is_playing());
    }
    #[test]
    fn runtime_error_stops_drone_with_typed_reason() {
        let (mut d, callbacks) = drone(vec![Plan::Ok], Duration::from_secs(1));
        d.start(440.0).unwrap();
        callbacks.lock().unwrap()[0](AudioError::StreamInterrupted);
        assert!(!d.is_playing());
        assert!(matches!(
            d.last_error(),
            Some(AudioError::StreamInterrupted)
        ));
        let status = d.runtime_status();
        assert!(!status.is_playing);
        let runtime_error = status.runtime_error.unwrap();
        assert_eq!(runtime_error.kind, "stream_interrupted");
        assert_eq!(runtime_error.message, "Audio stream interrupted");
    }
    #[test]
    fn stale_callback_cannot_stop_restarted_drone() {
        let (mut d, callbacks) = drone(vec![Plan::Ok, Plan::Ok], Duration::from_secs(1));
        d.start(440.0).unwrap();
        d.start(442.0).unwrap();
        callbacks.lock().unwrap()[0](AudioError::StreamInterrupted);
        assert!(d.is_playing());
    }
    #[test]
    fn acknowledgement_timeout_is_typed_and_invalidates_late_success() {
        let (mut d, _) = drone(vec![Plan::Slow], Duration::from_millis(5));
        assert!(d.start(440.0).unwrap_err().contains("unavailable"));
        thread::sleep(Duration::from_millis(80));
        assert!(!d.is_playing());
        assert!(matches!(
            d.last_error(),
            Some(AudioError::AudioSubsystemUnavailable)
        ));
    }

    #[test]
    fn known_wedged_owner_drop_detaches_without_waiting_for_worker() {
        let (mut d, _) = drone(vec![Plan::VerySlow], Duration::from_millis(5));
        assert!(d.start(440.0).unwrap_err().contains("unavailable"));
        let started = std::time::Instant::now();
        drop(d);
        assert!(started.elapsed() < Duration::from_millis(100));
    }

    #[test]
    fn missing_output_error_is_distinct_from_missing_microphone() {
        assert!(matches!(
            require_output_device(None),
            Err(AudioError::NoAudioOutputAvailable)
        ));
    }

    #[test]
    fn test_a4_frequency() {
        let freq = note_to_frequency("A", 4, 440.0).unwrap();
        assert!((freq - 440.0).abs() < 0.01);
    }

    #[test]
    fn test_a4_at_442() {
        let freq = note_to_frequency("A", 4, 442.0).unwrap();
        assert!((freq - 442.0).abs() < 0.01);
    }

    #[test]
    fn test_bb3() {
        let freq = note_to_frequency("Bb", 3, 440.0).unwrap();
        // Bb3 should be ~233.08 Hz at A=440
        assert!((freq - 233.08).abs() < 0.1);
    }

    #[test]
    fn test_c4() {
        let freq = note_to_frequency("C", 4, 440.0).unwrap();
        assert!((freq - 261.63).abs() < 0.1);
    }

    #[test]
    fn test_invalid_note() {
        assert!(note_to_frequency("X", 4, 440.0).is_none());
    }
}
