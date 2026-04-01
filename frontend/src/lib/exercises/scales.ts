import type { Instrument, ExperienceLevel } from '$lib/stores/onboarding';
import type { ExerciseDef, ToneTarget } from '$lib/types/session';
import { getSequenceKey } from './instrumentUtils';

/**
 * Scale definitions per instrument family.
 * Each entry is a 1-octave ascending scale (written pitch).
 */
const SCALES: Record<string, Array<{ name: string; notes: Array<[string, number]> }>> = {
  bb: [
    { name: 'Bb', notes: [['Bb', 4], ['C', 5], ['D', 5], ['Eb', 5], ['F', 5]] },
    { name: 'F',  notes: [['F', 4], ['G', 4], ['A', 4], ['Bb', 4], ['C', 5]] },
  ],
  f: [
    { name: 'F',  notes: [['F', 4], ['G', 4], ['A', 4], ['Bb', 4], ['C', 5]] },
    { name: 'C',  notes: [['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G', 4]] },
  ],
  concert: [
    { name: 'Bb', notes: [['Bb', 3], ['C', 4], ['D', 4], ['Eb', 4], ['F', 4]] },
    { name: 'F',  notes: [['F', 3], ['G', 3], ['A', 3], ['Bb', 3], ['C', 4]] },
  ],
};

function getDuration(experience: ExperienceLevel): number {
  switch (experience) {
    case 'beginner_new': return 3;
    case 'beginner':     return 4;
    case 'intermediate': return 4;
    case 'experienced':  return 4;
    default:             return 4;
  }
}

/** Build a Scale exercise tailored to instrument and experience. */
export function buildScaleExercise(
  instrument: Instrument,
  experience: ExperienceLevel
): ExerciseDef {
  const key = getSequenceKey(instrument);
  const scaleSet = SCALES[key];
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

  const scaleName = selectedScales.map(s => s.name).join(', ');

  return {
    id: `scale_${scaleName.toLowerCase().replace(/,\s*/g, '_')}`,
    type: 'scale',
    nameKey: 'session.exercise_scale',
    descriptionKey: 'session.play_scale',
    tones,
  };
}
