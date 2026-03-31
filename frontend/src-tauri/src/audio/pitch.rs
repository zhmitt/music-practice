use crate::audio::instrument::{frequency_to_note, InstrumentProfile};
use crate::audio::types::{DisplayMode, PitchResult};

/// YIN pitch detection algorithm.
///
/// Reference: de Cheveigné, A., & Kawahara, H. (2002).
/// "YIN, a fundamental frequency estimator for speech and music."
pub struct PitchDetector {
    /// Sample rate in Hz.
    sample_rate: u32,
    /// YIN threshold for confidence (lower = stricter). Typical: 0.10–0.20.
    threshold: f64,
    /// Reference tuning for A4 in Hz.
    reference_a4: f64,
    /// Active instrument profile.
    profile: InstrumentProfile,
    /// Display mode (notated vs concert).
    display_mode: DisplayMode,
    /// Noise floor threshold (RMS below this = silence).
    noise_floor: f32,
}

impl PitchDetector {
    pub fn new(sample_rate: u32) -> Self {
        Self {
            sample_rate,
            threshold: 0.15,
            reference_a4: 442.0,
            profile: InstrumentProfile::horn_bb(),
            display_mode: DisplayMode::Notated,
            noise_floor: 0.01, // ~ -40 dBFS
        }
    }

    pub fn set_reference_a4(&mut self, hz: f64) {
        self.reference_a4 = hz.clamp(430.0, 450.0);
    }

    pub fn set_profile(&mut self, profile: InstrumentProfile) {
        self.profile = profile;
    }

    pub fn set_display_mode(&mut self, mode: DisplayMode) {
        self.display_mode = mode;
    }

    /// Detect pitch from a buffer of mono f32 samples.
    /// Returns None if signal is below noise floor or no confident pitch found.
    pub fn detect(&self, samples: &[f32], timestamp_ms: u64) -> Option<PitchResult> {
        // Check noise floor
        let rms = compute_rms(samples);
        if rms < self.noise_floor {
            return None;
        }

        // Run YIN
        let (frequency_hz, confidence) = self.yin(samples)?;

        // Filter by instrument range
        if !self.profile.in_range(frequency_hz) {
            return None;
        }

        // Map frequency to note
        let (concert_name, concert_octave, cent_deviation) =
            frequency_to_note(frequency_hz, self.reference_a4);

        // Apply transposition if in notated mode
        let (note_name, octave) = if self.display_mode == DisplayMode::Notated
            && self.profile.transposition_semitones != 0
        {
            crate::audio::instrument::transpose_note(
                &concert_name,
                concert_octave,
                self.profile.transposition_semitones,
            )
        } else {
            (concert_name, concert_octave)
        };

        Some(PitchResult {
            frequency_hz,
            note_name,
            octave,
            cent_deviation,
            confidence,
            timestamp_ms,
        })
    }

