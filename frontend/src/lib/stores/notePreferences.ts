import { get, writable } from 'svelte/store';
import { getKV, setKV } from '$lib/db';

export type PitchDisplayMode = 'notated' | 'concert';
export type NoteVisualMode = 'note' | 'notation' | 'hybrid';

const NOTE_VISUAL_MODE_KEY = 'tt-note-visual-mode';

export const pitchDisplayMode = writable<PitchDisplayMode>('notated');
export const noteVisualMode = writable<NoteVisualMode>('hybrid');

export async function loadNotePreferences(): Promise<void> {
  const savedDisplayMode = await getKV('tt-display-mode');
  const savedVisualMode = await getKV(NOTE_VISUAL_MODE_KEY);

  pitchDisplayMode.set(savedDisplayMode === 'concert' ? 'concert' : 'notated');

  if (
    savedVisualMode === 'note' ||
    savedVisualMode === 'notation' ||
    savedVisualMode === 'hybrid'
  ) {
    noteVisualMode.set(savedVisualMode);
  } else {
    noteVisualMode.set('hybrid');
  }
}

export async function savePitchDisplayMode(mode: PitchDisplayMode): Promise<void> {
  pitchDisplayMode.set(mode);
  await setKV('tt-display-mode', mode);
}

export async function saveNoteVisualMode(mode: NoteVisualMode): Promise<void> {
  noteVisualMode.set(mode);
  await setKV(NOTE_VISUAL_MODE_KEY, mode);
}

export function getPitchDisplayModeValue(): PitchDisplayMode {
  return get(pitchDisplayMode);
}
