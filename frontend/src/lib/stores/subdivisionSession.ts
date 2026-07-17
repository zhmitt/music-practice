/**
 * Subdivision Trainer session engine.
 *
 * Plays main-beat clicks only. The user provides the subdivisions
 * (via instrument or clapping). Onset detection captures the timing
 * of each subdivision slot and computes deviation + evenness score.
 *
 * Flow: select subdivision type + BPM → count-in → N bars of clicks →
 * capture onsets → show deviation chart + evenness score.
 */
import { writable, get } from 'svelte/store';
import { OnsetDetector } from '$lib/rhythm/onsetDetector';

// ── Types ──

export type SubdivisionType = 'eighth' | 'triplet' | 'sixteenth';

export interface SlotResult {
  /** Slot label, e.g. "1", "und 1", "e 2" */
  label: string;
  /** Whether this is a main beat (click provided) or a subdivision slot (user plays). */
  isMainBeat: boolean;
  /** Expected time relative to bar start (ms). */
  expectedMs: number;
  /** Actual onset time (ms), null if missed. */
  actualMs: number | null;
  /** Deviation in ms, null if missed. */
  deviationMs: number | null;
}

export interface BarResult {
  barNumber: number;
  slots: SlotResult[];
  evennessScore: number; // RMS of subdivision deviations in ms
}

export type SubPhase = 'idle' | 'countdown' | 'playing' | 'scoring';

// ── Stores ──

export const subPhase = writable<SubPhase>('idle');
export const subType = writable<SubdivisionType>('eighth');
export const subBpm = writable(80);
export const subBars = writable(2); // how many bars to play
export const subTimeSignature = writable<'3/4' | '4/4'>('4/4');
export const countdownBeat = writable(0);
export const barResults = writable<BarResult[]>([]);
export const overallEvenness = writable(0);

// ── Internal ──

let audioCtx: AudioContext | null = null;
let detector: OnsetDetector | null = null;
let capturedOnsets: number[] = [];
let exerciseStartTime = 0;

const COUNT_IN_BEATS = 4;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function scheduleClick(ctx: AudioContext, time: number, isDownbeat: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isDownbeat ? 1000 : 800, time);
  const amp = isDownbeat ? 0.5 : 0.35;
  gain.gain.setValueAtTime(amp, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.start(time);
  osc.stop(time + 0.04);
}

function subsPerBeat(type: SubdivisionType): number {
  switch (type) {
    case 'eighth':
      return 2;
    case 'triplet':
      return 3;
    case 'sixteenth':
      return 4;
  }
}

function beatsPerBar(ts: '3/4' | '4/4'): number {
  return ts === '3/4' ? 3 : 4;
}

/** Build the expected slot grid for one bar. */
function buildBarSlots(
  bpm: number,
  type: SubdivisionType,
  ts: '3/4' | '4/4',
): Array<{ label: string; isMainBeat: boolean; expectedMs: number }> {
  const beatMs = 60_000 / bpm;
  const numBeats = beatsPerBar(ts);
  const subs = subsPerBeat(type);
  const subMs = beatMs / subs;
  const slots: Array<{ label: string; isMainBeat: boolean; expectedMs: number }> = [];

  const subLabels: Record<SubdivisionType, string[]> = {
    eighth: ['', 'und'],
    triplet: ['', 'tri', 'let'],
    sixteenth: ['', 'e', 'und', 'a'],
  };

  for (let beat = 0; beat < numBeats; beat++) {
    for (let s = 0; s < subs; s++) {
      const isMain = s === 0;
      const label = s === 0 ? `${beat + 1}` : `${subLabels[type][s]} ${beat + 1}`;
      const expectedMs = beat * beatMs + s * subMs;
      slots.push({ label, isMainBeat: isMain, expectedMs });
    }
  }

  return slots;
}