    /// Core YIN algorithm. Returns (frequency_hz, confidence) or None.
    fn yin(&self, samples: &[f32]) -> Option<(f64, f64)> {
        let n = samples.len();
        if n < 4 {
            return None;
        }
        let half = n / 2;

        // Step 1 & 2: Difference function + Cumulative mean normalized difference
        let mut d = vec![0.0f64; half];
        let mut d_prime = vec![0.0f64; half];

        // Difference function
        for tau in 1..half {
            let mut sum = 0.0f64;
            for j in 0..(n - tau) {
                let diff = samples[j] as f64 - samples[j + tau] as f64;
                sum += diff * diff;
            }
            d[tau] = sum;
        }

        // Cumulative mean normalized difference
        d_prime[0] = 1.0;
        let mut running_sum = 0.0;
        for tau in 1..half {
            running_sum += d[tau];
            if running_sum == 0.0 {
                d_prime[tau] = 1.0;
            } else {
                d_prime[tau] = d[tau] * tau as f64 / running_sum;
            }
        }

        // Step 3: Absolute threshold — find first dip below threshold
        let min_period = self.min_period();
        let max_period = self.max_period().min(half - 1);

        let mut best_tau = 0usize;
        let mut best_val = 1.0f64;

        for tau in min_period..=max_period {
            if d_prime[tau] < self.threshold {
                // Find the local minimum in this dip
                if tau + 1 < half && d_prime[tau] <= d_prime[tau + 1] {
                    best_tau = tau;
                    best_val = d_prime[tau];
                    break;
                }
            }
            if d_prime[tau] < best_val {
                best_val = d_prime[tau];
                best_tau = tau;
            }
        }

        if best_tau == 0 || best_val >= 1.0 {
            return None;
        }

        // Step 4: Parabolic interpolation for sub-sample accuracy
        let tau_refined = if best_tau > 0 && best_tau + 1 < half {
            let s0 = d_prime[best_tau - 1];
            let s1 = d_prime[best_tau];
            let s2 = d_prime[best_tau + 1];
            let adjustment = (s0 - s2) / (2.0 * (s0 - 2.0 * s1 + s2));
            if adjustment.is_finite() {
                best_tau as f64 + adjustment
            } else {
                best_tau as f64
            }
        } else {
            best_tau as f64
        };

        let frequency = self.sample_rate as f64 / tau_refined;
        let confidence = 1.0 - best_val;

        if confidence < 0.5 {
            return None;
        }

        Some((frequency, confidence))
    }

    /// Minimum period in samples (corresponds to max frequency).
    fn min_period(&self) -> usize {
        (self.sample_rate as f64 / self.profile.max_hz).floor() as usize
    }

    /// Maximum period in samples (corresponds to min frequency).
    fn max_period(&self) -> usize {
        (self.sample_rate as f64 / self.profile.min_hz).ceil() as usize
    }
}

/// Compute RMS of a sample buffer.
pub fn compute_rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum_sq: f64 = samples.iter().map(|&s| (s as f64) * (s as f64)).sum();
    (sum_sq / samples.len() as f64).sqrt() as f32
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    fn generate_sine(freq: f64, sample_rate: u32, num_samples: usize) -> Vec<f32> {
        (0..num_samples)
            .map(|i| (2.0 * PI * freq * i as f64 / sample_rate as f64).sin() as f32)
            .collect()
    }

    #[test]
    fn test_detect_a4_440() {
        let detector = PitchDetector {
            reference_a4: 440.0,
            display_mode: DisplayMode::Concert,
            profile: InstrumentProfile::default_profile(),
            ..PitchDetector::new(44100)
        };
        let samples = generate_sine(440.0, 44100, 2048);
        let result = detector.detect(&samples, 0).expect("Should detect A4");
        assert!((result.frequency_hz - 440.0).abs() < 2.0);
        assert_eq!(result.note_name, "A");
        assert_eq!(result.octave, 4);
        assert!(result.cent_deviation.abs() < 5.0);
    }

    #[test]
    fn test_detect_bb4() {
        let detector = PitchDetector {
            reference_a4: 440.0,
            display_mode: DisplayMode::Concert,
            profile: InstrumentProfile::default_profile(),
            ..PitchDetector::new(44100)
        };
        let samples = generate_sine(466.16, 44100, 2048);
        let result = detector.detect(&samples, 0).expect("Should detect Bb4");
        assert!((result.frequency_hz - 466.16).abs() < 2.0);
        assert_eq!(result.note_name, "Bb");
        assert_eq!(result.octave, 4);
    }

    #[test]
    fn test_silence_returns_none() {
        let detector = PitchDetector::new(44100);
        let samples = vec![0.0f32; 2048];
        assert!(detector.detect(&samples, 0).is_none());
    }

    #[test]
    fn test_rms() {
        let samples: Vec<f32> = vec![0.5, -0.5, 0.5, -0.5];
        let rms = compute_rms(&samples);
        assert!((rms - 0.5).abs() < 0.01);
    }
}
