import type { Instrument, ExperienceLevel } from '$lib/stores/onboarding';
import type { ExerciseDef, ToneTarget } from '$lib/types/session';
import { getInstrumentPracticeProfile } from '$lib/music/practiceProfiles';

function getDuration(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new':
      return 3;
    case 'beginner':
      return 4;
    case 'intermediate':
      return 4;
    case 'experienced':
      return 4;
    default:
      return 4;
  }
}

/** Build a Scale exercise tailored to instrument and experience. */
export function buildScaleExercise(
  instrument: Instrument,
  experience: ExperienceLevel,
): ExerciseDef {
  const scaleSet = getInstrumentPracticeProfile(instrument).scalesWritten;
  const dur = getDuration(experience);

  // Pick scale(s) based on experience
  const scaleCount = experience === 'experienced' ? 2 : 1;
  const selectedScales = scaleSet.slice(0, scaleCount);

  // Build tone sequence
  const allNotes: Array<[string, number]> = [];
  for (const scale of selectedScales) {
    // Ascending
    allNotes.push(...scale.notes);
    // Descending for intermediate+
    if (experience === 'intermediate' || experience === 'experienced') {
      const desc = [...scale.notes].reverse().slice(1); // skip duplicate top note
      allNotes.push(...desc);
    }
  }

  const tones: ToneTarget[] = allNotes.map(([note, octave]) => ({
    note,
    octave,
    durationSec: dur,
  }));

  const scaleName = selectedScales.map((s) => s.name).join(', ');

  return {
    id: `scale_${scaleName.toLowerCase().replace(/,\s*/g, '_')}`,
    type: 'scale',
    nameKey: 'session.exercise_scale',
    descriptionKey: 'session.play_scale',
    tones,
  };
}
