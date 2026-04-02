/**
 * Shared TypeScript interfaces mirroring Rust structs in src-tauri/src/audio/types.rs.
 *
 * Field names use snake_case because the Rust structs have no `#[serde(rename_all)]`
 * attribute, so serde serialises them as-is.
 */

/** Mirrors Rust `PitchResult` from src-tauri/src/audio/types.rs */
export interface TauriPitchResult {
  /** Detected fundamental frequency in Hz. */
  frequency_hz: number;
  /** Note name, e.g. "Bb", "C#", "F". */
  note_name: string;
  /** Octave number (scientific pitch notation). */
  octave: number;
  /** Cents deviation from nearest note. Negative = flat, positive = sharp. */
  cent_deviation: number;
  /** Detection confidence in range 0.0–1.0. */
  confidence: number;
  /** Milliseconds since audio stream start. */
  timestamp_ms: number;
}

/** Mirrors Rust `AudioLevel` from src-tauri/src/audio/types.rs */
export interface TauriAudioLevel {
  /** Root mean square of recent samples, normalised 0.0–1.0. */
  rms: number;
  /** Peak absolute sample value in the current buffer, normalised 0.0–1.0. */
  peak: number;
  /** True when peak exceeds 0.99 (clipping). */
  is_clipping: boolean;
}

/** Mirrors Rust `AudioDeviceInfo` from src-tauri/src/audio/types.rs */
export interface TauriAudioDeviceInfo {
  /** Device name as reported by the OS. */
  device_name: string;
  /** Whether this is the system default input device. */
  is_default: boolean;
}
