pub mod capture;
pub mod drone;
pub mod instrument;
pub mod level;
pub mod onset;
pub mod pitch;
pub mod stability;
pub mod types;

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use capture::AudioCapture;
use drone::DroneSynth;
use instrument::InstrumentProfile;
use level::compute_level;
use onset::OnsetDetector;
use pitch::PitchDetector;
use stability::StabilityTracker;
use types::{
    AudioDebugSnapshot, AudioDeviceInfo, AudioError, AudioLevel, AudioRuntimeError, DisplayMode,
    PitchResult,
};

#[derive(Debug, Clone, serde::Serialize)]
pub struct AudioHardwareSmokeReport {
    pub input_devices: Vec<AudioDeviceInfo>,
    pub active_device_name: Option<String>,
    pub sample_rate: u32,
    pub samples_received: usize,
    pub elapsed_ms: u64,
    pub drone_frequency_hz: f64,
    pub drone_play_duration_ms: u64,
    pub drone_status_after_start: String,
    pub drone_status_after_stop: String,
}

/// Exercise the production CPAL capture owner without starting the Tauri UI.
/// The caller is responsible for obtaining explicit user consent before invoking it.
pub fn run_audio_hardware_smoke(timeout: Duration) -> Result<AudioHardwareSmokeReport, AudioError> {
    let timeout = timeout.clamp(Duration::from_millis(250), Duration::from_secs(10));
    let mut capture = AudioCapture::new();
    let input_devices = capture.list_devices()?;
    let sample_rate = capture.start(None)?;
    let active_device_name = capture.active_device_name();
    let started = std::time::Instant::now();
    let mut samples_received = 0usize;
    let mut samples = Vec::new();
    while started.elapsed() < timeout {
        samples_received += capture.read_samples(&mut samples);
        if samples_received >= 1024 {
            break;
        }
        if !capture.is_running() {
            let error = capture
                .last_error()
                .unwrap_or(AudioError::StreamInterrupted);
            capture.stop();
            return Err(error);
        }
        thread::sleep(Duration::from_millis(20));
    }
    capture.stop();
    if samples_received == 0 {
        return Err(AudioError::Unknown(
            "Microphone opened but delivered no samples before timeout".to_string(),
        ));
    }
    const DRONE_FREQUENCY_HZ: f64 = 440.0;
    const DRONE_PLAY_DURATION: Duration = Duration::from_millis(250);
    let capture_elapsed_ms = started.elapsed().as_millis() as u64;
    let mut drone = DroneSynth::new();
    drone
        .start(DRONE_FREQUENCY_HZ)
        .map_err(|error| AudioError::Unknown(format!("Drone smoke start failed: {error}")))?;
    let started_status = drone.runtime_status();
    if !started_status.is_playing {
        drone.stop();
        return Err(started_status.runtime_error.map_or_else(
            || AudioError::Unknown("Drone did not enter playing state".to_string()),
            |error| AudioError::Unknown(format!("Drone runtime failed: {}", error.message)),
        ));
    }
    thread::sleep(DRONE_PLAY_DURATION);
    let runtime_status = drone.runtime_status();
    if !runtime_status.is_playing || runtime_status.runtime_error.is_some() {
        drone.stop();
        return Err(runtime_status.runtime_error.map_or_else(
            || AudioError::Unknown("Drone left playing state before stop".to_string()),
            |error| AudioError::Unknown(format!("Drone runtime failed: {}", error.message)),
        ));
    }
    drone.stop();
    let stopped_status = drone.runtime_status();
    if stopped_status.is_playing {
        return Err(AudioError::Unknown(
            "Drone did not enter stopped state".to_string(),
        ));
    }

    Ok(AudioHardwareSmokeReport {
        input_devices,
        active_device_name,
        sample_rate,
        samples_received,
        elapsed_ms: capture_elapsed_ms,
        drone_frequency_hz: DRONE_FREQUENCY_HZ,
        drone_play_duration_ms: DRONE_PLAY_DURATION.as_millis() as u64,
        drone_status_after_start: "playing".to_string(),
        drone_status_after_stop: "stopped".to_string(),
    })
}

