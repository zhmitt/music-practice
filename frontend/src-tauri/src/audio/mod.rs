pub mod capture;
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
use instrument::InstrumentProfile;
use level::compute_level;
use onset::OnsetDetector;
use pitch::PitchDetector;
use stability::StabilityTracker;
use types::{AudioDeviceInfo, AudioError, AudioLevel, DisplayMode, PitchResult};

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
    /// Running sample count for timestamp calculation.
    samples_processed: u64,
    /// Processing thread handle.
    processing_handle: Option<thread::JoinHandle<()>>,
    /// Flag to stop processing thread.
    stop_flag: Arc<std::sync::atomic::AtomicBool>,
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
            samples_processed: 0,
            processing_handle: None,
            stop_flag: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }

    pub fn list_devices(&self) -> Result<Vec<AudioDeviceInfo>, AudioError> {
        self.capture.list_devices()
    }

    pub fn start(&mut self, device_name: Option<&str>) -> Result<(), AudioError> {
        let sample_rate = self.capture.start(device_name)?;

        // Reinitialize detectors with correct sample rate
        self.pitch_detector = PitchDetector::new(sample_rate);
        let hop_size = 1024;
        let readings_per_sec = sample_rate as f64 / hop_size as f64;
        self.stability_tracker = StabilityTracker::new(readings_per_sec, 442.0);
        self.onset_detector = OnsetDetector::new();
        self.samples_processed = 0;
        self.latest_pitch = None;
        self.latest_level = AudioLevel::default();

        Ok(())
    }

    pub fn stop(&mut self) {
        self.capture.stop();
        self.stop_flag
            .store(true, std::sync::atomic::Ordering::Relaxed);
    }

    /// Process available audio samples. Call this periodically from a timer or processing loop.
    pub fn process(&mut self) {
        let mut buffer = Vec::new();
        let count = self.capture.read_samples(&mut buffer);
        if count == 0 {
            return;
        }

        let sample_rate = self.capture.sample_rate();
        let hop_size = 1024usize;

        // Process in hop-sized chunks
        let mut offset = 0;
        while offset + hop_size <= buffer.len() {
            let chunk = &buffer[offset..offset + hop_size];
            let timestamp_ms =
                (self.samples_processed as f64 / sample_rate as f64 * 1000.0) as u64;

            // Level monitoring
            self.latest_level = compute_level(chunk);

            // Onset detection
            self.onset_detector.detect(chunk, timestamp_ms);

            self.samples_processed += hop_size as u64;
            offset += hop_size;
        }

        // Pitch detection on larger windows (2048 samples)
        let window_size = 2048;
        if buffer.len() >= window_size {
            // Use the last window_size samples for pitch detection
            let start = buffer.len() - window_size;
            let window = &buffer[start..];
            let timestamp_ms =
                (self.samples_processed as f64 / sample_rate as f64 * 1000.0) as u64;

            if let Some(pitch) = self.pitch_detector.detect(window, timestamp_ms) {
                // Feed stability tracker
                self.stability_tracker.push(pitch.frequency_hz);
                self.latest_pitch = Some(pitch);
            } else {
                // No pitch detected — if we had a note, compute stability
                if !self.stability_tracker.is_empty() {
                    // Note ended, could emit stability measurement here
                    self.stability_tracker.reset();
                }
                self.latest_pitch = None;
            }
        }
    }

    pub fn latest_pitch(&self) -> Option<PitchResult> {
        self.latest_pitch.clone()
    }

    pub fn latest_level(&self) -> AudioLevel {
        self.latest_level.clone()
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

/// Start a background processing loop for the engine.
/// The loop reads audio, processes it, and updates state at ~60Hz.
pub fn start_processing_loop(engine: SharedEngine) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        loop {
            {
                let mut eng = engine.lock().unwrap();
                if !eng.is_running() {
                    // Sleep longer when not running
                    drop(eng);
                    thread::sleep(Duration::from_millis(100));
                    continue;
                }
                eng.process();
            }
            // ~60Hz processing rate
            thread::sleep(Duration::from_millis(16));
        }
    })
}
