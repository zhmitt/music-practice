import type { ExperienceLevel } from '$lib/stores/onboarding';
import type { Instrument } from '$lib/stores/onboarding';
import type { ExerciseDef, ToneTarget } from '$lib/types/session';
import { getInstrumentPracticeProfile } from '$lib/music/practiceProfiles';

function getDuration(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new':
      return 5;
    case 'beginner':
      return 6;
    case 'intermediate':
      return 8;
    case 'experienced':
      return 8;
    default:
      return 6;
  }
}

function getToneCount(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new':
      return 3;
    case 'beginner':
      return 4;
    case 'intermediate':
      return 5;
    case 'experienced':
      return 5;
    default:
      return 4;
  }
}

/** Build a Long Tones exercise tailored to instrument and experience. */
export function buildLongTonesExercise(
  instrument: Instrument,
  experience: ExperienceLevel,
): ExerciseDef {
  const seq = getInstrumentPracticeProfile(instrument).longTonesWritten;
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
