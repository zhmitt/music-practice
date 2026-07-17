/**
 * Ear Training store — drives Interval Identification, Melodic Dictation,
 * and Pitch Memory sub-modes.
 *
 * Pitch detection is consumed from the shared tonelab stores (currentNote,
 * currentOctave, currentCents, isDetecting).
 */

import { writable, get } from 'svelte/store';
import { playNote } from '$lib/audio/playNote';
import { currentNote, currentOctave, currentCents, isDetecting } from './tonelab';
import { selectedInstrument } from './onboarding';
import { getPitchDisplayModeValue } from './notePreferences';
import { matchesDisplayedTone } from '$lib/music/noteUtils';
import { getInstrumentPracticeProfile } from '$lib/music/practiceProfiles';

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const INTERVALS = [
  { semitones: 0, key: 'interval.unison' },
  { semitones: 2, key: 'interval.major_second' },
  { semitones: 3, key: 'interval.minor_third' },
  { semitones: 4, key: 'interval.major_third' },
  { semitones: 5, key: 'interval.perfect_fourth' },
  { semitones: 7, key: 'interval.perfect_fifth' },
  { semitones: 9, key: 'interval.major_sixth' },
  { semitones: 12, key: 'interval.octave' },
];

export type EarMode = 'interval_id' | 'melodic' | 'pitch_memory';
export type EarPhase = 'idle' | 'listening' | 'answering' | 'result';

export interface EarResult {
  correct: boolean;
  detail: string;
}

// ── Reactive stores ──

export const earMode = writable<EarMode>('interval_id');
export const earPhase = writable<EarPhase>('idle');
export const earResults = writable<EarResult[]>([]);
export const earCurrentQuestion = writable('');
export const earCorrectAnswer = writable('');
export const earMelodyNotes = writable<Array<{ note: string; octave: number }>>([]);
/** How many melody notes the user has successfully played back so far. */
export const earMelodyProgress = writable(0);
/** 'correct' | 'wrong' | '' — used to colour the result panel. */
export const earFeedback = writable('');

// ── Module-level mutable state ──

let checkInterval: ReturnType<typeof setInterval> | null = null;
let currentAnswer = '';
let melodyIdx = 0;
let holdStartMs = 0;
let lastDetectedNote = '';

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

/**
 * Return the subset of INTERVALS active at the current accuracy level.
 * Starts easy (unison / P5 / octave) and unlocks additional intervals as
 * the user accumulates correct answers.
 */
function getActiveIntervals(): typeof INTERVALS {
  const results = get(earResults);
  const correct = results.filter((r) => r.correct).length;
  if (correct < 3) return INTERVALS.filter((i) => [0, 7, 12].includes(i.semitones));
  if (correct < 6) return INTERVALS.filter((i) => [0, 4, 5, 7, 12].includes(i.semitones));
  if (correct < 10) return INTERVALS.filter((i) => [0, 2, 3, 4, 5, 7, 12].includes(i.semitones));
  return INTERVALS;
}

// ── Interval Identification ──

/**
 * Start a new Interval Identification round.
 * Plays two notes sequentially and waits for the user to click an answer button.
 */
export async function startIntervalId(): Promise<void> {
  earMode.set('interval_id');
  earPhase.set('listening');
  earFeedback.set('');

  const roots = getInstrumentPracticeProfile(get(selectedInstrument)).earRootsConcert;
  const root = roots[Math.floor(Math.random() * roots.length)];
  const intervals = getActiveIntervals();
  const interval = intervals[Math.floor(Math.random() * intervals.length)];

  const targetMidi = noteToMidi(root[0], root[1]) + interval.semitones;
  const target = midiToNote(targetMidi);

  currentAnswer = interval.key;
  earCorrectAnswer.set(interval.key);
  earCurrentQuestion.set(`${root[0]}${root[1]} → ${target.note}${target.octave}`);

  await playNote(root[0], root[1], 800, 0.3);
  await new Promise((r) => setTimeout(r, 200));
  await playNote(target.note, target.octave, 800, 0.3);

  earPhase.set('answering');
}

/**
 * Record the user's interval answer and transition to the result phase.
 *
 * @param intervalKey - The interval key string selected by the user (e.g. 'interval.perfect_fifth').
 */
export function answerIntervalId(intervalKey: string): void {
  const correct = intervalKey === currentAnswer;
  earResults.update((r) => [...r, { correct, detail: currentAnswer }]);
  earFeedback.set(correct ? 'correct' : 'wrong');
  earPhase.set('result');
}

// ── Melodic Dictation ──

/**
 * Start a new Melodic Dictation round.
 * Generates and plays a short melody, then polls pitch detection for playback.
 * Melody length scales from 3 → 5 notes based on cumulative correct answers.
 */
export async function startMelodicDictation(): Promise<void> {
  earMode.set('melodic');
  earPhase.set('listening');
  earFeedback.set('');

  const results = get(earResults);
  const correct = results.filter((r) => r.correct).length;
  const length = correct < 5 ? 3 : correct < 10 ? 4 : 5;

  const roots = getInstrumentPracticeProfile(get(selectedInstrument)).earRootsConcert;
  const root = roots[Math.floor(Math.random() * roots.length)];
  const rootMidi = noteToMidi(root[0], root[1]);
  const melody: Array<{ note: string; octave: number }> = [];

  for (let i = 0; i < length; i++) {
    const offset = Math.floor(Math.random() * 8); // 0–7 semitones above root
    melody.push(midiToNote(rootMidi + offset));
  }

  earMelodyNotes.set(melody);
  earMelodyProgress.set(0);
  melodyIdx = 0;

  for (const n of melody) {
    await playNote(n.note, n.octave, 600, 0.3);
    await new Promise((r) => setTimeout(r, 150));
  }

  earPhase.set('answering');
  earCurrentQuestion.set(melody.map((n) => `${n.note}${n.octave}`).join(' '));

  holdStartMs = 0;
  lastDetectedNote = '';
  checkInterval = setInterval(checkMelodicPitch, 50);
}

