import type { Instrument } from '$lib/stores/onboarding';

export type StoredPitchMode = 'written' | 'concert';

export interface NamedTone {
  note: string;
  octave: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_FLAT_MAP: Record<string, { base: string }> = {
  'C#': { base: 'C' },
  Db: { base: 'D' },
  'D#': { base: 'D' },
  Eb: { base: 'E' },
  'F#': { base: 'F' },
  Gb: { base: 'G' },
  'G#': { base: 'G' },
  Ab: { base: 'A' },
  'A#': { base: 'A' },
  Bb: { base: 'B' },
};

export function getInstrumentTransposition(instrument: Instrument): number {
  switch (instrument) {
    case 'horn_bb':
    case 'trumpet_bb':
    case 'clarinet_bb':
    case 'double_horn':
      return 2;
    case 'horn_f':
      return 7;
    default:
      return 0;
  }
}

export function transposeTone(note: string, octave: number, semitones: number): NamedTone {
  const noteIndex = NOTE_NAMES.indexOf(note);
  const midi = (octave + 1) * 12 + (noteIndex >= 0 ? noteIndex : 0) + semitones;
  const normalizedIndex = ((midi % 12) + 12) % 12;

  return {
    note: NOTE_NAMES[normalizedIndex],
    octave: Math.floor(midi / 12) - 1,
  };
}

export function convertToneForDisplay(
  tone: NamedTone,
  instrument: Instrument,
  sourceMode: StoredPitchMode,
  targetMode: StoredPitchMode,
): NamedTone {
  if (sourceMode === targetMode) {
    return tone;
  }

  const transposition = getInstrumentTransposition(instrument);
  if (transposition === 0) {
    return tone;
  }

  const shift = sourceMode === 'written' ? -transposition : transposition;
  return transposeTone(tone.note, tone.octave, shift);
}

export function formatToneLabel(note: string, octave: number, showOctave = true): string {
  return showOctave ? `${note}${octave}` : note;
}

export function matchesDisplayedTone(
  detectedNote: string,
  detectedOctave: number,
  target: NamedTone,
  instrument: Instrument,
  sourceMode: StoredPitchMode,
  targetMode: StoredPitchMode,
): boolean {
  const displayedTarget = convertToneForDisplay(target, instrument, sourceMode, targetMode);
  return displayedTarget.note === detectedNote && displayedTarget.octave === detectedOctave;
}

export function noteToStaffPos(note: string, octave: number): number {
  let baseName = note;
  if (SHARP_FLAT_MAP[note]) {
    baseName = SHARP_FLAT_MAP[note].base;
  }

  const noteIdx = NOTE_ORDER.indexOf(baseName);
  if (noteIdx === -1) return 0;

  const posInOctave = noteIdx;
  const absolutePos = (octave - 4) * 7 + posInOctave;
  return absolutePos - 6;
}

export function hasAccidental(note: string): string | null {
  if (note.includes('#')) return '#';
  if (note.includes('b') && note !== 'B') return 'b';
  return null;
}

export function needsLedgerLines(pos: number): number[] {
  const lines: number[] = [];

  if (pos <= -5) {
    for (let current = -6; current >= pos; current -= 2) {
      lines.push(current);
    }
  }

  if (pos >= 6) {
    for (let current = 6; current <= pos; current += 2) {
      lines.push(current);
    }
  }

  return lines;
}

export function staffY(pos: number, staffTop: number, lineGap: number): number {
  return staffTop + 2 * lineGap - pos * (lineGap / 2);
}
