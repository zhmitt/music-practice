import { writable, get } from 'svelte/store';
import { sessionActive, sessionPaused } from './navigation';
import type { SessionPlan, ExerciseDef, ToneTarget, ToneResult, TonePhase, SessionPhase } from '$lib/types/session';
import { saveSession, today, type SessionRecord, type ToneRecord } from './history';

// ── Reactive state (writable stores for Svelte 4/5 compatibility) ──

export const sessionPlan = writable<SessionPlan | null>(null);
export const exerciseIndex = writable(0);
export const toneIndex = writable(0);
export const tonePhase = writable<TonePhase>('waiting');
export const sessionPhase = writable<SessionPhase>('running');
export const toneResults = writable<ToneResult[]>([]);
export const centsSamples = writable<number[]>([]);
export const currentCents = writable(0);
export const currentNote = writable('');
export const currentFrequency = writable(0);
export const audioLevel = writable(0);
export const elapsedSeconds = writable(0);

// ── Internal state ──

let tickInterval: ReturnType<typeof setInterval> | null = null;
let elapsedInterval: ReturnType<typeof setInterval> | null = null;
let stableStartTime = 0;
let holdAccumulator = 0;
let centsAccumulator: number[] = [];
let audioStarted = false;

// Thresholds
const STABLE_CENTS = 15;   // considered stable within +-15 cents
const SETTLE_MS = 400;     // settling time before hold timer starts
const UNSTABLE_MS = 800;   // if unstable for this long, reset hold

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
  // Reset state
  sessionPlan.set(plan);
  exerciseIndex.set(0);
  toneIndex.set(0);
  tonePhase.set('waiting');
  sessionPhase.set('running');
  toneResults.set([]);
  centsSamples.set([]);
  currentCents.set(0);
  currentNote.set('');
  currentFrequency.set(0);
  audioLevel.set(0);
  elapsedSeconds.set(0);
  holdAccumulator = 0;
  centsAccumulator = [];
  stableStartTime = 0;
  lastUnstableTime = 0;

  // Start audio via Tauri
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('start_audio', { deviceName: null });
    audioStarted = true;
  } catch {
    // Fallback: no audio (browser preview), still run session UI
    audioStarted = false;
  }

  // Activate session overlay
  sessionActive.set(true);
  sessionPaused.set(false);

  // Start tick loop (20Hz)
  tickInterval = setInterval(tick, 50);

  // Start elapsed timer
  elapsedInterval = setInterval(() => {
    if (get(sessionPhase) === 'running') {
      elapsedSeconds.update(v => v + 1);
    }
  }, 1000);
}

export async function stopSession() {
  // Persist session results before cleanup
  persistSessionResults();

  clearIntervals();

  if (audioStarted) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('stop_audio');
    } catch { /* ignore */ }
    audioStarted = false;
  }

  sessionActive.set(false);
  sessionPaused.set(false);
  sessionPhase.set('completed');
}

function persistSessionResults() {
  const results = get(toneResults);
  const exercise = getCurrentExercise();
  if (!exercise || results.length === 0) return;

  const tones: ToneRecord[] = results.map(r => ({
    note: `${r.target.note}${r.target.octave}`,
    avgCents: r.avgCents,
    stability: r.stability,
    passed: r.passed,
  }));

  const passed = results.filter(r => r.passed).length;
  const totalCents = results.reduce((s, r) => s + Math.abs(r.avgCents), 0);

  const record: SessionRecord = {
    id: new Date().toISOString(),
    date: today(),
    durationSeconds: get(elapsedSeconds),
    exerciseType: exercise.type,
    exerciseName: exercise.nameKey,
    tones,
    accuracy: results.length > 0 ? passed / results.length : 0,
    avgCents: results.length > 0 ? totalCents / results.length : 0,
  };

  saveSession(record);
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
  toneResults.update(r => [...r, result]);
  advanceTone();
}

