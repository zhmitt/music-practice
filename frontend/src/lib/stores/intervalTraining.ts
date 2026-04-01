/**
 * Interval training store for Tone Lab interval check mode.
 *
 * Presents the user with a root note (played via Web Audio) and waits for them
 * to sustain the correct target note for HOLD_REQUIRED_MS milliseconds.  The
 * average cent deviation during the hold window determines whether the attempt
 * is judged correct (<= 15 ct).
 */

import { writable, get } from 'svelte/store';
import { currentNote, currentOctave, currentCents, isDetecting } from './tonelab';
import { playNote } from '$lib/audio/playNote';

// ── Interval definitions (semitones above root) ──

const INTERVALS = [
  { semitones: 0,  nameKey: 'interval.unison' },
  { semitones: 2,  nameKey: 'interval.major_second' },
  { semitones: 3,  nameKey: 'interval.minor_third' },
  { semitones: 4,  nameKey: 'interval.major_third' },
  { semitones: 5,  nameKey: 'interval.perfect_fourth' },
  { semitones: 7,  nameKey: 'interval.perfect_fifth' },
  { semitones: 9,  nameKey: 'interval.major_sixth' },
  { semitones: 12, nameKey: 'interval.octave' },
] as const;

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Root notes comfortable for common wind/brass instruments (concert pitch).
const ROOT_NOTES: Array<[string, number]> = [
  ['C', 4], ['D', 4], ['Eb', 4], ['F', 4], ['G', 4], ['A', 4], ['Bb', 4],
];

/** How long the player must sustain the correct note (ms). */
const HOLD_REQUIRED_MS = 1500;

/** Intervals used for training (up to P5 by default). */
const activeIntervals = INTERVALS.filter(i => i.semitones <= 7);

// ── Helpers ──

function noteToMidi(note: string, octave: number): number {
  const idx = NOTE_NAMES.indexOf(note);
  return (octave + 1) * 12 + (idx >= 0 ? idx : 0);
}

function midiToNote(midi: number): { note: string; octave: number } {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { note: NOTE_NAMES[noteIndex], octave };
}

// ── Public types ──

export interface IntervalChallenge {
  rootNote: string;
  rootOctave: number;
  targetNote: string;
  targetOctave: number;
  /** i18n key, e.g. "interval.perfect_fifth" */
  intervalName: string;
  semitones: number;
}

export interface IntervalResult {
  challenge: IntervalChallenge;
  playedNote: string;
  playedOctave: number;
  /** Mean cent deviation during hold window (signed). */
  avgCents: number;
  /** true when |avgCents| <= 15. */
  correct: boolean;
}

export type IntervalPhase = 'idle' | 'listening' | 'playing' | 'result';

// ── Stores ──

export const intervalPhase = writable<IntervalPhase>('idle');
export const intervalChallenge = writable<IntervalChallenge | null>(null);
export const intervalResults = writable<IntervalResult[]>([]);
/** 0..1 progress towards HOLD_REQUIRED_MS. */
export const intervalHoldProgress = writable(0);
/** Rolling mean cents while holding (signed). */
export const intervalCurrentCents = writable(0);

// ── Internal state ──

let holdStartMs = 0;
let centsSamples: number[] = [];
let checkInterval: ReturnType<typeof setInterval> | null = null;

// ── Public API ──

/**
 * Start a fresh interval training session.
 * Clears previous results and presents the first challenge.
 */
export function startIntervalTraining(): void {
  intervalResults.set([]);
  nextInterval();
}

/**
 * Stop an in-progress session and reset all state to idle.
 */
export function stopIntervalTraining(): void {
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
  intervalPhase.set('idle');
  intervalChallenge.set(null);
  intervalHoldProgress.set(0);
  intervalCurrentCents.set(0);
  centsSamples = [];
  holdStartMs = 0;
}

/**
 * Advance to the next challenge.
 * Picks a random root note and interval, plays the root tone, then begins
 * polling for the target note.
 */
export async function nextInterval(): Promise<void> {
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }

  // Pick random root and interval
  const root = ROOT_NOTES[Math.floor(Math.random() * ROOT_NOTES.length)];
  const interval = activeIntervals[Math.floor(Math.random() * activeIntervals.length)];

  const rootMidi = noteToMidi(root[0], root[1]);
  const targetMidi = rootMidi + interval.semitones;
  const target = midiToNote(targetMidi);

  const challenge: IntervalChallenge = {
    rootNote: root[0],
    rootOctave: root[1],
    targetNote: target.note,
    targetOctave: target.octave,
    intervalName: interval.nameKey,
    semitones: interval.semitones,
  };

  intervalChallenge.set(challenge);
  intervalPhase.set('listening');
  intervalHoldProgress.set(0);
  intervalCurrentCents.set(0);
  centsSamples = [];
  holdStartMs = 0;

  // Play the root note as reference for 1.5 seconds
  await playNote(root[0], root[1], 1500, 0.3);

  // Now wait for the user to play the target note
  intervalPhase.set('playing');
  checkInterval = setInterval(checkPitch, 50);
}

/**
 * Compute aggregate score for the current session.
 *
 * @returns Object with total attempts, correct count, and mean absolute deviation.
 */
export function getIntervalScore(): { total: number; correct: number; avgCents: number } {
  const results = get(intervalResults);
  if (results.length === 0) return { total: 0, correct: 0, avgCents: 0 };
  const correct = results.filter(r => r.correct).length;
  const avgCents = results.reduce((s, r) => s + Math.abs(r.avgCents), 0) / results.length;
  return { total: results.length, correct, avgCents };
}

// ── Private ──

/**
 * Called at 20Hz while phase === 'playing'.
 * Tracks how long the correct note has been sustained and records the result
 * once HOLD_REQUIRED_MS is reached.
 */
function checkPitch(): void {
  const phase = get(intervalPhase);
  if (phase !== 'playing') return;

  const detecting = get(isDetecting);
  const note = get(currentNote);
  const octave = get(currentOctave);
  const cents = get(currentCents);
  const challenge = get(intervalChallenge);

  if (!challenge || !detecting) {
    // No signal — reset hold progress
    if (holdStartMs > 0) {
      holdStartMs = 0;
      centsSamples = [];
      intervalHoldProgress.set(0);
      intervalCurrentCents.set(0);
    }
    return;
  }

  const noteMatches = note === challenge.targetNote && octave === challenge.targetOctave;

  if (!noteMatches) {
    // Wrong note — reset hold
    if (holdStartMs > 0) {
      holdStartMs = 0;
      centsSamples = [];
      intervalHoldProgress.set(0);
      intervalCurrentCents.set(0);
    }
    return;
  }

  // Correct note is sounding — accumulate hold time
  if (holdStartMs === 0) {
    holdStartMs = Date.now();
    centsSamples = [cents];
  } else {
    centsSamples.push(cents);
  }

  const elapsed = Date.now() - holdStartMs;
  intervalHoldProgress.set(Math.min(1, elapsed / HOLD_REQUIRED_MS));

  const avg = centsSamples.reduce((a, b) => a + b, 0) / centsSamples.length;
  intervalCurrentCents.set(avg);

  if (elapsed >= HOLD_REQUIRED_MS) {
    if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }

    const avgCents = centsSamples.reduce((a, b) => a + b, 0) / centsSamples.length;
    const correct = Math.abs(avgCents) <= 15;

    const result: IntervalResult = {
      challenge,
      playedNote: note,
      playedOctave: octave,
      avgCents,
      correct,
    };

    intervalResults.update(r => [...r, result]);
    intervalPhase.set('result');
  }
}
