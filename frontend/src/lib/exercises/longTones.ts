import type { Instrument, ExperienceLevel } from '$lib/stores/onboarding';
import type { ExerciseDef, ToneTarget } from '$lib/types/session';

/** Tone sequences per instrument family (descending partials, comfortable register). */
const SEQUENCES: Record<string, Array<[string, number]>> = {
  // Bb transposing: written pitch (sounds a whole step lower)
  bb: [['Bb', 4], ['F', 4], ['C', 4], ['G', 3], ['Eb', 3]],
  // F transposing: written pitch (sounds a fifth lower)
  f:  [['F', 4], ['C', 4], ['G', 3], ['D', 3], ['Bb', 2]],
  // Concert pitch instruments
  concert: [['Bb', 3], ['F', 3], ['C', 4], ['G', 3], ['D', 3]],
};

function getSequenceKey(instrument: Instrument): string {
  switch (instrument) {
    case 'horn_bb':
    case 'trumpet_bb':
    case 'clarinet_bb':
      return 'bb';
    case 'horn_f':
      return 'f';
    case 'double_horn':
      return 'bb'; // default to Bb side
    case 'flute':
    case 'oboe':
    case 'trombone':
      return 'concert';
    default:
      return 'bb';
  }
}

function getDuration(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new': return 5;
    case 'beginner':     return 6;
    case 'intermediate': return 8;
    case 'experienced':  return 8;
    default:             return 6;
  }
}

function getToneCount(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new': return 3;
    case 'beginner':     return 4;
    case 'intermediate': return 5;
    case 'experienced':  return 5;
    default:             return 4;
  }
}

/** Build a Long Tones exercise tailored to instrument and experience. */
export function buildLongTonesExercise(
  instrument: Instrument,
  experience: ExperienceLevel
): ExerciseDef {
  const key = getSequenceKey(instrument);
  const seq = SEQUENCES[key];
  const dur = getDuration(experience);
  const count = getToneCount(experience);

  const tones: ToneTarget[] = seq.slice(0, count).map(([note, octave]) => ({
    note,
    octave,
    durationSec: dur,
  }));

  return {
    id: 'long_tones',
    type: 'long_tones',
    nameKey: 'session.exercise_long_tones',
    descriptionKey: 'session.hold_tone',
    tones,
  };
}
