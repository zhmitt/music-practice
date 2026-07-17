import { writable, get } from 'svelte/store';
import { sessionActive, sessionPaused } from './navigation';
import type {
  SessionPlan,
  ExerciseDef,
  ToneTarget,
  ToneResult,
  TonePhase,
  SessionPhase,
} from '$lib/types/session';
import { saveSession, today, type SessionRecord, type ToneRecord } from './history';
import { acquireAudioLease, releaseAudioLease, type AudioLeaseHandle } from './audioPreferences';
import type { TauriPitchResult, TauriAudioLevel } from '$lib/types/tauri';
import { safeInvoke } from '$lib/db';
import { selectedInstrument } from './onboarding';
import { getPitchDisplayModeValue } from './notePreferences';
import { matchesDisplayedTone } from '$lib/music/noteUtils';

// ── Reactive state (writable stores for Svelte 4/5 compatibility) ──

export const sessionPlan = writable<SessionPlan | null>(null);
export const exerciseIndex = writable(0);
export const toneIndex = writable(0);
export const tonePhase = writable<TonePhase>('waiting');
export const sessionPhase = writable<SessionPhase>('running');
export const toneResults = writable<ToneResult[]>([]);
export interface CompletedExerciseRun {
  exercise: ExerciseDef;
  results: ToneResult[];
}
export const completedExercises = writable<CompletedExerciseRun[]>([]);
export const centsSamples = writable<number[]>([]);
export const currentCents = writable(0);
export const currentNote = writable('');
export const currentOctave = writable(0);
export const currentFrequency = writable(0);
export const audioLevel = writable(0);
export const elapsedSeconds = writable(0);

// ── Internal state ──

let tickTimer: ReturnType<typeof setTimeout> | null = null;
let elapsedInterval: ReturnType<typeof setInterval> | null = null;
let pollingGeneration = 0;
let stableStartTime = 0;
let holdAccumulator = 0;
let centsAccumulator: number[] = [];
let audioLease: AudioLeaseHandle | null = null;
let lastAcceptedSampleTime = 0;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;

// Thresholds
const STABLE_CENTS = 15; // considered stable within +-15 cents
const SETTLE_MS = 400; // settling time before hold timer starts
const UNSTABLE_MS = 800; // if unstable for this long, reset hold

let lastUnstableTime = 0;

// ── Derived helpers ──

export function getCurrentExercise(): ExerciseDef | null {
  const plan = get(sessionPlan);
  if (!plan) return null;
  return plan.exercises[get(exerciseIndex)] ?? null;
}

export function getCurrentTone(): ToneTarget | null {
  const ex = getCurrentExercise();
  if (!ex) return null;
  return ex.tones[get(toneIndex)] ?? null;
}

export function getOverallProgress(): number {
  const plan = get(sessionPlan);
  if (!plan) return 0;
  const totalTones = plan.exercises.reduce((s, e) => s + e.tones.length, 0);
  if (totalTones === 0) return 0;
  let done = 0;
  for (let i = 0; i < get(exerciseIndex); i++) {
    done += plan.exercises[i].tones.length;
  }
  done += get(toneIndex);
  return done / totalTones;
}

// ── Session lifecycle ──

export async function startSession(plan: SessionPlan) {
  const generation = ++pollingGeneration;
  clearIntervals();
  const retainedLease = audioLease;
  if (audioLease && (await releaseAudioLease(audioLease))) audioLease = null;
  // Reset state
  sessionPlan.set(plan);
  exerciseIndex.set(0);
  toneIndex.set(0);
  tonePhase.set('waiting');
  sessionPhase.set('running');
  toneResults.set([]);
  completedExercises.set([]);
  centsSamples.set([]);
  currentCents.set(0);
  currentNote.set('');
  currentOctave.set(0);
  currentFrequency.set(0);
  audioLevel.set(0);
  elapsedSeconds.set(0);
  holdAccumulator = 0;
  centsAccumulator = [];
  stableStartTime = 0;
  lastUnstableTime = 0;

  // Start audio via Tauri
  const acquiredLease = await acquireAudioLease('session');
  if (acquiredLease && retainedLease && audioLease?.id === retainedLease.id) {
    await releaseAudioLease(retainedLease);
    audioLease = null;
  }
  if (generation !== pollingGeneration) {
    if (acquiredLease) await releaseAudioLease(acquiredLease);
    return;
  }
  if (!acquiredLease) return;
  audioLease = acquiredLease ?? audioLease;

  // Activate session overlay
  sessionActive.set(true);
  sessionPaused.set(false);

  // Start tick loop (20Hz)
  scheduleTick(generation);

  // Start elapsed timer
  elapsedInterval = setInterval(() => {
    if (get(sessionPhase) === 'running') {
      elapsedSeconds.update((v) => v + 1);
    }
  }, 1000);
}

