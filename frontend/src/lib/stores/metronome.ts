import { writable, get } from 'svelte/store';

// ── Types ──

export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';
export type AccentMode = 'standard' | 'beat1_only' | 'none';
export type Subdivision = 'none' | 'eighth' | 'triplet' | 'sixteenth';
export type ClickSound = 'click' | 'woodblock' | 'rimshot' | 'soft';

// ── Stores ──

export const bpm = writable(100);
export const timeSignature = writable<TimeSignature>('4/4');
export const accentMode = writable<AccentMode>('standard');
export const subdivision = writable<Subdivision>('none');
export const clickSound = writable<ClickSound>('click');
export const volume = writable(0.7);
export const isPlaying = writable(false);
export const currentBeat = writable(-1); // -1 = not playing, 0-indexed beat

// ── Audio Engine ──

let audioCtx: AudioContext | null = null;
let nextBeatTime = 0;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let beatIndex = 0;

/** How far ahead to schedule audio (seconds). */
const SCHEDULE_AHEAD = 0.1;
/** How often to check for scheduling (ms). */
const SCHEDULER_INTERVAL = 25;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getBeatsPerBar(ts: TimeSignature): number {
  switch (ts) {
    case '2/4':
      return 2;
    case '3/4':
      return 3;
    case '4/4':
      return 4;
    case '6/8':
      return 6;
  }
}

function getSubdivisionsPerBeat(sub: Subdivision): number {
  switch (sub) {
    case 'none':
      return 1;
    case 'eighth':
      return 2;
    case 'triplet':
      return 3;
    case 'sixteenth':
      return 4;
  }
}

export function getBeatClickBehavior(
  accent: AccentMode,
  beatInBar: number,
): { shouldPlay: boolean; isAccent: boolean } {
  const isDownbeat = beatInBar === 0;

  switch (accent) {
    case 'beat1_only':
      return {
        shouldPlay: isDownbeat,
        isAccent: isDownbeat,
      };
    case 'none':
      return {
        shouldPlay: true,
        isAccent: false,
      };
    default:
      return {
        shouldPlay: true,
        isAccent: isDownbeat,
      };
  }
}

/** Schedule a single click at the given time. */
function scheduleClick(ctx: AudioContext, time: number, isAccent: boolean, isSubdivision: boolean) {
  const vol = get(volume);
  const sound = get(clickSound);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Frequency and envelope based on accent/subdivision
  let freq: number;
  let amplitude: number;
  let duration: number;

  if (isSubdivision) {
    freq = 1200;
    amplitude = vol * 0.25;
    duration = 0.02;
  } else if (isAccent) {
    freq = 1000;
    amplitude = vol * 0.8;
    duration = 0.04;
  } else {
    freq = 800;
    amplitude = vol * 0.5;
    duration = 0.03;
  }

  // Sound variations
  switch (sound) {
    case 'woodblock':
      freq *= 1.5;
      osc.type = 'triangle';
      break;
    case 'rimshot':
      freq *= 0.7;
      osc.type = 'square';
      duration *= 0.6;
      break;
    case 'soft':
      osc.type = 'sine';
      amplitude *= 0.6;
      duration *= 1.5;
      break;
    default:
      osc.type = 'sine';
  }

  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(amplitude, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.start(time);
  osc.stop(time + duration + 0.01);
}

function scheduler() {
  const ctx = getAudioContext();
  const currentBpm = get(bpm);
  const ts = get(timeSignature);
  const sub = get(subdivision);
  const accent = get(accentMode);
  const beatsPerBar = getBeatsPerBar(ts);
  const subsPerBeat = getSubdivisionsPerBeat(sub);

  // For 6/8, the beat unit is an eighth note — group in threes
  const beatDuration =
    ts === '6/8'
      ? 60.0 / currentBpm / 1.5 // dotted-quarter reference
      : 60.0 / currentBpm;

  const subDuration = beatDuration / subsPerBeat;

  while (nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD) {
    const beatInBar = beatIndex % beatsPerBar;
    const beatBehavior = getBeatClickBehavior(accent, beatInBar);

    if (beatBehavior.shouldPlay) {
      scheduleClick(ctx, nextBeatTime, beatBehavior.isAccent, false);
    }

    // Update visual beat on the UI thread
    const capturedBeat = beatInBar;
    const delay = Math.max(0, (nextBeatTime - ctx.currentTime) * 1000);
    setTimeout(() => currentBeat.set(capturedBeat), delay);

    // Schedule subdivisions
    for (let s = 1; s < subsPerBeat; s++) {
      const subTime = nextBeatTime + s * subDuration;
      scheduleClick(ctx, subTime, false, true);
    }

    nextBeatTime += beatDuration;
    beatIndex++;
  }
}

export function startMetronome() {
  const ctx = getAudioContext();
  beatIndex = 0;
  nextBeatTime = ctx.currentTime + 0.05; // tiny delay to avoid glitch
  isPlaying.set(true);
  currentBeat.set(0);

  schedulerTimer = setInterval(scheduler, SCHEDULER_INTERVAL);
}

export function stopMetronome() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  isPlaying.set(false);
  currentBeat.set(-1);
  beatIndex = 0;
}

export function toggleMetronome() {
  if (get(isPlaying)) {
    stopMetronome();
  } else {
    startMetronome();
  }
}

/** Tap tempo — call on each tap, calculates BPM from intervals. */
const tapTimes: number[] = [];
const TAP_RESET_MS = 2000;

export function tapTempo() {
  const now = Date.now();

  // Reset if too long since last tap
  if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > TAP_RESET_MS) {
    tapTimes.length = 0;
  }

  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift(); // keep last 8

  if (tapTimes.length >= 2) {
    let totalMs = 0;
    for (let i = 1; i < tapTimes.length; i++) {
      totalMs += tapTimes[i] - tapTimes[i - 1];
    }
    const avgMs = totalMs / (tapTimes.length - 1);
    const newBpm = Math.round(60000 / avgMs);
    bpm.set(Math.max(40, Math.min(208, newBpm)));
  }
}

export function adjustBpm(delta: number) {
  bpm.update((b) => Math.max(40, Math.min(208, b + delta)));
}