/**
 * Poll pitch detection every 50 ms during melodic playback.
 * A note must be held for 400 ms to register; a wrong note held for 400 ms fails the round.
 */
function checkMelodicPitch(): void {
  const melody = get(earMelodyNotes);
  if (melodyIdx >= melody.length) return;

  const detecting = get(isDetecting);
  const note = get(currentNote);
  const octave = get(currentOctave);

  if (!detecting) {
    holdStartMs = 0;
    lastDetectedNote = '';
    return;
  }

  const noteKey = `${note}${octave}`;
  const expected = melody[melodyIdx];
  const targetMode = getPitchDisplayModeValue() === 'concert' ? 'concert' : 'written';

  if (noteKey !== lastDetectedNote) {
    lastDetectedNote = noteKey;
    holdStartMs = Date.now();
  }

  if (Date.now() - holdStartMs < 400) return;

  if (
    matchesDisplayedTone(note, octave, expected, get(selectedInstrument), 'concert', targetMode)
  ) {
    melodyIdx++;
    earMelodyProgress.set(melodyIdx);
    holdStartMs = 0;
    lastDetectedNote = '';

    if (melodyIdx >= melody.length) {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      earResults.update((r) => [...r, { correct: true, detail: 'melody_complete' }]);
      earFeedback.set('correct');
      earPhase.set('result');
    }
  } else {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    earResults.update((r) => [
      ...r,
      { correct: false, detail: `expected ${expected.note}${expected.octave} got ${noteKey}` },
    ]);
    earFeedback.set('wrong');
    earPhase.set('result');
  }
}

// ── Pitch Memory ──

let memoryNote = { note: '', octave: 0 };

/**
 * Start a Pitch Memory round.
 * Plays a single note, waits 3 s of silence, then listens for the user to
 * reproduce it. Fails automatically after 10 s of no valid answer.
 */
export async function startPitchMemory(): Promise<void> {
  earMode.set('pitch_memory');
  earPhase.set('listening');
  earFeedback.set('');

  const roots = getInstrumentPracticeProfile(get(selectedInstrument)).earRootsConcert;
  const root = roots[Math.floor(Math.random() * roots.length)];
  const octaveShift = Math.random() > 0.5 ? 0 : Math.random() > 0.5 ? 1 : -1;
  memoryNote = { note: root[0], octave: root[1] + octaveShift };

  earCurrentQuestion.set(`${memoryNote.note}${memoryNote.octave}`);
  earMelodyNotes.set([memoryNote]);

  await playNote(memoryNote.note, memoryNote.octave, 1200, 0.3);

  earCurrentQuestion.set('...');
  await new Promise((r) => setTimeout(r, 3000));

  earPhase.set('answering');
  earCurrentQuestion.set('?');
  holdStartMs = 0;
  lastDetectedNote = '';

  checkInterval = setInterval(checkMemoryPitch, 50);

  setTimeout(() => {
    if (get(earPhase) === 'answering' && get(earMode) === 'pitch_memory') {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      earResults.update((r) => [...r, { correct: false, detail: 'timeout' }]);
      earFeedback.set('wrong');
      earPhase.set('result');
    }
  }, 10000);
}

/**
 * Poll pitch detection every 50 ms during the pitch memory answering phase.
 * Requires a 600 ms hold within ±20 cents to count as correct.
 */
function checkMemoryPitch(): void {
  const detecting = get(isDetecting);
  const note = get(currentNote);
  const octave = get(currentOctave);
  const cents = get(currentCents);

  if (!detecting) {
    holdStartMs = 0;
    return;
  }

  const noteKey = `${note}${octave}`;
  const targetMode = getPitchDisplayModeValue() === 'concert' ? 'concert' : 'written';

  if (noteKey !== lastDetectedNote) {
    lastDetectedNote = noteKey;
    holdStartMs = Date.now();
  }

  if (Date.now() - holdStartMs < 600) return;

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  const correct =
    matchesDisplayedTone(
      note,
      octave,
      memoryNote,
      get(selectedInstrument),
      'concert',
      targetMode,
    ) && Math.abs(cents) <= 20;
  earResults.update((r) => [
    ...r,
    { correct, detail: `${memoryNote.note}${memoryNote.octave} → ${noteKey}` },
  ]);
  earFeedback.set(correct ? 'correct' : 'wrong');
  earPhase.set('result');
}

// ── Shared utilities ──

/**
 * Stop any active ear training session and return to the idle state.
 * Safe to call even when no session is running.
 */
export function stopEarTraining(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  earPhase.set('idle');
  earFeedback.set('');
  earCurrentQuestion.set('');
  melodyIdx = 0;
  holdStartMs = 0;
}

/**
 * Return current session totals.
 *
 * @returns Object with `total` attempts and `correct` count.
 */
export function getEarScore(): { total: number; correct: number } {
  const results = get(earResults);
  return { total: results.length, correct: results.filter((r) => r.correct).length };
}

/** Reset the result history (called at the start of each new sub-mode session). */
export function resetEarResults(): void {
  earResults.set([]);
}
