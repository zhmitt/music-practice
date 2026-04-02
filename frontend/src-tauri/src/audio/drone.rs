use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Host, Stream, StreamConfig};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Drone synthesizer — generates a warm, brass-like sustained tone via CPAL output.
///
/// Uses additive synthesis: fundamental + overtones at decreasing amplitudes
/// with a gentle attack/release envelope to avoid clicks.
pub struct DroneSynth {
    host: Host,
    is_playing: Arc<AtomicBool>,
    /// Shared fundamental frequency (written atomically from main thread).
    frequency: Arc<std::sync::atomic::AtomicU64>,
    /// Master volume 0.0–1.0 stored as u64 bits.
    volume: Arc<std::sync::atomic::AtomicU64>,
}

/// CPAL output stream holder — kept on the thread that created it (!Send).
static DRONE_STREAM_HOLDER: std::sync::Mutex<Option<DroneStreamHolder>> =
    std::sync::Mutex::new(None);

struct DroneStreamHolder {
    _stream: Stream,
}

unsafe impl Send for DroneStreamHolder {}
unsafe impl Sync for DroneStreamHolder {}

/// Overtone recipe for a warm, brass-like timbre.
/// (partial_number, relative_amplitude)
const PARTIALS: [(f64, f64); 5] = [
    (1.0, 1.0),   // fundamental
    (2.0, 0.45),  // octave
    (3.0, 0.20),  // twelfth
    (4.0, 0.10),  // double octave
    (5.0, 0.04),  // major third + 2 octaves
];

/// Master gain — keep low to prevent clipping.
const MASTER_GAIN: f64 = 0.18;

/// Attack/release time in seconds (smooth fade to avoid clicks).
const ENVELOPE_TIME: f64 = 0.08;

impl DroneSynth {
    pub fn new() -> Self {
        Self {
            host: cpal::default_host(),
            is_playing: Arc::new(AtomicBool::new(false)),
            frequency: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            volume: Arc::new(std::sync::atomic::AtomicU64::new(
                f64::to_bits(0.7),
            )),
        }
    }

    /// Start the drone at the given concert-pitch frequency.
    pub fn start(&mut self, frequency_hz: f64) -> Result<(), String> {
        // Stop any existing drone first
        self.stop();

        let device = self
            .host
            .default_output_device()
            .ok_or("No output device available")?;

        let config = self.find_output_config(&device)?;
        let sample_rate = config.sample_rate.0 as f64;
        let channels = config.channels as usize;

        // Set frequency
        self.frequency
            .store(f64::to_bits(frequency_hz), Ordering::Relaxed);
        self.is_playing.store(true, Ordering::Relaxed);

        let freq_atom = self.frequency.clone();
        let vol_atom = self.volume.clone();
        let is_playing = self.is_playing.clone();

        // Phase accumulator per partial
        let mut phases = [0.0f64; PARTIALS.len()];
        let mut envelope = 0.0f64; // 0→1 ramp

        let stream = device
            .build_output_stream(
                &config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    let freq = f64::from_bits(freq_atom.load(Ordering::Relaxed));
                    let vol = f64::from_bits(vol_atom.load(Ordering::Relaxed));
                    let playing = is_playing.load(Ordering::Relaxed);

                    let envelope_step = 1.0 / (sample_rate * ENVELOPE_TIME);

                    for frame in data.chunks_mut(channels) {
                        // Envelope
                        if playing && freq > 0.0 {
                            envelope = (envelope + envelope_step).min(1.0);
                        } else {
                            envelope = (envelope - envelope_step).max(0.0);
                        }

                        let mut sample = 0.0f64;
                        for (i, &(partial, amp)) in PARTIALS.iter().enumerate() {
                            let partial_freq = freq * partial;
                            let phase_inc = partial_freq / sample_rate;
                            phases[i] = (phases[i] + phase_inc) % 1.0;

                            // Sine oscillator
                            let osc =
                                (phases[i] * 2.0 * std::f64::consts::PI).sin();
                            sample += osc * amp;
                        }

                        let out = (sample * MASTER_GAIN * vol * envelope) as f32;
                        for ch in frame.iter_mut() {
                            *ch = out;
                        }
                    }
                },
                move |err| {
                    log::error!("Drone output stream error: {}", err);
                },
                None,
            )
            .map_err(|e| format!("Failed to build output stream: {}", e))?;

        stream
            .play()
            .map_err(|e| format!("Failed to start output stream: {}", e))?;

        // Store in global holder
        let mut holder = DRONE_STREAM_HOLDER.lock().unwrap();
        *holder = Some(DroneStreamHolder { _stream: stream });

        log::info!(
            "Drone started: {:.1} Hz, device: {}",
            frequency_hz,
            device.name().unwrap_or_default()
        );

        Ok(())
    }

    /// Stop the drone with a quick fade-out.
    pub fn stop(&mut self) {
        self.is_playing.store(false, Ordering::Relaxed);
        // Give the envelope time to fade out before dropping the stream
        std::thread::sleep(std::time::Duration::from_millis(100));

        let mut holder = DRONE_STREAM_HOLDER.lock().unwrap();
        *holder = None;

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
        self.volume
            .store(f64::to_bits(clamped), Ordering::Relaxed);
    }

    pub fn is_playing(&self) -> bool {
        self.is_playing.load(Ordering::Relaxed)
    }

    /// Find a suitable stereo output config at 44100 or 48000 Hz.
    fn find_output_config(&self, device: &cpal::Device) -> Result<StreamConfig, String> {
        let supported = device
            .supported_output_configs()
            .map_err(|e| format!("Failed to query output configs: {}", e))?;

        let configs: Vec<_> = supported.collect();

        for &target_rate in &[44100u32, 48000] {
            for cfg in &configs {
                if cfg.min_sample_rate().0 <= target_rate
                    && cfg.max_sample_rate().0 >= target_rate
                {
                    return Ok(StreamConfig {
                        channels: cfg.channels().min(2), // stereo or mono
                        sample_rate: cpal::SampleRate(target_rate),
                        buffer_size: cpal::BufferSize::Default,
                    });
                }
            }
        }

        Err("No suitable output config found".to_string())
    }
}

impl Drop for DroneSynth {
    fn drop(&mut self) {
        self.is_playing.store(false, Ordering::Relaxed);
        if let Ok(mut holder) = DRONE_STREAM_HOLDER.lock() {
            *holder = None;
        }
    }
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
