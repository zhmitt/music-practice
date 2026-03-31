use serde::{Deserialize, Serialize};

/// Instrument profile for pitch detection configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstrumentProfile {
    /// Display name of the instrument.
    pub name: String,
    /// Transposition offset in semitones (concert → notated).
    /// HornBb = +2, HornF = +7, Concert pitch = 0.
    pub transposition_semitones: i8,
    /// Minimum detectable frequency in Hz (concert pitch).
    pub min_hz: f64,
    /// Maximum detectable frequency in Hz (concert pitch).
    pub max_hz: f64,
    /// Typical harmonic partial ratios for this instrument.
    /// Used for harmonic rejection weighting.
    pub typical_partials: Vec<f64>,
}

impl InstrumentProfile {
    /// Horn in Bb (transposition: written note sounds 1 whole step lower).
    /// Written range: Bb2–Bb6, Concert range: Ab2–Ab6.
    /// Transposition: +2 semitones (concert → notated).
    pub fn horn_bb() -> Self {
        Self {
            name: "Horn in Bb".to_string(),
            transposition_semitones: 2,
            min_hz: 87.0,   // F2 concert (~87.3 Hz)
            max_hz: 1397.0, // F6 concert (~1396.9 Hz)
            typical_partials: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        }
    }

    /// Horn in F (transposition: written note sounds a perfect fifth lower).
    /// Written range: F2–C6, Concert range: Bb1–F5.
    /// Transposition: +7 semitones (concert → notated).
    pub fn horn_f() -> Self {
        Self {
            name: "Horn in F".to_string(),
            transposition_semitones: 7,
            min_hz: 58.0,   // Bb1 concert (~58.3 Hz)
            max_hz: 1397.0, // F6 concert
            typical_partials: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        }
    }

    /// Default profile for unknown / concert-pitch instruments.
    pub fn default_profile() -> Self {
        Self {
            name: "Default".to_string(),
            transposition_semitones: 0,
            min_hz: 65.0,   // C2
            max_hz: 2093.0, // C7
            typical_partials: vec![1.0, 2.0, 3.0],
        }
    }

    /// Check if a frequency is within this instrument's playable range.
    pub fn in_range(&self, frequency_hz: f64) -> bool {
        frequency_hz >= self.min_hz && frequency_hz <= self.max_hz
    }
}

// ── Note Mapping (12-TET Equal Temperament) ─────────────────────────

/// Note names in chromatic order. Uses flats for horn tradition (Bb not A#, Eb not D#).
const NOTE_NAMES: [&str; 12] = [
    "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];

/// Convert a frequency to the nearest note name, octave, and cent deviation.
/// Uses the given reference frequency for A4.
pub fn frequency_to_note(frequency_hz: f64, reference_a4: f64) -> (String, i8, f64) {
    // Number of semitones from A4
    let semitones_from_a4 = 12.0 * (frequency_hz / reference_a4).log2();
    let nearest_semitone = semitones_from_a4.round() as i32;
    let cent_deviation = (semitones_from_a4 - nearest_semitone as f64) * 100.0;

    // A4 is MIDI note 69, which is index 9 in octave 4
    let midi_note = 69 + nearest_semitone;
    let note_index = ((midi_note % 12) + 12) % 12; // ensure positive
    let octave = (midi_note / 12) - 1; // MIDI octave convention

    let note_name = NOTE_NAMES[note_index as usize].to_string();
    (note_name, octave as i8, cent_deviation)
}

/// Apply transposition offset to get notated note name.
/// offset_semitones is positive (e.g. +2 for Bb horn: concert C → notated D).
pub fn transpose_note(
    concert_note_name: &str,
    concert_octave: i8,
    offset_semitones: i8,
) -> (String, i8) {
    let concert_index = NOTE_NAMES
        .iter()
        .position(|&n| n == concert_note_name)
        .unwrap_or(0) as i32;

    let midi = (concert_octave as i32 + 1) * 12 + concert_index + offset_semitones as i32;
    let note_index = ((midi % 12) + 12) % 12;
    let octave = (midi / 12) - 1;

    (NOTE_NAMES[note_index as usize].to_string(), octave as i8)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_a4_at_440() {
        let (name, octave, cents) = frequency_to_note(440.0, 440.0);
        assert_eq!(name, "A");
        assert_eq!(octave, 4);
        assert!(cents.abs() < 0.1);
    }

    #[test]
    fn test_a4_at_442_reference() {
        let (name, octave, cents) = frequency_to_note(442.0, 440.0);
        assert_eq!(name, "A");
        assert_eq!(octave, 4);
        assert!((cents - 7.85).abs() < 0.1);
    }

    #[test]
    fn test_bb4() {
        let (name, octave, _) = frequency_to_note(466.16, 440.0);
        assert_eq!(name, "Bb");
        assert_eq!(octave, 4);
    }

    #[test]
    fn test_transpose_bb_horn() {
        // Concert Bb4 → Notated C5 for Bb horn (+2 semitones)
        let (name, octave) = transpose_note("Bb", 4, 2);
        assert_eq!(name, "C");
        assert_eq!(octave, 5);
    }

    #[test]
    fn test_transpose_f_horn() {
        // Concert F4 → Notated C5 for F horn (+7 semitones)
        let (name, octave) = transpose_note("F", 4, 7);
        assert_eq!(name, "C");
        assert_eq!(octave, 5);
    }
}
