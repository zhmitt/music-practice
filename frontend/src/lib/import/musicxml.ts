/**
 * Pure TypeScript MusicXML parser (no external dependencies).
 * Parses .xml / .musicxml files and produces an ExerciseDef for practice.
 */

import type { ExerciseDef, ToneTarget } from '$lib/types/session';

export interface MusicXMLParseResult {
  title: string;
  exercise: ExerciseDef;
  noteCount: number;
}

/**
 * Maps a MusicXML step + alter combination to our internal note name system.
 * Our system uses: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
 */
function mapNoteStep(step: string, alter: number): string {
  // Sharps: C#, F# are canonical. D#→Eb, G#→Ab, A#→Bb
  if (alter === 1) {
    const sharpMap: Record<string, string> = {
      C: 'C#',
      D: 'Eb', // D# enharmonic = Eb
      E: 'F', // E# enharmonic = F
      F: 'F#',
      G: 'Ab', // G# enharmonic = Ab
      A: 'Bb', // A# enharmonic = Bb
      B: 'C', // B# enharmonic = C
    };
    return sharpMap[step] ?? step;
  }

  // Flats: Eb, Ab, Bb are canonical. Db→C#, Gb→F#
  if (alter === -1) {
    const flatMap: Record<string, string> = {
      C: 'B', // Cb enharmonic = B
      D: 'C#', // Db enharmonic = C#
      E: 'Eb',
      F: 'E', // Fb enharmonic = E
      G: 'F#', // Gb enharmonic = F#
      A: 'Ab',
      B: 'Bb',
    };
    return flatMap[step] ?? step;
  }

  return step;
}

/**
 * Clamps a raw musical duration (in seconds) to a practice-appropriate range.
 * Minimum 2 s, maximum 8 s, rounded to whole seconds.
 */
function clampDuration(rawSec: number): number {
  return Math.min(8, Math.max(2, Math.round(rawSec)));
}

/**
 * Parses a MusicXML string and returns a practice ExerciseDef.
 *
 * @param xmlString - Raw MusicXML file contents (text/xml).
 * @returns Parsed result with title, note count, and exercise definition.
 * @throws Error if the XML cannot be parsed by DOMParser.
 *
 * @example
 * const text = await file.text();
 * const result = parseMusicXML(text);
 * if (result.exercise.tones.length > 0) { ... }
 */
export function parseMusicXML(xmlString: string): MusicXMLParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors (browsers inject a parseerror element on failure)
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`MusicXML parse error: ${parseError.textContent?.slice(0, 200)}`);
  }

  // --- Title ---
  const title =
    doc.querySelector('work-title')?.textContent?.trim() ||
    doc.querySelector('movement-title')?.textContent?.trim() ||
    'Imported Piece';

  // --- Tempo (BPM) ---
  // Prefer explicit <sound tempo="N"/> attribute, then <per-minute> text content.
  const soundTempoAttr = doc.querySelector('sound[tempo]')?.getAttribute('tempo');
  const perMinuteText = doc.querySelector('per-minute')?.textContent?.trim();
  const bpm = parseFloat(soundTempoAttr ?? perMinuteText ?? '120') || 120;

  // --- Divisions per quarter note ---
  // MusicXML stores divisions per part; take the first occurrence.
  const divisionsText = doc.querySelector('divisions')?.textContent?.trim();
  const divisions = parseInt(divisionsText ?? '1', 10) || 1;

  // Quarter note duration in seconds
  const quarterSec = 60 / bpm;

  // --- Parse notes ---
  const noteElements = doc.querySelectorAll('note');
  const tones: ToneTarget[] = [];

  for (const noteEl of noteElements) {
    // Skip rests
    if (noteEl.querySelector('rest')) continue;

    // Skip chord continuation notes (keep only the first note of each chord)
    if (noteEl.querySelector('chord')) continue;

    const pitch = noteEl.querySelector('pitch');
    if (!pitch) continue;

    const step = pitch.querySelector('step')?.textContent?.trim() || 'C';
    const alterText = pitch.querySelector('alter')?.textContent?.trim();
    const alter = alterText ? Math.round(parseFloat(alterText)) : 0;
    const octave = parseInt(pitch.querySelector('octave')?.textContent?.trim() ?? '4', 10);
    const durationVal = parseInt(
      noteEl.querySelector('duration')?.textContent?.trim() ?? String(divisions),
      10,
    );

    const noteName = mapNoteStep(step, alter);
    const rawSec = (durationVal / divisions) * quarterSec;
    const durationSec = clampDuration(rawSec);

    tones.push({ note: noteName, octave, durationSec });
  }

  return {
    title,
    noteCount: tones.length,
    exercise: {
      id: `import_${Date.now()}`,
      type: 'custom',
      nameKey: 'session.exercise_custom',
      descriptionKey: 'session.play_imported',
      tones,
    },
  };
}