/** Start a subdivision exercise. */
export async function startSubdivisionExercise() {
  const bpm = get(subBpm);
  const type = get(subType);
  const ts = get(subTimeSignature);
  const bars = get(subBars);

  barResults.set([]);
  overallEvenness.set(0);
  capturedOnsets = [];
  subPhase.set('countdown');

  const ctx = getAudioCtx();
  const beatMs = 60_000 / bpm;
  const beatSec = beatMs / 1000;
  const numBeats = beatsPerBar(ts);
  const barDurationSec = numBeats * beatSec;

  // Start onset detector
  detector = new OnsetDetector();
  await detector.start((event) => {
    const relativeMs = event.timestampMs - exerciseStartTime;
    capturedOnsets.push(relativeMs);
  });

  // Count-in
  const countInStart = ctx.currentTime + 0.1;
  for (let i = 0; i < COUNT_IN_BEATS; i++) {
    const t = countInStart + i * beatSec;
    scheduleClick(ctx, t, i === 0);
    const delay = (t - ctx.currentTime) * 1000;
    setTimeout(() => countdownBeat.set(i + 1), Math.max(0, delay));
  }

  // Exercise starts after count-in
  const exerciseStartSec = countInStart + COUNT_IN_BEATS * beatSec;
  exerciseStartTime = exerciseStartSec * 1000;

  // Schedule main-beat clicks for all bars (only main beats, not subdivisions)
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < numBeats; beat++) {
      const t = exerciseStartSec + bar * barDurationSec + beat * beatSec;
      scheduleClick(ctx, t, beat === 0);
    }
  }

  // Transition to playing
  const toPlayingDelay = (exerciseStartSec - ctx.currentTime) * 1000;
  setTimeout(
    () => {
      subPhase.set('playing');
      countdownBeat.set(0);
    },
    Math.max(0, toPlayingDelay),
  );

  // End and score
  const totalDurationMs = bars * numBeats * beatMs;
  const endDelay = toPlayingDelay + totalDurationMs + 300;
  setTimeout(() => scoreExercise(bpm, type, ts, bars), Math.max(0, endDelay));
}

/** Score the exercise by matching onsets to expected subdivision slots. */
function scoreExercise(bpm: number, type: SubdivisionType, ts: '3/4' | '4/4', bars: number) {
  detector?.stop();
  detector = null;

  const numBeats = beatsPerBar(ts);
  const beatMs = 60_000 / bpm;
  const barDurationMs = numBeats * beatMs;
  const slotTemplate = buildBarSlots(bpm, type, ts);

  const results: BarResult[] = [];
  const allSubDeviations: number[] = [];
  const usedOnsets = new Set<number>();

  for (let bar = 0; bar < bars; bar++) {
    const barOffsetMs = bar * barDurationMs;
    const slots: SlotResult[] = [];

    for (const tmpl of slotTemplate) {
      const expectedMs = barOffsetMs + tmpl.expectedMs;

      // Find closest unused onset
      let bestIdx = -1;
      let bestDev = Infinity;
      for (let i = 0; i < capturedOnsets.length; i++) {
        if (usedOnsets.has(i)) continue;
        const dev = capturedOnsets[i] - expectedMs;
        if (Math.abs(dev) < Math.abs(bestDev) && Math.abs(dev) < 300) {
          bestDev = dev;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        usedOnsets.add(bestIdx);
        const devRounded = Math.round(bestDev);
        slots.push({
          label: tmpl.label,
          isMainBeat: tmpl.isMainBeat,
          expectedMs,
          actualMs: capturedOnsets[bestIdx],
          deviationMs: devRounded,
        });
        if (!tmpl.isMainBeat) {
          allSubDeviations.push(devRounded);
        }
      } else {
        slots.push({
          label: tmpl.label,
          isMainBeat: tmpl.isMainBeat,
          expectedMs,
          actualMs: null,
          deviationMs: null,
        });
      }
    }

    // Evenness = RMS of subdivision deviations for this bar
    const barSubDevs = slots
      .filter((s) => !s.isMainBeat && s.deviationMs !== null)
      .map((s) => s.deviationMs!);
    const evenness =
      barSubDevs.length > 0
        ? Math.round(Math.sqrt(barSubDevs.reduce((s, d) => s + d * d, 0) / barSubDevs.length))
        : 0;

    results.push({ barNumber: bar + 1, slots, evennessScore: evenness });
  }

  // Overall evenness
  const overall =
    allSubDeviations.length > 0
      ? Math.round(
          Math.sqrt(allSubDeviations.reduce((s, d) => s + d * d, 0) / allSubDeviations.length),
        )
      : 0;

  barResults.set(results);
  overallEvenness.set(overall);
  subPhase.set('scoring');
}

/** Stop and reset. */
export function stopSubdivisionExercise() {
  detector?.stop();
  detector = null;
  subPhase.set('idle');
  barResults.set([]);
  overallEvenness.set(0);
  capturedOnsets = [];
}
