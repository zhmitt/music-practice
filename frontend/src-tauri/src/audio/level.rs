use crate::audio::types::AudioLevel;

/// Compute audio level metrics from a buffer of samples.
pub fn compute_level(samples: &[f32]) -> AudioLevel {
    if samples.is_empty() {
        return AudioLevel::default();
    }

    let mut sum_sq: f64 = 0.0;
    let mut peak: f32 = 0.0;

    for &s in samples {
        sum_sq += (s as f64) * (s as f64);
        let abs = s.abs();
        if abs > peak {
            peak = abs;
        }
    }

    let rms = (sum_sq / samples.len() as f64).sqrt() as f32;
    let is_clipping = peak > 0.99;

    AudioLevel {
        rms,
        peak,
        is_clipping,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_silence() {
        let level = compute_level(&[0.0; 1024]);
        assert_eq!(level.rms, 0.0);
        assert_eq!(level.peak, 0.0);
        assert!(!level.is_clipping);
    }

    #[test]
    fn test_clipping() {
        let samples: Vec<f32> = vec![1.0; 1024];
        let level = compute_level(&samples);
        assert!(level.is_clipping);
        assert!((level.peak - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_normal_signal() {
        let samples: Vec<f32> = vec![0.5, -0.5, 0.5, -0.5];
        let level = compute_level(&samples);
        assert!((level.rms - 0.5).abs() < 0.01);
        assert!((level.peak - 0.5).abs() < 0.01);
        assert!(!level.is_clipping);
    }
}
