/**
 * Play a synthetic reference tone via Web Audio API.
 * Generates a warm tone (sine + soft overtone) with attack/release envelope.
 */

const NOTE_ORDER = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function noteToFrequency(note: string, octave: number, referenceA4 = 442): number {
  const idx = NOTE_ORDER.indexOf(note);
  if (idx === -1) return 440;
  const midi = (octave + 1) * 12 + idx;
  const semitonesFromA4 = midi - 69;
  return referenceA4 * Math.pow(2, semitonesFromA4 / 12);
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Play a single note for the given duration. Returns a promise that resolves when done. */
export function playNote(note: string, octave: number, durationMs = 600, volume = 0.3): Promise<void> {
  const ctx = getCtx();
  const freq = noteToFrequency(note, octave);
  const now = ctx.currentTime;

  // Fundamental
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = freq;

  // Soft overtone (octave above, low volume) for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2;

  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(ctx.destination);
  gain2.connect(ctx.destination);

  const attack = 0.03;
  const release = 0.08;
  const dur = durationMs / 1000;

  // Envelope
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume, now + attack);
  gain1.gain.setValueAtTime(volume, now + dur - release);
  gain1.gain.linearRampToValueAtTime(0, now + dur);

  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(volume * 0.15, now + attack);
  gain2.gain.setValueAtTime(volume * 0.15, now + dur - release);
  gain2.gain.linearRampToValueAtTime(0, now + dur);

  osc1.start(now);
  osc1.stop(now + dur + 0.01);
  osc2.start(now);
  osc2.stop(now + dur + 0.01);

  return new Promise(resolve => setTimeout(resolve, durationMs));
}

/** Play a sequence of notes with a short gap between them. */
export async function playSequence(tones: Array<{ note: string; octave: number }>, noteMs = 500, gapMs = 80): Promise<void> {
  for (const t of tones) {
    await playNote(t.note, t.octave, noteMs);
    await new Promise(r => setTimeout(r, gapMs));
  }
}
