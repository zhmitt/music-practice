/**
 * Pattern practice session engine.
 *
 * Manages the 4-round cycle: count-in → play pattern click track →
 * capture onsets → score → show results → next round.
 */
import { writable, get } from 'svelte/store';
import type { RhythmPattern } from '$lib/rhythm/patterns';
import { computeExpectedOnsets, patternDurationMs } from '$lib/rhythm/patterns';
import { OnsetDetector } from '$lib/rhythm/onsetDetector';

// ── Types ──

export interface BeatTiming {
  label: string;
  expectedMs: number;
  actualMs: number | null;
  deviationMs: number | null;
  hit: boolean; // within ±20ms
}

export interface RoundResult {
  round: number;
  timings: BeatTiming[];
  scorePct: number;
}

export type PatternPhase = 'idle' | 'countdown' | 'playing' | 'scoring';

// ── Stores ──

export const patternPhase = writable<PatternPhase>('idle');
export const currentPattern = writable<RhythmPattern | null>(null);
export const currentRound = writable(0); // 1-based
export const roundResults = writable<RoundResult[]>([]);
export const latestTimings = writable<BeatTiming[]>([]);
export const countdownBeat = writable(0); // 1..4 during countdown

// ── Internal state ──

let audioCtx: AudioContext | null = null;
let detector: OnsetDetector | null = null;
let capturedOnsets: number[] = [];
let patternStartTime = 0;

const HIT_WINDOW_MS = 20;
const COUNT_IN_BEATS = 4;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Schedule a click at the given AudioContext time. */
function scheduleClick(ctx: AudioContext, time: number, isAccent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isAccent ? 1000 : 800, time);
  const amp = isAccent ? 0.5 : 0.35;
  gain.gain.setValueAtTime(amp, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.start(time);
  osc.stop(time + 0.04);
}

/** Start a pattern round. */
export async function startPatternRound(pattern: RhythmPattern, isRepeat = false) {
  currentPattern.set(pattern);
  if (!isRepeat) {
    currentRound.update(r => r + 1);
  }
  latestTimings.set([]);
  capturedOnsets = [];
  patternPhase.set('countdown');

  const ctx = getAudioCtx();
  const beatDurMs = 60_000 / pattern.bpm;
  const beatDurSec = beatDurMs / 1000;

  // Start onset detector (microphone)
  detector = new OnsetDetector();
  await detector.start((event) => {
    // Store onset relative to pattern start
    const relativeMs = event.timestampMs - patternStartTime;
    capturedOnsets.push(relativeMs);
  });

  // Count-in: 4 clicks
  const countInStart = ctx.currentTime + 0.1;
  for (let i = 0; i < COUNT_IN_BEATS; i++) {
    const t = countInStart + i * beatDurSec;
    scheduleClick(ctx, t, i === 0);
    // Visual countdown update
    const delay = (t - ctx.currentTime) * 1000;
    setTimeout(() => countdownBeat.set(i + 1), Math.max(0, delay));
  }

  // Pattern starts after count-in
  const patternStartSec = countInStart + COUNT_IN_BEATS * beatDurSec;
  patternStartTime = patternStartSec * 1000;

  // Schedule pattern clicks (on every note and rest position for reference)
  const expectedOnsets = computeExpectedOnsets(pattern);
  let offsetBeats = 0;
  for (let i = 0; i < pattern.beats.length; i++) {
    const beat = pattern.beats[i];
    const t = patternStartSec + offsetBeats * beatDurSec;
    scheduleClick(ctx, t, offsetBeats === 0);
    offsetBeats += beat.duration;
  }

  // Transition to playing at pattern start
  const toPlayingDelay = (patternStartSec - ctx.currentTime) * 1000;
  setTimeout(() => {
    patternPhase.set('playing');
    countdownBeat.set(0);
  }, Math.max(0, toPlayingDelay));

  // End pattern and score
  const durationMs = patternDurationMs(pattern);
  const endDelay = toPlayingDelay + durationMs + 200; // 200ms grace period
  setTimeout(() => scoreRound(pattern), Math.max(0, endDelay));
}

/** Score the current round by matching onsets to expected beats. */
function scoreRound(pattern: RhythmPattern) {
  detector?.stop();
  detector = null;

  const expected = computeExpectedOnsets(pattern);
  const timings: BeatTiming[] = [];

  // For each expected onset, find the closest captured onset
  const usedOnsets = new Set<number>();

  for (const exp of expected) {
    let bestIdx = -1;
    let bestDev = Infinity;

    for (let i = 0; i < capturedOnsets.length; i++) {
      if (usedOnsets.has(i)) continue;
      const dev = capturedOnsets[i] - exp.expectedMs;
      if (Math.abs(dev) < Math.abs(bestDev) && Math.abs(dev) < 500) { // 500ms max window
        bestDev = dev;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      usedOnsets.add(bestIdx);
      timings.push({
        label: exp.label,
        expectedMs: exp.expectedMs,
        actualMs: capturedOnsets[bestIdx] + exp.expectedMs - (capturedOnsets[bestIdx] - bestDev), // store absolute
        deviationMs: Math.round(bestDev),
        hit: Math.abs(bestDev) <= HIT_WINDOW_MS,
      });
    } else {
      // Missed
      timings.push({
        label: exp.label,
        expectedMs: exp.expectedMs,
        actualMs: null,
        deviationMs: null,
        hit: false,
      });
    }
  }

  const noteBeats = timings.length;
  const hits = timings.filter(t => t.hit).length;
  const scorePct = noteBeats > 0 ? Math.round((hits / noteBeats) * 100) : 0;

  const result: RoundResult = {
    round: get(currentRound),
    timings,
    scorePct,
  };

  latestTimings.set(timings);
  roundResults.update(rs => [...rs, result]);
  patternPhase.set('scoring');
}

/** Start a fresh session with a pattern. */
export function startPatternSession(pattern: RhythmPattern) {
  currentRound.set(0);
  roundResults.set([]);
  latestTimings.set([]);
  startPatternRound(pattern);
}

/** Repeat the same round (no round increment). */
export function repeatRound() {
  const pattern = get(currentPattern);
  if (pattern) startPatternRound(pattern, true);
}

/** Advance to next round (or signal completion if round 4 done). */
export function nextRound() {
  const round = get(currentRound);
  const pattern = get(currentPattern);
  if (round >= 4 || !pattern) {
    // Session complete for this pattern
    patternPhase.set('idle');
    return;
  }
  startPatternRound(pattern);
}

/** Stop everything and reset. */
export function stopPatternSession() {
  detector?.stop();
  detector = null;
  patternPhase.set('idle');
  currentPattern.set(null);
  currentRound.set(0);
  roundResults.set([]);
  latestTimings.set([]);
  capturedOnsets = [];
}
