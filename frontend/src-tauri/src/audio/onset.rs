use crate::audio::pitch::compute_rms;
use crate::audio::types::{OnsetEvent, OnsetType};

/// Energy-based onset detector.
pub struct OnsetDetector {
    /// Previous frame RMS for comparison.
    prev_rms: f32,
    /// Threshold multiplier: onset if current_rms > prev_rms * threshold.
    threshold: f32,
    /// Minimum RMS to consider (absolute noise floor).
    min_rms: f32,
    /// Minimum time between onsets in milliseconds (debounce).
    min_interval_ms: u64,
    /// Timestamp of last detected onset.
    last_onset_ms: u64,
}

impl OnsetDetector {
    pub fn new() -> Self {
        Self {
            prev_rms: 0.0,
            threshold: 3.0,  // current must be 3x previous to trigger
            min_rms: 0.02,   // ignore very quiet signals
            min_interval_ms: 100,
            last_onset_ms: 0,
        }
    }

    /// Process a frame and return an OnsetEvent if a new onset is detected.
    pub fn detect(&mut self, samples: &[f32], timestamp_ms: u64) -> Option<OnsetEvent> {
        let rms = compute_rms(samples);

        let result = if rms > self.min_rms
            && self.prev_rms > 0.0
            && rms > self.prev_rms * self.threshold
            && (self.last_onset_ms == 0 || timestamp_ms - self.last_onset_ms >= self.min_interval_ms)
        {
            self.last_onset_ms = timestamp_ms;
            Some(OnsetEvent {
                timestamp_ms,
                energy: rms,
                onset_type: OnsetType::Energy,
            })
        } else {
            None
        };

        self.prev_rms = rms;
        result
    }

    /// Reset detector state (e.g. when starting a new session).
    pub fn reset(&mut self) {
        self.prev_rms = 0.0;
        self.last_onset_ms = 0;
    }
}
