/** Tone Lab operating modes. */
export type ToneLabMode = 'free_play' | 'drone' | 'target' | 'interval';

/** A single pitch sample captured at ~20Hz. */
export interface PitchSample {
  noteKey: string;     // "Bb4", "F5" — for grouping
  noteName: string;    // "Bb", "F"
  octave: number;
  cents: number;
  frequencyHz: number;
  timestampMs: number; // Date.now() at capture
}

/** Per-note tendency accumulator. */
export interface NoteTendency {
  noteKey: string;     // "F5"
  sampleCount: number;
  avgCents: number;
}

/** Session-level stats. */
export interface ToneLabStats {
  toneCount: number;     // distinct note transitions
  accuracy: number;      // fraction of samples within +-10ct (0..1)
  avgCents: number;      // average |cent deviation|
}
