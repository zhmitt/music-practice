import type { Instrument } from '$lib/stores/onboarding';

export interface PracticeScale {
  name: string;
  notes: Array<[string, number]>;
}

export interface InstrumentPracticeProfile {
  longTonesWritten: Array<[string, number]>;
  scalesWritten: PracticeScale[];
  flexibilityWritten: Array<[string, number]>;
  targetNotesWritten: Array<[string, number]>;
  droneNotesConcert: Array<[string, number]>;
  intervalRootsConcert: Array<[string, number]>;
  earRootsConcert: Array<[string, number]>;
}

const HORN_BB_PROFILE: InstrumentPracticeProfile = {
  longTonesWritten: [
    ['Bb', 4],
    ['F', 4],
    ['D', 4],
    ['C', 4],
    ['Bb', 3],
  ],
  scalesWritten: [
    {
      name: 'Bb',
      notes: [
        ['Bb', 3],
        ['C', 4],
        ['D', 4],
        ['Eb', 4],
        ['F', 4],
      ],
    },
    {
      name: 'F',
      notes: [
        ['F', 4],
        ['G', 4],
        ['A', 4],
        ['Bb', 4],
        ['C', 5],
      ],
    },
  ],
  flexibilityWritten: [
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['F', 4],
    ['A', 4],
    ['C', 5],
  ],
  targetNotesWritten: [
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
    ['C', 5],
  ],
  droneNotesConcert: [
    ['Bb', 2],
    ['F', 3],
    ['Bb', 3],
    ['D', 4],
    ['F', 4],
  ],
  intervalRootsConcert: [
    ['F', 3],
    ['G', 3],
    ['A', 3],
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
  ],
  earRootsConcert: [
    ['F', 3],
    ['G', 3],
    ['A', 3],
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
  ],
};

const HORN_F_PROFILE: InstrumentPracticeProfile = {
  longTonesWritten: [
    ['F', 4],
    ['C', 4],
    ['A', 3],
    ['G', 3],
    ['F', 3],
  ],
  scalesWritten: [
    {
      name: 'F',
      notes: [
        ['F', 4],
        ['G', 4],
        ['A', 4],
        ['Bb', 4],
        ['C', 5],
      ],
    },
    {
      name: 'C',
      notes: [
        ['C', 4],
        ['D', 4],
        ['E', 4],
        ['F', 4],
        ['G', 4],
      ],
    },
  ],
  flexibilityWritten: [
    ['F', 3],
    ['A', 3],
    ['C', 4],
    ['F', 4],
    ['A', 4],
    ['C', 5],
  ],
  targetNotesWritten: [
    ['F', 3],
    ['G', 3],
    ['A', 3],
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['E', 4],
    ['F', 4],
    ['G', 4],
  ],
  droneNotesConcert: [
    ['F', 3],
    ['C', 4],
    ['F', 4],
    ['A', 4],
    ['C', 5],
  ],
  intervalRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
  earRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
};

const BB_GENERIC_PROFILE: InstrumentPracticeProfile = {
  longTonesWritten: [
    ['Bb', 4],
    ['F', 4],
    ['C', 4],
    ['G', 3],
    ['Eb', 3],
  ],
  scalesWritten: [
    {
      name: 'Bb',
      notes: [
        ['Bb', 4],
        ['C', 5],
        ['D', 5],
        ['Eb', 5],
        ['F', 5],
      ],
    },
    {
      name: 'F',
      notes: [
        ['F', 4],
        ['G', 4],
        ['A', 4],
        ['Bb', 4],
        ['C', 5],
      ],
    },
  ],
  flexibilityWritten: [
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
    ['C', 5],
    ['D', 5],
    ['Eb', 5],
    ['F', 5],
  ],
  targetNotesWritten: [
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
  droneNotesConcert: [
    ['Bb', 2],
    ['C', 3],
    ['D', 3],
    ['Eb', 3],
    ['F', 3],
    ['G', 3],
    ['A', 3],
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
  ],
  intervalRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
  earRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
};

const CONCERT_PROFILE: InstrumentPracticeProfile = {
  longTonesWritten: [
    ['Bb', 3],
    ['F', 3],
    ['C', 4],
    ['G', 3],
    ['D', 3],
  ],
  scalesWritten: [
    {
      name: 'Bb',
      notes: [
        ['Bb', 3],
        ['C', 4],
        ['D', 4],
        ['Eb', 4],
        ['F', 4],
      ],
    },
    {
      name: 'F',
      notes: [
        ['F', 3],
        ['G', 3],
        ['A', 3],
        ['Bb', 3],
        ['C', 4],
      ],
    },
  ],
  flexibilityWritten: [
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
    ['C', 5],
    ['D', 5],
    ['Eb', 5],
    ['F', 5],
  ],
  targetNotesWritten: [
    ['C', 4],
    ['D', 4],
    ['E', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['B', 4],
    ['C', 5],
  ],
  droneNotesConcert: [
    ['Bb', 2],
    ['C', 3],
    ['D', 3],
    ['Eb', 3],
    ['F', 3],
    ['G', 3],
    ['A', 3],
    ['Bb', 3],
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
  ],
  intervalRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
  earRootsConcert: [
    ['C', 4],
    ['D', 4],
    ['Eb', 4],
    ['F', 4],
    ['G', 4],
    ['A', 4],
    ['Bb', 4],
  ],
};

const PROFILES: Record<Instrument, InstrumentPracticeProfile> = {
  horn_bb: HORN_BB_PROFILE,
  horn_f: HORN_F_PROFILE,
  double_horn: BB_GENERIC_PROFILE,
  trumpet_bb: BB_GENERIC_PROFILE,
  clarinet_bb: BB_GENERIC_PROFILE,
  flute: CONCERT_PROFILE,
  trombone: CONCERT_PROFILE,
  oboe: CONCERT_PROFILE,
};

export function getInstrumentPracticeProfile(instrument: Instrument): InstrumentPracticeProfile {
  return PROFILES[instrument] ?? HORN_BB_PROFILE;
}
