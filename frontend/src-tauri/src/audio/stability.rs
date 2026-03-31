use crate::audio::instrument::frequency_to_note;
use crate::audio::types::StabilityMeasurement;

/// Accumulates frequency readings for stability measurement.
pub struct StabilityTracker {
    /// Frequency readings in Hz.
    readings: Vec<f64>,
    /// Sample rate of readings (how many per second).
    readings_per_sec: f64,
    /// Reference A4 for note mapping.
    reference_a4: f64,
}

impl StabilityTracker {
    pub fn new(readings_per_sec: f64, reference_a4: f64) -> Self {
        Self {
            readings: Vec::with_capacity(256),
            readings_per_sec,
            reference_a4,
        }
    }

    /// Add a frequency reading.
    pub fn push(&mut self, frequency_hz: f64) {
        self.readings.push(frequency_hz);
    }

    /// Clear all readings (new note).
    pub fn reset(&mut self) {
        self.readings.clear();
    }

    pub fn set_reference_a4(&mut self, hz: f64) {
        self.reference_a4 = hz;
    }

    /// Compute stability measurement. Returns None if duration < 500ms.
    pub fn compute(&self) -> Option<StabilityMeasurement> {
        if self.readings.is_empty() {
            return None;
        }

        let duration_ms = (self.readings.len() as f64 / self.readings_per_sec * 1000.0) as u64;

        // Minimum 500ms
        if duration_ms < 500 {
            return None;
        }

        let n = self.readings.len() as f64;
        let mean: f64 = self.readings.iter().sum::<f64>() / n;

        // Population standard deviation
        let variance: f64 = self.readings.iter().map(|&f| (f - mean).powi(2)).sum::<f64>() / n;
        let std_deviation = variance.sqrt();

        let (note_name, octave, _) = frequency_to_note(mean, self.reference_a4);

        Some(StabilityMeasurement {
            mean_frequency: mean,
            std_deviation,
            duration_ms,
            note_name,
            octave,
        })
    }

    /// Number of readings accumulated.
    pub fn len(&self) -> usize {
        self.readings.len()
    }

    pub fn is_empty(&self) -> bool {
        self.readings.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stable_tone() {
        let mut tracker = StabilityTracker::new(43.0, 440.0); // ~43 readings/sec at 1024 hop
        // Simulate 2 seconds of perfectly stable 440 Hz
        for _ in 0..86 {
            tracker.push(440.0);
        }
        let m = tracker.compute().expect("Should compute stability");
        assert!((m.mean_frequency - 440.0).abs() < 0.01);
        assert!(m.std_deviation < 0.01);
        assert_eq!(m.note_name, "A");
        assert_eq!(m.octave, 4);
    }

    #[test]
    fn test_wobbly_tone() {
        let mut tracker = StabilityTracker::new(43.0, 440.0);
        // Simulate 2 seconds of tone wobbling between 438 and 442
        for i in 0..86 {
            let freq = 440.0 + 2.0 * (i as f64 * 0.5).sin();
            tracker.push(freq);
        }
        let m = tracker.compute().expect("Should compute stability");
        assert!(m.std_deviation > 0.5); // should show measurable deviation
    }

    #[test]
    fn test_too_short() {
        let mut tracker = StabilityTracker::new(43.0, 440.0);
        // Only ~10 readings = ~230ms, below 500ms minimum
        for _ in 0..10 {
            tracker.push(440.0);
        }
        assert!(tracker.compute().is_none());
    }
}
