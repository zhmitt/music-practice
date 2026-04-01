/**
 * Rhythm pattern library.
 *
 * Each pattern defines a sequence of beats where each beat has a type
 * (note or rest) and a duration expressed in fractions of a beat.
 * The onset detector only scores note-type beats; rests are excluded.
 */

export type PatternLevel = 'anfaenger' | 'fortgeschritten' | 'schwer';

export interface PatternBeat {
  /** 'note' = player must play, 'rest' = silence (not scored). */
  type: 'note' | 'rest';
  /** Duration in beats (1 = quarter, 0.5 = eighth, 0.25 = sixteenth, 1.5 = dotted quarter). */
  duration: number;
  /** Display label, e.g. "1", "2+", "3e+" */
  label: string;
}

export interface RhythmPattern {
  id: string;
  name: string;
  nameKey: string; // i18n key
  level: PatternLevel;
  timeSignature: string;
  bpm: number;
  beats: PatternBeat[];
}

// ── Helper ──

function q(label: string, dur = 1): PatternBeat {
  return { type: 'note', duration: dur, label };
}
function r(label: string, dur = 1): PatternBeat {
  return { type: 'rest', duration: dur, label };
}

// ── Anfaenger (beginner) — quarter notes, simple rests, dotted notes ──

const A1: RhythmPattern = {
  id: 'a1', name: 'Viertelnoten', nameKey: 'rhythm.pat.a1',
  level: 'anfaenger', timeSignature: '4/4', bpm: 80,
  beats: [q('1'), q('2'), q('3'), q('4')],
};

const A2: RhythmPattern = {
  id: 'a2', name: 'Viertel mit Pause', nameKey: 'rhythm.pat.a2',
  level: 'anfaenger', timeSignature: '4/4', bpm: 80,
  beats: [q('1'), q('2'), r('3'), q('4')],
};

const A3: RhythmPattern = {
  id: 'a3', name: 'Halbe Noten', nameKey: 'rhythm.pat.a3',
  level: 'anfaenger', timeSignature: '4/4', bpm: 80,
  beats: [q('1', 2), q('3', 2)],
};

const A4: RhythmPattern = {
  id: 'a4', name: 'Punktierte Halbe', nameKey: 'rhythm.pat.a4',
  level: 'anfaenger', timeSignature: '4/4', bpm: 76,
  beats: [q('1', 3), q('4')],
};

const A5: RhythmPattern = {
  id: 'a5', name: 'Dreier-Takt', nameKey: 'rhythm.pat.a5',
  level: 'anfaenger', timeSignature: '3/4', bpm: 88,
  beats: [q('1'), q('2'), q('3')],
};

// ── Fortgeschritten (intermediate) — eighth-note groups, syncopation ──

const F1: RhythmPattern = {
  id: 'f1', name: 'Achtelgruppen', nameKey: 'rhythm.pat.f1',
  level: 'fortgeschritten', timeSignature: '4/4', bpm: 92,
  beats: [q('1'), q('2'), q('3'), q('3+', 0.5), q('4'), q('4+', 0.5)],
};

const F2: RhythmPattern = {
  id: 'f2', name: 'Synkope Einfach', nameKey: 'rhythm.pat.f2',
  level: 'fortgeschritten', timeSignature: '4/4', bpm: 88,
  beats: [q('1'), q('2+', 0.5), r('3', 0.5), q('3+', 0.5), q('4')],
};

const F3: RhythmPattern = {
  id: 'f3', name: 'Punktierte Viertel', nameKey: 'rhythm.pat.f3',
  level: 'fortgeschritten', timeSignature: '4/4', bpm: 84,
  beats: [q('1', 1.5), q('2+', 0.5), q('3', 1.5), q('4+', 0.5)],
};

const F4: RhythmPattern = {
  id: 'f4', name: 'Achtel-Achtel-Viertel', nameKey: 'rhythm.pat.f4',
  level: 'fortgeschritten', timeSignature: '4/4', bpm: 92,
  beats: [q('1', 0.5), q('1+', 0.5), q('2'), q('3', 0.5), q('3+', 0.5), q('4')],
};

// ── Schwer (hard) — sixteenth notes, tied notes ──

const S1: RhythmPattern = {
  id: 's1', name: 'Sechzehntel-Gruppe', nameKey: 'rhythm.pat.s1',
  level: 'schwer', timeSignature: '4/4', bpm: 76,
  beats: [
    q('1', 0.25), q('1e', 0.25), q('1+', 0.25), q('1a', 0.25),
    q('2'), q('3'), q('4'),
  ],
};

const S2: RhythmPattern = {
  id: 's2', name: 'Gemischte Sechzehntel', nameKey: 'rhythm.pat.s2',
  level: 'schwer', timeSignature: '4/4', bpm: 72,
  beats: [
    q('1'), q('2', 0.25), q('2e', 0.25), q('2+', 0.25), q('2a', 0.25),
    q('3'), r('4'),
  ],
};

const S3: RhythmPattern = {
  id: 's3', name: 'Synkopen Komplex', nameKey: 'rhythm.pat.s3',
  level: 'schwer', timeSignature: '4/4', bpm: 80,
  beats: [
    q('1', 0.5), r('1+', 0.5), q('2'), q('2+', 0.5), r('3', 0.5),
    q('3+', 0.5), q('4', 0.5), q('4+', 0.5), r('4a', 0.5),
  ],
};

const S4: RhythmPattern = {
  id: 's4', name: 'Alla Breve', nameKey: 'rhythm.pat.s4',
  level: 'schwer', timeSignature: '4/4', bpm: 84,
  beats: [
    q('1', 0.5), q('1+', 0.5), q('2', 0.5), q('2+', 0.5),
    q('3', 1.5), q('4+', 0.5),
  ],
};

// ── Exports ──

export const ALL_PATTERNS: RhythmPattern[] = [
  A1, A2, A3, A4, A5,
  F1, F2, F3, F4,
  S1, S2, S3, S4,
];

export function getPatternsByLevel(level: PatternLevel): RhythmPattern[] {
  return ALL_PATTERNS.filter(p => p.level === level);
}

export function getPatternById(id: string): RhythmPattern | undefined {
  return ALL_PATTERNS.find(p => p.id === id);
}

/**
 * Compute the expected onset times (in ms) for each note beat in a pattern,
 * relative to the start of the bar.
 */
export function computeExpectedOnsets(pattern: RhythmPattern): Array<{ beatIndex: number; expectedMs: number; label: string }> {
  const beatDurationMs = 60_000 / pattern.bpm;
  const onsets: Array<{ beatIndex: number; expectedMs: number; label: string }> = [];
  let offsetBeats = 0;

  for (let i = 0; i < pattern.beats.length; i++) {
    const beat = pattern.beats[i];
    if (beat.type === 'note') {
      onsets.push({
        beatIndex: i,
        expectedMs: offsetBeats * beatDurationMs,
        label: beat.label,
      });
    }
    offsetBeats += beat.duration;
  }

  return onsets;
}

/** Total duration of a pattern in ms. */
export function patternDurationMs(pattern: RhythmPattern): number {
  const beatDurationMs = 60_000 / pattern.bpm;
  const totalBeats = pattern.beats.reduce((s, b) => s + b.duration, 0);
  return totalBeats * beatDurationMs;
}
