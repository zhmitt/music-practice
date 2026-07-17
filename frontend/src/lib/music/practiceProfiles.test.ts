import { describe, expect, it } from 'vitest';
import { getInstrumentPracticeProfile } from './practiceProfiles';

describe('practiceProfiles', () => {
  it('keeps Bb horn long tones in a safer middle written register', () => {
    const profile = getInstrumentPracticeProfile('horn_bb');
    expect(profile.longTonesWritten).toEqual([
      ['Bb', 4],
      ['F', 4],
      ['D', 4],
      ['C', 4],
      ['Bb', 3],
    ]);
  });

  it('avoids very low written target notes for Bb horn', () => {
    const profile = getInstrumentPracticeProfile('horn_bb');
    expect(profile.targetNotesWritten[0]).toEqual(['Bb', 3]);
    expect(profile.targetNotesWritten[profile.targetNotesWritten.length - 1]).toEqual(['C', 5]);
  });

  it('keeps Bb horn drone defaults centered around stable concert anchors', () => {
    const profile = getInstrumentPracticeProfile('horn_bb');
    expect(profile.droneNotesConcert).toEqual([
      ['Bb', 2],
      ['F', 3],
      ['Bb', 3],
      ['D', 4],
      ['F', 4],
    ]);
  });
});