export function nextExercise() {
  const plan = get(sessionPlan);
  if (!plan) return;
  const nextIdx = get(exerciseIndex) + 1;
  if (nextIdx >= plan.exercises.length) {
    sessionPhase.set('completed');
    return;
  }
  exerciseIndex.set(nextIdx);
  toneIndex.set(0);
  tonePhase.set('waiting');
  sessionPhase.set('running');
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

async function tick() {
  if (get(sessionPaused)) return;
  if (get(sessionPhase) !== 'running') return;

  const tone = getCurrentTone();
  if (!tone) return;

  // Read pitch from Tauri
  let pitch: { detected: boolean; note: string; octave: number; cents: number; frequency: number } | null = null;
  let level = 0;

  if (audioStarted) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      [pitch, level] = await Promise.all([
        invoke<any>('get_pitch'),
        invoke<any>('get_audio_level').then((l: any) => l.rms as number),
      ]);
    } catch { /* ignore */ }
  }

  if (pitch) {
    currentNote.set(pitch.detected ? pitch.note : '');
    currentFrequency.set(pitch.detected ? pitch.frequency : 0);
    currentCents.set(pitch.detected ? pitch.cents : 0);
  }
  audioLevel.set(level ?? 0);

  const phase = get(tonePhase);
  const now = Date.now();

  if (phase === 'waiting') {
    // Wait for the correct note to appear
    if (pitch?.detected && isNoteMatch(pitch.note, pitch.octave, tone)) {
      tonePhase.set('detecting');
      stableStartTime = 0;
      centsAccumulator = [];
    }
  } else if (phase === 'detecting') {
    if (!pitch?.detected || !isNoteMatch(pitch.note, pitch.octave, tone)) {
      // Lost the note, go back to waiting
      tonePhase.set('waiting');
      return;
    }
    centsAccumulator.push(pitch.cents);
    centsSamples.set([...centsAccumulator]);

    if (Math.abs(pitch.cents) <= STABLE_CENTS) {
      if (stableStartTime === 0) stableStartTime = now;
      if (now - stableStartTime >= SETTLE_MS) {
        // Settled -- transition to held
        tonePhase.set('held');
        holdAccumulator = 0;
        lastUnstableTime = 0;
      }
    } else {
      stableStartTime = 0;
    }
  } else if (phase === 'held') {
    if (!pitch?.detected || !isNoteMatch(pitch.note, pitch.octave, tone)) {
      // Lost the note entirely
      if (lastUnstableTime === 0) lastUnstableTime = now;
      if (now - lastUnstableTime > UNSTABLE_MS) {
        tonePhase.set('waiting');
        resetToneState();
      }
      return;
    }

    centsAccumulator.push(pitch.cents);
    centsSamples.set([...centsAccumulator]);
    holdAccumulator += 0.05; // 50ms tick

    if (Math.abs(pitch.cents) <= STABLE_CENTS) {
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
}

function isNoteMatch(detected: string, octave: number, target: ToneTarget): boolean {
  return detected === target.note && octave === target.octave;
}

function completeTone() {
  const tone = getCurrentTone();
  if (!tone) return;

  const avg = centsAccumulator.length > 0
    ? centsAccumulator.reduce((s, c) => s + c, 0) / centsAccumulator.length
    : 0;

  const variance = centsAccumulator.length > 0
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

  toneResults.update(r => [...r, result]);
  tonePhase.set('completed');

  // Auto-advance after brief pause
  setTimeout(() => advanceTone(), 600);
}

function advanceTone() {
  const ex = getCurrentExercise();
  if (!ex) return;

  const nextTone = get(toneIndex) + 1;
  if (nextTone >= ex.tones.length) {
    // Exercise complete
    sessionPhase.set('between_exercises');
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
}

function clearIntervals() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  if (elapsedInterval) { clearInterval(elapsedInterval); elapsedInterval = null; }
}
