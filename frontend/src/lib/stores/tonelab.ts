import { writable, get } from 'svelte/store';
import type { PitchSample, NoteTendency, ToneLabStats, ToneLabMode } from '$lib/types/tonelab';
import { acquireAudioLease, releaseAudioLease, type AudioLeaseHandle } from './audioPreferences';
import type { TauriPitchResult, TauriAudioLevel, TauriRuntimeError } from '$lib/types/tauri';
import { getKV, safeInvoke } from '$lib/db';
import { invokeTauri } from '$lib/tauri/runtime';

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

/** Current drone note (concert pitch). */
export const droneNote = writable('Bb');
export const droneOctave = writable(3);
export const droneActive = writable(false);
export const droneRuntimeError = writable<TauriRuntimeError | null>(null);

// ── Internal state ──

let tickTimer: ReturnType<typeof setTimeout> | null = null;
let pollingGeneration = 0;
let droneGeneration = 0;
let audioLease: AudioLeaseHandle | null = null;
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
  const generation = ++pollingGeneration;
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
  const retainedLease = audioLease;
  if (audioLease && (await releaseAudioLease(audioLease))) audioLease = null;
  resetState();

  const acquiredLease = await acquireAudioLease('tonelab');
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

  tonelabActive.set(true);
  scheduleTick(generation);

  // If drone mode, start the drone
  if (get(tonelabMode) === 'drone') {
    await startDrone(++droneGeneration);
  }
}

export async function stopToneLab() {
  pollingGeneration++;
  droneGeneration++;
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }

  // Stop drone if running
  await stopDrone();

  if (audioLease) {
    if (await releaseAudioLease(audioLease)) audioLease = null;
  }

  tonelabActive.set(false);
}

// ── Drone control ──

async function startDrone(expectedGeneration = droneGeneration) {
  const note = get(droneNote);
  const octave = get(droneOctave);
  const stored = await getKV('tt-tuning');
  const referenceA4 = stored ? parseFloat(stored) : 442;
  try {
    await invokeTauri('start_drone', { note, octave, referenceA4 });
    if (expectedGeneration !== droneGeneration) {
      await invokeTauri('stop_drone');
      droneActive.set(false);
      return;
    }
    droneActive.set(true);
    droneRuntimeError.set(null);
  } catch {
    await reconcileDroneStatus();
  }
}

async function stopDrone(): Promise<boolean> {
  if (!get(droneActive)) return true;
  try {
    await invokeTauri('stop_drone');
    droneActive.set(false);
    droneRuntimeError.set(null);
    return true;
  } catch {
    const isPlaying = await reconcileDroneStatus();
    return !isPlaying;
  } finally {
    // Native status is authoritative after a rejected transition.
  }
}

async function reconcileDroneStatus(): Promise<boolean> {
  try {
    const status = await invokeTauri('get_drone_runtime_status');
    droneActive.set(status.is_playing);
    droneRuntimeError.set(status.runtime_error);
    return status.is_playing;
  } catch {
    droneRuntimeError.set({
      kind: 'audio_subsystem_unavailable',
      message: 'Drone runtime status unavailable',
      device_name: null,
    });
    return get(droneActive);
  }
}

/** Change drone note while playing. */
export async function setDroneNote(note: string, octave: number) {
  droneNote.set(note);
  droneOctave.set(octave);

  if (get(droneActive)) {
    const stored = await getKV('tt-tuning');
    const referenceA4 = stored ? parseFloat(stored) : 442;
    await safeInvoke('set_drone_note', { note, octave, referenceA4 });
  }
}

/** Switch tone lab mode. If switching to/from drone, handle drone lifecycle. */
export async function switchMode(mode: ToneLabMode) {
  const generation = ++droneGeneration;
  const wasActive = get(tonelabActive);
  const prevMode = get(tonelabMode);

  tonelabMode.set(mode);

  if (wasActive) {
    // Stop drone if leaving drone mode
    if (prevMode === 'drone' && mode !== 'drone') {
      await stopDrone();
    }
    // Start drone if entering drone mode
    if (mode === 'drone' && prevMode !== 'drone') {
      await startDrone(generation);
    }
  }
}

// ── Tick (20Hz) ──

function scheduleTick(generation: number) {
  if (generation !== pollingGeneration) return;
  tickTimer = setTimeout(() => void tick(generation), 50);
}

async function tick(generation: number) {
  if (generation !== pollingGeneration) return;
  try {
    if (!get(tonelabActive)) return;

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
        noteKey,
        noteName: note,
        octave: oct,
        cents,
        frequencyHz: freq,
        timestampMs: Date.now(),
      };

      historySamples.update((h) => {
        const now = Date.now();
        const filtered = h.filter((s) => now - s.timestampMs < HISTORY_WINDOW_MS);
        filtered.push(sample);
        return filtered;
      });

      // Short cents buffer for stability graph
      centsSamples.update((c) => {
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
  } finally {
    scheduleTick(generation);
  }
}

function resetState() {
  tonelabActive.set(false);
  droneActive.set(false);
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
