import { writable, get } from 'svelte/store';
import { currentNote, currentOctave, currentCents, isDetecting } from './tonelab';
import { selectedInstrument } from './onboarding';
import { getPitchDisplayModeValue } from './notePreferences';
import { matchesDisplayedTone } from '$lib/music/noteUtils';
import { getInstrumentPracticeProfile } from '$lib/music/practiceProfiles';

export interface TargetResult {
  note: string;
  octave: number;
  avgCents: number;
  holdMs: number;
  passed: boolean;
}

export type TargetPhase = 'idle' | 'waiting' | 'detecting' | 'held' | 'result';

export const targetPhase = writable<TargetPhase>('idle');
export const targetNote = writable('');
export const targetOctave = writable(0);
export const targetResults = writable<TargetResult[]>([]);
export const targetHoldProgress = writable(0); // 0..1
export const targetCurrentCentsAvg = writable(0);

let holdStartMs = 0;
let centsSamples: number[] = [];
let checkInterval: ReturnType<typeof setInterval> | null = null;

const HOLD_REQUIRED_MS = 2000; // must hold 2 seconds
const TOLERANCE_CENTS = 15; // note must be within 15 cents

/**
 * Start a new target training session. Clears previous results and picks the first target.
 */
export function startTargetTraining(): void {
  targetResults.set([]);
  nextTarget();
}

/**
 * Stop the current target training session and reset all state to idle.
 */
export function stopTargetTraining(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  targetPhase.set('idle');
  targetNote.set('');
  targetOctave.set(0);
  targetHoldProgress.set(0);
  targetCurrentCentsAvg.set(0);
  centsSamples = [];
}

/**
 * Advance to the next randomly selected target note, avoiding consecutive repeats.
 */
export function nextTarget(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  const notes = getInstrumentPracticeProfile(get(selectedInstrument)).targetNotesWritten;
  // Pick a random note, avoid repeating the last one
  const lastNote = get(targetNote);
  const lastOctave = get(targetOctave);
  let pick: [string, number];
  do {
    pick = notes[Math.floor(Math.random() * notes.length)];
  } while (pick[0] === lastNote && pick[1] === lastOctave && notes.length > 1);

  targetNote.set(pick[0]);
  targetOctave.set(pick[1]);
  targetPhase.set('waiting');
  targetHoldProgress.set(0);
  targetCurrentCentsAvg.set(0);
  centsSamples = [];
  holdStartMs = 0;

  // Start checking pitch at 20Hz
  checkInterval = setInterval(checkPitch, 50);
}

function checkPitch(): void {
  const phase = get(targetPhase);
  if (phase !== 'waiting' && phase !== 'detecting' && phase !== 'held') return;

  const detecting = get(isDetecting);
  const note = get(currentNote);
  const octave = get(currentOctave);
  const cents = get(currentCents);
  const tgt = get(targetNote);
  const tgtOct = get(targetOctave);

  const targetMode = getPitchDisplayModeValue() === 'concert' ? 'concert' : 'written';
  const noteMatches =
    detecting &&
    matchesDisplayedTone(
      note,
      octave,
      { note: tgt, octave: tgtOct },
      get(selectedInstrument),
      'written',
      targetMode,
    );

  if (!noteMatches) {
    // Reset hold if wrong note or no detection
    if (phase === 'detecting' || phase === 'held') {
      targetPhase.set('waiting');
      holdStartMs = 0;
      centsSamples = [];
      targetHoldProgress.set(0);
      targetCurrentCentsAvg.set(0);
    }
    return;
  }

  // Correct note detected
  if (phase === 'waiting') {
    targetPhase.set('detecting');
    holdStartMs = Date.now();
    centsSamples = [cents];
  } else {
    centsSamples.push(cents);
  }

  const elapsed = Date.now() - holdStartMs;
  const progress = Math.min(1, elapsed / HOLD_REQUIRED_MS);
  targetHoldProgress.set(progress);

  // Calculate running average
  const avg = centsSamples.reduce((a, b) => a + b, 0) / centsSamples.length;
  targetCurrentCentsAvg.set(avg);

  if (progress >= 0.3) {
    targetPhase.set('held');
  }

  // Complete!
  if (elapsed >= HOLD_REQUIRED_MS) {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }

    const avgCents = centsSamples.reduce((a, b) => a + b, 0) / centsSamples.length;
    const passed = Math.abs(avgCents) <= TOLERANCE_CENTS;

    const result: TargetResult = {
      note: `${tgt}${tgtOct}`,
      octave: tgtOct,
      avgCents,
      holdMs: elapsed,
      passed,
    };

    targetResults.update((r) => [...r, result]);
    targetPhase.set('result');
  }
}

/**
 * Get a summary of all results in the current training session.
 *
 * @returns Object with total attempts, passed count, and average absolute cents deviation.
 *
 * @example
 * const { total, passed, avgCents } = getTargetScore();
 * console.log(`${passed}/${total} passed, avg deviation: ${avgCents.toFixed(1)}ct`);
 */
export function getTargetScore(): { total: number; passed: number; avgCents: number } {
  const results = get(targetResults);
  if (results.length === 0) return { total: 0, passed: 0, avgCents: 0 };
  const passed = results.filter((r) => r.passed).length;
  const avgCents = results.reduce((s, r) => s + Math.abs(r.avgCents), 0) / results.length;
  return { total: results.length, passed, avgCents };
}