export async function stopSession() {
  pollingGeneration++;
  clearIntervals();
  // Persist session results before cleanup
  await persistSessionResults();

  if (audioLease) {
    if (await releaseAudioLease(audioLease)) audioLease = null;
  }

  sessionActive.set(false);
  sessionPaused.set(false);
  sessionPhase.set('completed');
  resetSessionStores();
}

async function persistSessionResults() {
  const runs = getPersistedExerciseRuns();
  const allResults = runs.flatMap((run) => run.results);
  if (allResults.length === 0) return;

  const tones: ToneRecord[] = allResults.map((result) => ({
    note: `${result.target.note}${result.target.octave}`,
    avgCents: result.avgCents,
    stability: result.stability,
    passed: result.passed,
  }));

  const passed = allResults.filter((result) => result.passed).length;
  const totalCents = allResults.reduce((sum, result) => sum + Math.abs(result.avgCents), 0);
  const exerciseTypes = [...new Set(runs.map((run) => run.exercise.type))];

  const record: SessionRecord = {
    id: new Date().toISOString(),
    date: today(),
    durationSeconds: get(elapsedSeconds),
    exerciseType: exerciseTypes.length === 1 ? exerciseTypes[0] : 'mixed',
    exerciseName: runs.length === 1 ? runs[0].exercise.nameKey : 'mixed',
    tones,
    accuracy: passed / allResults.length,
    avgCents: totalCents / allResults.length,
  };

  await saveSession(record);
}

export function togglePause() {
  const paused = !get(sessionPaused);
  sessionPaused.set(paused);
  sessionPhase.set(paused ? 'paused' : 'running');
}

export function skipTone() {
  const tone = getCurrentTone();
  if (!tone) return;

  // Record as skipped
  const result: ToneResult = {
    target: tone,
    avgCents: 0,
    stability: 0,
    durationHeld: 0,
    centsSamples: [...centsAccumulator],
    passed: false,
  };
  toneResults.update((r) => [...r, result]);
  advanceTone();
}

export function nextExercise() {
  const plan = get(sessionPlan);
  if (!plan) return;
  archiveCurrentExerciseResults();
  const nextIdx = get(exerciseIndex) + 1;
  if (nextIdx >= plan.exercises.length) {
    sessionPhase.set('completed');
    return;
  }
  exerciseIndex.set(nextIdx);
  toneIndex.set(0);
  tonePhase.set('waiting');
  sessionPhase.set('running');
  toneResults.set([]);
  resetToneState();
}

export function repeatExercise() {
  toneIndex.set(0);
  toneResults.set([]);
  tonePhase.set('waiting');
  sessionPhase.set('running');
  resetToneState();
}

// ── Tick (called at ~20Hz) ──

function scheduleTick(generation: number) {
  if (generation !== pollingGeneration) return;
  tickTimer = setTimeout(() => void tick(generation), 50);
}

async function tick(generation: number) {
  if (generation !== pollingGeneration) return;
  try {
    if (get(sessionPaused)) return;
    if (get(sessionPhase) !== 'running') return;

    const tone = getCurrentTone();
    if (!tone) return;

    // Read pitch from Tauri
    let pitch: TauriPitchResult | null = null;
    let level = 0;

    if (audioLease) {
      const [p, l] = await Promise.all([
        safeInvoke<TauriPitchResult | null>('get_pitch', undefined, null),
        safeInvoke<TauriAudioLevel>('get_audio_level'),
      ]);
      if (generation !== pollingGeneration) return;
      pitch = p ?? null;
      level = l?.rms ?? 0;
    }

    if (pitch) {
      currentNote.set(pitch.note_name);
      currentOctave.set(pitch.octave);
      currentFrequency.set(pitch.frequency_hz);
      currentCents.set(pitch.cent_deviation);
    } else {
      currentNote.set('');
      currentOctave.set(0);
      currentFrequency.set(0);
      currentCents.set(0);
    }
    audioLevel.set(level ?? 0);

    const phase = get(tonePhase);
    const now = performance.now();

    if (phase === 'waiting') {
      // Wait for the correct note to appear
      if (pitch && isNoteMatch(pitch.note_name, pitch.octave, tone)) {
        tonePhase.set('detecting');
        stableStartTime = 0;
        centsAccumulator = [];
      }
    } else if (phase === 'detecting') {
      if (!pitch || !isNoteMatch(pitch.note_name, pitch.octave, tone)) {
        // Lost the note, go back to waiting
        tonePhase.set('waiting');
        return;
      }
      centsAccumulator.push(pitch.cent_deviation);
      centsSamples.set([...centsAccumulator]);

      if (Math.abs(pitch.cent_deviation) <= STABLE_CENTS) {
        if (stableStartTime === 0) stableStartTime = now;
        if (now - stableStartTime >= SETTLE_MS) {
          // Settled -- transition to held
          tonePhase.set('held');
          holdAccumulator = 0;
          lastAcceptedSampleTime = now;
          lastUnstableTime = 0;
        }
      } else {
        stableStartTime = 0;
      }
    } else if (phase === 'held') {
      if (!pitch || !isNoteMatch(pitch.note_name, pitch.octave, tone)) {
        // Lost the note entirely
        if (lastUnstableTime === 0) lastUnstableTime = now;
        if (now - lastUnstableTime > UNSTABLE_MS) {
          tonePhase.set('waiting');
          resetToneState();
        }
        return;
      }

      centsAccumulator.push(pitch.cent_deviation);
      centsSamples.set([...centsAccumulator]);
      const elapsed = lastAcceptedSampleTime === 0 ? 0 : (now - lastAcceptedSampleTime) / 1000;
      holdAccumulator += Math.max(0, Math.min(elapsed, 0.2));
      lastAcceptedSampleTime = now;

      if (Math.abs(pitch.cent_deviation) <= STABLE_CENTS) {
        lastUnstableTime = 0;
      } else {
        if (lastUnstableTime === 0) lastUnstableTime = now;
        if (now - lastUnstableTime > UNSTABLE_MS) {
          // Reset hold but stay in detecting
          tonePhase.set('detecting');
          holdAccumulator = 0;
          stableStartTime = 0;
          lastUnstableTime = 0;
        }
      }

      // Check if tone duration met
      if (holdAccumulator >= tone.durationSec) {
        completeTone();
      }
    }
  } finally {
    scheduleTick(generation);
  }
}

