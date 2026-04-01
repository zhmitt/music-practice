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

    /// Double Horn (Bb/F). Uses Bb side range as default.
    /// Combines both horn ranges. Transposition: +2 (Bb side default).
    pub fn double_horn() -> Self {
        Self {
            name: "Double Horn".to_string(),
            transposition_semitones: 2,
            min_hz: 58.0,   // Bb1 (F horn low range)
            max_hz: 1397.0, // F6
            typical_partials: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        }
    }

    /// Trumpet in Bb.
    /// Written range: F#3–C6, Concert range: E3–Bb5.
    /// Transposition: +2 semitones (concert → notated).
    pub fn trumpet_bb() -> Self {
        Self {
            name: "Trumpet in Bb".to_string(),
            transposition_semitones: 2,
            min_hz: 165.0,  // E3 concert (~164.8 Hz)
            max_hz: 932.0,  // Bb5 concert (~932.3 Hz)
            typical_partials: vec![1.0, 2.0, 3.0, 4.0, 5.0],
        }
    }

    /// Clarinet in Bb.
    /// Written range: E3–C7, Concert range: D3–Bb6.
    /// Transposition: +2 semitones (concert → notated).
    pub fn clarinet_bb() -> Self {
        Self {
            name: "Clarinet in Bb".to_string(),
            transposition_semitones: 2,
            min_hz: 147.0,  // D3 concert (~146.8 Hz)
            max_hz: 1865.0, // Bb6 concert (~1864.7 Hz)
            // Clarinet overblows at the twelfth (odd harmonics dominate)
            typical_partials: vec![1.0, 3.0, 5.0, 7.0],
        }
    }

    /// Flute (C instrument, concert pitch).
    /// Range: C4–C7.
    pub fn flute() -> Self {
        Self {
            name: "Flute".to_string(),
            transposition_semitones: 0,
            min_hz: 262.0,  // C4 (~261.6 Hz)
            max_hz: 2093.0, // C7 (~2093.0 Hz)
            typical_partials: vec![1.0, 2.0, 3.0],
        }
    }

    /// Oboe (C instrument, concert pitch).
    /// Range: Bb3–A6.
    pub fn oboe() -> Self {
        Self {
            name: "Oboe".to_string(),
            transposition_semitones: 0,
            min_hz: 233.0,  // Bb3 (~233.1 Hz)
            max_hz: 1760.0, // A6 (~1760.0 Hz)
            typical_partials: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        }
    }

    /// Trombone (C instrument, concert pitch).
    /// Range: E2–Bb4 (tenor), extends to F5 for advanced.
    pub fn trombone() -> Self {
        Self {
            name: "Trombone".to_string(),
            transposition_semitones: 0,
            min_hz: 82.0,   // E2 (~82.4 Hz)
            max_hz: 698.0,  // F5 (~698.5 Hz)
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

    #[test]
    fn test_trumpet_bb_range() {
        let p = InstrumentProfile::trumpet_bb();
        assert_eq!(p.transposition_semitones, 2);
        assert!(p.in_range(440.0));   // A4 — well within range
        assert!(!p.in_range(80.0));   // E2 — too low for trumpet
        assert!(!p.in_range(2000.0)); // too high
    }

    #[test]
    fn test_clarinet_bb_odd_partials() {
        let p = InstrumentProfile::clarinet_bb();
        assert_eq!(p.transposition_semitones, 2);
        // Clarinet has odd partials (1, 3, 5, 7)
        assert_eq!(p.typical_partials, vec![1.0, 3.0, 5.0, 7.0]);
    }

    #[test]
    fn test_flute_concert_pitch() {
        let p = InstrumentProfile::flute();
        assert_eq!(p.transposition_semitones, 0);
        assert!(p.in_range(440.0));   // A4
        assert!(!p.in_range(100.0));  // below flute range
    }

    #[test]
    fn test_trombone_low_range() {
        let p = InstrumentProfile::trombone();
        assert_eq!(p.transposition_semitones, 0);
        assert!(p.in_range(100.0));   // low brass range
        assert!(!p.in_range(50.0));   // below E2
    }

    #[test]
    fn test_oboe_range() {
        let p = InstrumentProfile::oboe();
        assert_eq!(p.transposition_semitones, 0);
        assert!(p.in_range(440.0));   // A4
        assert!(!p.in_range(100.0));  // below oboe range
    }

    #[test]
    fn test_double_horn_wide_range() {
        let p = InstrumentProfile::double_horn();
        assert_eq!(p.transposition_semitones, 2);
        // Double horn should have the widest range (F side low + Bb side high)
        assert!(p.in_range(60.0));    // low F horn range
        assert!(p.in_range(1000.0));  // high range
    }
}
