import type { Instrument } from '$lib/stores/onboarding';

/** Map instrument to transposition key for exercise tone sequences. */
export function getSequenceKey(instrument: Instrument): string {
  switch (instrument) {
    case 'horn_bb':
    case 'trumpet_bb':
    case 'clarinet_bb':
      return 'bb';
    case 'horn_f':
      return 'f';
    case 'double_horn':
      return 'bb';
    case 'flute':
    case 'oboe':
    case 'trombone':
      return 'concert';
    default:
      return 'bb';
  }
}