#[cfg(test)]
mod hardware_smoke_report_tests {
    use super::*;

    #[test]
    fn report_serializes_explicit_drone_lifecycle_without_quality_claims() {
        let report = AudioHardwareSmokeReport {
            input_devices: vec![],
            active_device_name: None,
            sample_rate: 48_000,
            samples_received: 1024,
            elapsed_ms: 50,
            drone_frequency_hz: 440.0,
            drone_play_duration_ms: 250,
            drone_status_after_start: "playing".to_string(),
            drone_status_after_stop: "stopped".to_string(),
        };
        let value = serde_json::to_value(report).unwrap();
        assert_eq!(value["drone_status_after_start"], "playing");
        assert_eq!(value["drone_status_after_stop"], "stopped");
        assert!(value.get("audio_quality").is_none());
    }
}

/// Thread-safe wrapper around DroneSynth (separate from engine to avoid lock contention).
pub type SharedDrone = Arc<Mutex<DroneSynth>>;

/// Central audio engine managing capture, processing, and state.
pub struct AudioEngine {
    capture: AudioCapture,
    pitch_detector: PitchDetector,
    onset_detector: OnsetDetector,
    stability_tracker: StabilityTracker,
    /// Latest pitch result (None if no pitch detected).
    latest_pitch: Option<PitchResult>,
    /// Latest audio level.
    latest_level: AudioLevel,
    /// Rolling sample buffer for pitch analysis across processing ticks.
    analysis_buffer: Vec<f32>,
    /// Pitch window size in samples.
    pitch_window_size: usize,
    /// Latest debug snapshot for in-app inspection.
    latest_debug: AudioDebugSnapshot,
    /// Running sample count for timestamp calculation.
    samples_processed: u64,
}

/// Thread-safe wrapper around AudioEngine.
pub type SharedEngine = Arc<Mutex<AudioEngine>>;

impl AudioEngine {
    pub fn new() -> Self {
        let capture = AudioCapture::new();
        let sample_rate = capture.sample_rate();
        let hop_size = 1024;
        let readings_per_sec = sample_rate as f64 / hop_size as f64;

        Self {
            capture,
            pitch_detector: PitchDetector::new(sample_rate),
            onset_detector: OnsetDetector::new(),
            stability_tracker: StabilityTracker::new(readings_per_sec, 442.0),
            latest_pitch: None,
            latest_level: AudioLevel::default(),
            analysis_buffer: Vec::with_capacity(8192),
            pitch_window_size: 4096,
            latest_debug: AudioDebugSnapshot::default(),
            samples_processed: 0,
        }
    }

    pub fn list_devices(&self) -> Result<Vec<AudioDeviceInfo>, AudioError> {
        self.capture.list_devices()
    }

    pub fn start(&mut self, device_name: Option<&str>) -> Result<(), AudioError> {
        let reference_a4 = self.pitch_detector.reference_a4();
        let profile = self.pitch_detector.profile();
        let display_mode = self.pitch_detector.display_mode();
        let sample_rate = self.capture.start(device_name)?;

        // Reinitialize detectors with correct sample rate
        self.pitch_detector = PitchDetector::new(sample_rate);
        self.pitch_detector.set_reference_a4(reference_a4);
        self.pitch_detector.set_profile(profile);
        self.pitch_detector.set_display_mode(display_mode);
        let hop_size = 1024;
        let readings_per_sec = sample_rate as f64 / hop_size as f64;
        self.stability_tracker = StabilityTracker::new(readings_per_sec, reference_a4);
        self.onset_detector = OnsetDetector::new();
        self.samples_processed = 0;
        self.latest_pitch = None;
        self.latest_level = AudioLevel::default();
        self.analysis_buffer.clear();
        self.latest_debug = AudioDebugSnapshot {
            is_running: true,
            sample_rate,
            active_device_name: self.capture.active_device_name(),
            runtime_error: self
                .capture
                .last_error()
                .as_ref()
                .map(AudioRuntimeError::from),
            detector_status: "buffering".to_string(),
            audio_level: AudioLevel::default(),
            analysis_buffer_len: 0,
            window_size: self.pitch_window_size,
            raw_frequency_hz: None,
            raw_confidence: None,
            tentative_pitch: None,
            latest_pitch: None,
            reference_a4,
            instrument_name: self.pitch_detector.profile().name,
            display_mode: match self.pitch_detector.display_mode() {
                DisplayMode::Concert => "concert".to_string(),
                DisplayMode::Notated => "notated".to_string(),
            },
        };

        Ok(())
    }