function isNoteMatch(detected: string, octave: number, target: ToneTarget): boolean {
  const targetMode = getPitchDisplayModeValue() === 'concert' ? 'concert' : 'written';
  return matchesDisplayedTone(
    detected,
    octave,
    target,
    get(selectedInstrument),
    'written',
    targetMode,
  );
}

function completeTone() {
  const tone = getCurrentTone();
  if (!tone) return;

  const avg =
    centsAccumulator.length > 0
      ? centsAccumulator.reduce((s, c) => s + c, 0) / centsAccumulator.length
      : 0;

  const variance =
    centsAccumulator.length > 0
      ? centsAccumulator.reduce((s, c) => s + (c - avg) ** 2, 0) / centsAccumulator.length
      : 0;

  const result: ToneResult = {
    target: tone,
    avgCents: Math.round(avg * 10) / 10,
    stability: Math.round(Math.sqrt(variance) * 10) / 10,
    durationHeld: holdAccumulator,
    centsSamples: [...centsAccumulator],
    passed: true,
  };

  toneResults.update((r) => [...r, result]);
  tonePhase.set('completed');

  // Auto-advance after brief pause
  const generation = pollingGeneration;
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    if (generation === pollingGeneration) advanceTone();
  }, 600);
}

function advanceTone() {
  const ex = getCurrentExercise();
  if (!ex) return;
  const plan = get(sessionPlan);

  const nextTone = get(toneIndex) + 1;
  if (nextTone >= ex.tones.length) {
    const isLastExercise = !plan || get(exerciseIndex) >= plan.exercises.length - 1;
    sessionPhase.set(isLastExercise ? 'completed' : 'between_exercises');
    tonePhase.set('completed');
  } else {
    toneIndex.set(nextTone);
    tonePhase.set('waiting');
    resetToneState();
  }
}

function resetToneState() {
  holdAccumulator = 0;
  centsAccumulator = [];
  centsSamples.set([]);
  stableStartTime = 0;
  lastUnstableTime = 0;
  lastAcceptedSampleTime = 0;
}

function resetSessionStores() {
  sessionPlan.set(null);
  exerciseIndex.set(0);
  toneIndex.set(0);
  tonePhase.set('waiting');
  toneResults.set([]);
  completedExercises.set([]);
  centsSamples.set([]);
  currentCents.set(0);
  currentNote.set('');
  currentOctave.set(0);
  currentFrequency.set(0);
  audioLevel.set(0);
  elapsedSeconds.set(0);
  resetToneState();
}

function cloneResult(result: ToneResult): ToneResult {
  return {
    ...result,
    target: { ...result.target },
    centsSamples: [...result.centsSamples],
  };
}

function snapshotCurrentExerciseRun(): CompletedExerciseRun | null {
  const exercise = getCurrentExercise();
  const results = get(toneResults);
  if (!exercise || results.length === 0) return null;

  return {
    exercise,
    results: results.map(cloneResult),
  };
}

function archiveCurrentExerciseResults() {
  const run = snapshotCurrentExerciseRun();
  if (!run) return;

  completedExercises.update((runs) => [...runs, run]);
}

function getPersistedExerciseRuns(): CompletedExerciseRun[] {
  const runs = get(completedExercises).map((run) => ({
    exercise: run.exercise,
    results: run.results.map(cloneResult),
  }));
  const currentRun = snapshotCurrentExerciseRun();
  if (currentRun) runs.push(currentRun);
  return runs;
}

function clearIntervals() {
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}
