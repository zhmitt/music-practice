import { describe, expect, it } from 'vitest';
import { convertToneForDisplay, getInstrumentTransposition, transposeTone } from './noteUtils';

describe('noteUtils', () => {
  it('transposes written Bb horn notes down to concert pitch', () => {
    expect(
      convertToneForDisplay({ note: 'Bb', octave: 4 }, 'horn_bb', 'written', 'concert'),
    ).toEqual({ note: 'Ab', octave: 4 });
  });

  it('transposes concert horn in F notes up to written pitch', () => {
    expect(convertToneForDisplay({ note: 'C', octave: 4 }, 'horn_f', 'concert', 'written')).toEqual(
      { note: 'G', octave: 4 },
    );
  });

  it('keeps concert instruments unchanged across modes', () => {
    expect(
      convertToneForDisplay({ note: 'D', octave: 4 }, 'trombone', 'concert', 'written'),
    ).toEqual({ note: 'D', octave: 4 });
  });

  it('returns known transpositions', () => {
    expect(getInstrumentTransposition('clarinet_bb')).toBe(2);
    expect(getInstrumentTransposition('horn_f')).toBe(7);
    expect(getInstrumentTransposition('flute')).toBe(0);
  });

  it('handles direct semitone transposition', () => {
    expect(transposeTone('Bb', 4, 2)).toEqual({ note: 'C', octave: 5 });
  });
});
