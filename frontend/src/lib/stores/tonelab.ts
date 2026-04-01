import { writable, get } from 'svelte/store';
import type { PitchSample, NoteTendency, ToneLabStats, ToneLabMode } from '$lib/types/tonelab';

// ── Reactive state ──

export const tonelabActive = writable(false);
export const tonelabMode = writable<ToneLabMode>('free_play');

export const currentNote = writable('');
export const currentOctave = writable(0);
export const currentCents = writable(0);
export const currentFrequency = writable(0);
export const isDetecting = writable(false);
export const audioLevel = writable(0);

/** Rolling 60s pitch history. */
export const historySamples = writable<PitchSample[]>([]);

/** Short rolling buffer for stability graph. */
export const centsSamples = writable<number[]>([]);

/** Per-note tendency map. */
export const tendencies = writable<NoteTendency[]>([]);

/** Session stats. */
export const stats = writable<ToneLabStats>({ toneCount: 0, accuracy: 0, avgCents: 0 });

// ── Internal state ──

let tickInterval: ReturnType<typeof setInterval> | null = null;
let audioStarted = false;
let lastNoteKey = '';
let toneTransitions = 0;
let totalSamples = 0;
let accurateSamples = 0;
let centsSumAbs = 0;

const HISTORY_WINDOW_MS = 60_000;
const ACCURACY_TOLERANCE = 10; // cents
const MAX_CENTS_BUFFER = 200;

// tendencyMap for accumulation
const tendencyMap = new Map<string, { sum: number; count: number }>();

// ── Lifecycle ──

export async function startToneLab() {
  resetState();

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('start_audio', { deviceName: null });
    audioStarted = true;
  } catch {
    audioStarted = false;
  }

  tonelabActive.set(true);
  tickInterval = setInterval(tick, 50);
}

export async function stopToneLab() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }

  if (audioStarted) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('stop_audio');
    } catch { /* ignore */ }
    audioStarted = false;
  }

  tonelabActive.set(false);
}

// ── Tick (20Hz) ──

async function tick() {
  if (!get(tonelabActive)) return;

  let pitch: {
    note_name: string;
    octave: number;
    cent_deviation: number;
    frequency_hz: number;
    confidence: number;
  } | null = null;
  let level = 0;

  if (audioStarted) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const [p, l] = await Promise.all([
        invoke<any>('get_pitch'),
        invoke<any>('get_audio_level'),
      ]);
      pitch = p;
      level = l?.rms ?? 0;
    } catch { /* ignore */ }
  }

  audioLevel.set(level);

  if (pitch && pitch.confidence > 0.4) {
    const note = pitch.note_name;
    const oct = pitch.octave;
    const cents = pitch.cent_deviation;
    const freq = pitch.frequency_hz;
    const noteKey = `${note}${oct}`;

    currentNote.set(note);
    currentOctave.set(oct);
    currentCents.set(cents);
    currentFrequency.set(freq);
    isDetecting.set(true);

    // Track tone transitions
    if (noteKey !== lastNoteKey) {
      if (lastNoteKey !== '') toneTransitions++;
      lastNoteKey = noteKey;
    }

    // Accumulate stats
    totalSamples++;
    centsSumAbs += Math.abs(cents);
    if (Math.abs(cents) <= ACCURACY_TOLERANCE) accurateSamples++;

    // Tendency
    const existing = tendencyMap.get(noteKey);
    if (existing) {
      existing.sum += cents;
      existing.count++;
    } else {
      tendencyMap.set(noteKey, { sum: cents, count: 1 });
    }

    // History sample
    const sample: PitchSample = {
      noteKey, noteName: note, octave: oct,
      cents, frequencyHz: freq, timestampMs: Date.now(),
    };

    historySamples.update(h => {
      const now = Date.now();
      const filtered = h.filter(s => now - s.timestampMs < HISTORY_WINDOW_MS);
      filtered.push(sample);
      return filtered;
    });

    // Short cents buffer for stability graph
    centsSamples.update(c => {
      const next = [...c, cents];
      return next.length > MAX_CENTS_BUFFER ? next.slice(-MAX_CENTS_BUFFER) : next;
    });

  } else {
    isDetecting.set(false);
    currentNote.set('');
    currentFrequency.set(0);
  }

  // Update derived stats
  stats.set({
    toneCount: toneTransitions + (lastNoteKey ? 1 : 0),
    accuracy: totalSamples > 0 ? accurateSamples / totalSamples : 0,
    avgCents: totalSamples > 0 ? centsSumAbs / totalSamples : 0,
  });

  // Update tendencies
  const tenArr: NoteTendency[] = [];
  for (const [key, val] of tendencyMap) {
    tenArr.push({ noteKey: key, sampleCount: val.count, avgCents: val.sum / val.count });
  }
  // Sort by sample count descending (most played notes first)
  tenArr.sort((a, b) => b.sampleCount - a.sampleCount);
  tendencies.set(tenArr);
}

function resetState() {
  tonelabActive.set(false);
  currentNote.set('');
  currentOctave.set(0);
  currentCents.set(0);
  currentFrequency.set(0);
  isDetecting.set(false);
  audioLevel.set(0);
  historySamples.set([]);
  centsSamples.set([]);
  tendencies.set([]);
  stats.set({ toneCount: 0, accuracy: 0, avgCents: 0 });
  lastNoteKey = '';
  toneTransitions = 0;
  totalSamples = 0;
  accurateSamples = 0;
  centsSumAbs = 0;
  tendencyMap.clear();
}