    pub fn stop(&mut self) {
        self.capture.stop();
    }

    /// Process available audio samples. Call this periodically from a timer or processing loop.
    pub fn process(&mut self) {
        // Runtime interruption serializes behind this complete batch, so a callback
        // cannot invalidate capture between sample validation and analysis commit.
        let processing_gate = self.capture.processing_gate();
        let _processing = processing_gate.lock().unwrap();
        let mut buffer = Vec::new();
        let count = self.capture.read_samples(&mut buffer);
        self.latest_debug.is_running = self.capture.is_running();
        self.latest_debug.sample_rate = self.capture.sample_rate();
        self.latest_debug.active_device_name = self.capture.active_device_name();
        self.latest_debug.runtime_error = self
            .capture
            .last_error()
            .as_ref()
            .map(AudioRuntimeError::from);
        self.latest_debug.reference_a4 = self.pitch_detector.reference_a4();
        self.latest_debug.instrument_name = self.pitch_detector.profile().name;
        self.latest_debug.display_mode = match self.pitch_detector.display_mode() {
            DisplayMode::Concert => "concert".to_string(),
            DisplayMode::Notated => "notated".to_string(),
        };

        if count == 0 {
            if !self.capture.is_running() {
                self.latest_debug.detector_status = "idle".to_string();
                self.analysis_buffer.clear();
                self.latest_pitch = None;
                self.latest_level = AudioLevel::default();
                self.latest_debug.audio_level = AudioLevel::default();
                self.latest_debug.analysis_buffer_len = 0;
                self.latest_debug.raw_frequency_hz = None;
                self.latest_debug.raw_confidence = None;
                self.latest_debug.tentative_pitch = None;
                self.latest_debug.latest_pitch = None;
                self.stability_tracker.reset();
            }
            return;
        }

        let sample_rate = self.capture.sample_rate();
        let hop_size = 1024usize;

        // Process in hop-sized chunks
        let mut offset = 0;
        while offset + hop_size <= buffer.len() {
            let chunk = &buffer[offset..offset + hop_size];
            let timestamp_ms = (self.samples_processed as f64 / sample_rate as f64 * 1000.0) as u64;

            // Level monitoring
            self.latest_level = compute_level(chunk);

            // Onset detection
            self.onset_detector.detect(chunk, timestamp_ms);

            self.samples_processed += hop_size as u64;
            offset += hop_size;
        }

        self.analysis_buffer.extend_from_slice(&buffer);
        let max_analysis_len = self.pitch_window_size * 3;
        if self.analysis_buffer.len() > max_analysis_len {
            let overflow = self.analysis_buffer.len() - max_analysis_len;
            self.analysis_buffer.drain(0..overflow);
        }

        self.latest_debug.audio_level = self.latest_level.clone();
        self.latest_debug.analysis_buffer_len = self.analysis_buffer.len();
        self.latest_debug.window_size = self.pitch_window_size;

        if self.analysis_buffer.len() < self.pitch_window_size {
            self.latest_debug.detector_status = "buffering".to_string();
            self.latest_debug.raw_frequency_hz = None;
            self.latest_debug.raw_confidence = None;
            self.latest_debug.tentative_pitch = None;
            self.latest_debug.latest_pitch = None;
            self.latest_pitch = None;
            return;
        }

        let start = self.analysis_buffer.len() - self.pitch_window_size;
        let window = &self.analysis_buffer[start..];
        let timestamp_ms = (self.samples_processed as f64 / sample_rate as f64 * 1000.0) as u64;

        let analysis = self.pitch_detector.analyze(window, timestamp_ms);
        self.latest_debug.detector_status = analysis.status.to_string();
        self.latest_debug.raw_frequency_hz = analysis.raw_frequency_hz;
        self.latest_debug.raw_confidence = analysis.raw_confidence;
        self.latest_debug.tentative_pitch = analysis.tentative_pitch.clone();
        self.latest_debug.latest_pitch = analysis.detected_pitch.clone();

        if let Some(pitch) = analysis.detected_pitch {
            self.stability_tracker.push(pitch.frequency_hz);
            self.latest_pitch = Some(pitch);
        } else {
            if !self.stability_tracker.is_empty() {
                self.stability_tracker.reset();
            }
            self.latest_pitch = None;
        }
    }

