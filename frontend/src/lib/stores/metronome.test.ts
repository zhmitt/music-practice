import { describe, expect, it } from 'vitest';
import { getBeatClickBehavior } from './metronome';

describe('getBeatClickBehavior', () => {
  it('keeps standard mode audible on off-beats', () => {
    expect(getBeatClickBehavior('standard', 2)).toEqual({
      shouldPlay: true,
      isAccent: false,
    });
  });

  it('mutes off-beats in beat-1-only mode', () => {
    expect(getBeatClickBehavior('beat1_only', 2)).toEqual({
      shouldPlay: false,
      isAccent: false,
    });
  });

  it('keeps beat 1 in beat-1-only mode accented', () => {
    expect(getBeatClickBehavior('beat1_only', 0)).toEqual({
      shouldPlay: true,
      isAccent: true,
    });
  });

  it('removes the accent but not the click in none mode', () => {
    expect(getBeatClickBehavior('none', 0)).toEqual({
      shouldPlay: true,
      isAccent: false,
    });
  });
});
