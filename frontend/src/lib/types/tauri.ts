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

export interface TauriAudioDebugSnapshot {
  is_running: boolean;
  sample_rate: number;
  active_device_name: string | null;
  detector_status: string;
  audio_level: TauriAudioLevel;
  analysis_buffer_len: number;
  window_size: number;
  raw_frequency_hz: number | null;
  raw_confidence: number | null;
  tentative_pitch: TauriPitchResult | null;
  latest_pitch: TauriPitchResult | null;
  reference_a4: number;
  instrument_name: string;
  display_mode: string;
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

/**
 * Canonical frontend contract for every command exported by the Tauri handler.
 * Keep this map in sync with `src-tauri/src/lib.rs`; `npm run contract:check`
 * verifies the command names deterministically.
 */
export interface TauriCommandMap {
  start_audio: { args: { deviceName: string | null }; result: void };
  stop_audio: { args: undefined; result: void };
  get_devices: { args: undefined; result: TauriAudioDeviceInfo[] };
  get_pitch: { args: undefined; result: TauriPitchResult | null };
  get_audio_level: { args: undefined; result: TauriAudioLevel };
  get_audio_debug: { args: undefined; result: TauriAudioDebugSnapshot };
  set_reference_tuning: { args: { hz: number }; result: void };
  set_instrument_profile: { args: { profileName: string }; result: void };
  set_display_mode: { args: { mode: string }; result: void };
  is_audio_running: { args: undefined; result: boolean };
  start_drone: {
    args: { note: string; octave: number; referenceA4: number };
    result: void;
  };
  stop_drone: { args: undefined; result: void };
  set_drone_note: {
    args: { note: string; octave: number; referenceA4: number };
    result: void;
  };
  is_drone_playing: { args: undefined; result: boolean };
}

export type TauriCommandName = keyof TauriCommandMap;
