/** Tone target within an exercise. */
export interface ToneTarget {
  note: string;        // e.g. "Bb"
  octave: number;      // e.g. 4
  durationSec: number; // e.g. 8
}

/** Result of a completed tone attempt. */
export interface ToneResult {
  target: ToneTarget;
  avgCents: number;
  stability: number;      // std deviation of cent samples
  durationHeld: number;   // actual seconds held stable
  centsSamples: number[]; // raw samples for stability graph
  passed: boolean;
}

/** Exercise definition. */
export interface ExerciseDef {
  id: string;
  type: 'long_tones' | 'scale';
  nameKey: string;
  descriptionKey: string;
  tones: ToneTarget[];
}

/** Session plan (list of exercises). */
export interface SessionPlan {
  exercises: ExerciseDef[];
  totalMinutes: number;
}

/** Phase of the current tone. */
export type TonePhase = 'waiting' | 'detecting' | 'held' | 'completed';

/** Overall session phase. */
export type SessionPhase = 'running' | 'paused' | 'between_exercises' | 'completed';
