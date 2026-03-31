use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Host, Stream, StreamConfig};
use ringbuf::traits::{Consumer, Observer, Producer, Split};
use ringbuf::HeapRb;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::audio::types::{AudioDeviceInfo, AudioError};

/// Buffer size for the ring buffer (enough for ~1 second at 48kHz).
const RING_BUFFER_SIZE: usize = 48000;

/// Manages CPAL audio input stream.
/// Note: Stream is stored separately because CPAL's Stream is !Send.
pub struct AudioCapture {
    host: Host,
    consumer: Option<ringbuf::HeapCons<f32>>,
    sample_rate: u32,
    is_running: Arc<AtomicBool>,
}

// CPAL Stream handle — kept on the thread that created it.
// We use a global static to hold the stream since it's !Send.
static STREAM_HOLDER: std::sync::Mutex<Option<StreamHolder>> = std::sync::Mutex::new(None);

struct StreamHolder {
    _stream: Stream,
}

// Safety: Stream is only accessed from the main thread via STREAM_HOLDER.
// The stream callback runs on the audio thread but doesn't access StreamHolder.
unsafe impl Send for StreamHolder {}
unsafe impl Sync for StreamHolder {}

impl AudioCapture {
    pub fn new() -> Self {
        Self {
            host: cpal::default_host(),
            consumer: None,
            sample_rate: 44100,
            is_running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// List available audio input devices.
    pub fn list_devices(&self) -> Result<Vec<AudioDeviceInfo>, AudioError> {
        let default_name = self
            .host
            .default_input_device()
            .and_then(|d| d.name().ok())
            .unwrap_or_default();

        let devices = self
            .host
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

    /// Find a device by name, or return the default input device.
    fn get_device(&self, device_name: Option<&str>) -> Result<Device, AudioError> {
        if let Some(name) = device_name {
            let devices = self
                .host
                .input_devices()
                .map_err(|_| AudioError::NoMicrophoneAvailable)?;

            for device in devices {
                if device.name().ok().as_deref() == Some(name) {
                    return Ok(device);
                }
            }
            // Requested device not found, fall back to default
            log::warn!("Requested device '{}' not found, using default", name);
        }

        self.host
            .default_input_device()
            .ok_or(AudioError::NoMicrophoneAvailable)
    }

    /// Start capturing audio from the specified device (or default).
    pub fn start(&mut self, device_name: Option<&str>) -> Result<u32, AudioError> {
        if self.is_running.load(Ordering::Relaxed) {
            self.stop();
        }

        let device = self.get_device(device_name)?;

        // Find supported config (prefer 44100, fall back to 48000)
        let config = self.find_config(&device)?;
        self.sample_rate = config.sample_rate.0;

        // Create ring buffer
        let rb = HeapRb::<f32>::new(RING_BUFFER_SIZE);
        let (mut producer, consumer) = rb.split();
        self.consumer = Some(consumer);

        let is_running = self.is_running.clone();
        is_running.store(true, Ordering::Relaxed);

        let err_flag = is_running.clone();

        let stream = device
            .build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    // Write samples to ring buffer (drop if full — better than blocking audio thread)
                    let _ = producer.push_slice(data);
                },
                move |err| {
                    log::error!("CPAL stream error: {}", err);
                    err_flag.store(false, Ordering::Relaxed);
                },
                None, // no timeout
            )
            .map_err(|e| AudioError::Unknown(format!("Failed to build input stream: {}", e)))?;

        stream
            .play()
            .map_err(|e| AudioError::Unknown(format!("Failed to start stream: {}", e)))?;

        // Store stream in global holder (it's !Send so can't be in AudioCapture directly)
        let mut holder = STREAM_HOLDER.lock().unwrap();
        *holder = Some(StreamHolder { _stream: stream });

        log::info!(
            "Audio capture started: {} Hz, device: {}",
            self.sample_rate,
            device.name().unwrap_or_default()
        );

        Ok(self.sample_rate)
    }

    /// Stop the audio capture stream.
    pub fn stop(&mut self) {
        // Drop the stream from the global holder
        let mut holder = STREAM_HOLDER.lock().unwrap();
        *holder = None;
        self.consumer = None;
        self.is_running.store(false, Ordering::Relaxed);
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
        self.is_running.load(Ordering::Relaxed)
    }

    /// Find a suitable mono input config at 44100 or 48000 Hz.
    fn find_config(&self, device: &Device) -> Result<StreamConfig, AudioError> {
        let supported = device
            .supported_input_configs()
            .map_err(|_| AudioError::MicrophonePermissionDenied)?;

        let configs: Vec<_> = supported.collect();

        // Try preferred sample rates in order
        for &target_rate in &[44100u32, 48000] {
            for cfg in &configs {
                if cfg.channels() >= 1
                    && cfg.min_sample_rate().0 <= target_rate
                    && cfg.max_sample_rate().0 >= target_rate
                {
                    return Ok(StreamConfig {
                        channels: 1, // mono
                        sample_rate: cpal::SampleRate(target_rate),
                        buffer_size: cpal::BufferSize::Default,
                    });
                }
            }
        }

        Err(AudioError::UnsupportedSampleRate)
    }
}

impl Drop for AudioCapture {
    fn drop(&mut self) {
        // Drop the stream from the global holder
        if let Ok(mut holder) = STREAM_HOLDER.lock() {
            *holder = None;
        }
        self.is_running.store(false, Ordering::Relaxed);
    }
}