    pub fn latest_pitch(&self) -> Option<PitchResult> {
        self.latest_pitch.clone()
    }

    pub fn latest_level(&self) -> AudioLevel {
        self.latest_level.clone()
    }

    pub fn latest_debug(&self) -> AudioDebugSnapshot {
        let mut snapshot = self.latest_debug.clone();
        snapshot.is_running = self.capture.is_running();
        snapshot.active_device_name = self.capture.active_device_name();
        snapshot.runtime_error = self
            .capture
            .last_error()
            .as_ref()
            .map(AudioRuntimeError::from);
        if !snapshot.is_running {
            snapshot.detector_status = "idle".to_string();
            snapshot.audio_level = AudioLevel::default();
            snapshot.analysis_buffer_len = 0;
            snapshot.raw_frequency_hz = None;
            snapshot.raw_confidence = None;
            snapshot.tentative_pitch = None;
            snapshot.latest_pitch = None;
        }
        snapshot
    }

    pub fn set_reference_tuning(&mut self, hz: f64) {
        self.pitch_detector.set_reference_a4(hz);
        self.stability_tracker.set_reference_a4(hz);
    }

    pub fn set_instrument_profile(&mut self, profile: InstrumentProfile) {
        self.pitch_detector.set_profile(profile);
    }

    pub fn set_display_mode(&mut self, mode: DisplayMode) {
        self.pitch_detector.set_display_mode(mode);
    }

    pub fn is_running(&self) -> bool {
        self.capture.is_running()
    }
}

/// Create a shared engine instance.
pub fn create_engine() -> SharedEngine {
    Arc::new(Mutex::new(AudioEngine::new()))
}

/// Create a shared drone synth instance.
pub fn create_drone() -> SharedDrone {
    Arc::new(Mutex::new(DroneSynth::new()))
}

/// Owns cancellation and deterministic teardown for the processing worker.
pub struct ProcessingLoop {
    cancel: Arc<std::sync::atomic::AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl ProcessingLoop {
    pub fn shutdown(&mut self) {
        self.cancel
            .store(true, std::sync::atomic::Ordering::Release);
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for ProcessingLoop {
    fn drop(&mut self) {
        self.shutdown();
    }
}

/// Start a cancellable background processing loop for the engine.
pub fn start_processing_loop(engine: SharedEngine) -> ProcessingLoop {
    let cancel = Arc::new(std::sync::atomic::AtomicBool::new(false));
    let worker_cancel = cancel.clone();
    let handle = thread::spawn(move || loop {
        if worker_cancel.load(std::sync::atomic::Ordering::Acquire) {
            break;
        }
        let was_running = {
            let mut eng = engine.lock().unwrap();
            let was_running = eng.is_running();
            eng.process();
            was_running
        };
        thread::sleep(if was_running {
            Duration::from_millis(16)
        } else {
            Duration::from_millis(100)
        });
    });
    ProcessingLoop {
        cancel,
        handle: Some(handle),
    }
}

#[cfg(test)]
mod processing_loop_tests {
    use super::*;

    #[test]
    fn app_like_processing_loop_shutdown_releases_engine_clone() {
        let engine = create_engine();
        let weak_engine = Arc::downgrade(&engine);
        let mut processing_loop = start_processing_loop(engine.clone());
        drop(engine);

        let started = std::time::Instant::now();
        processing_loop.shutdown();
        assert!(started.elapsed() < Duration::from_millis(250));
        assert!(weak_engine.upgrade().is_none());
    }
}
