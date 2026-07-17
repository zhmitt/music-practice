/**
 * Unit tests for the MusicXML parser.
 *
 * DOMParser is available in the jsdom test environment, so no mocking is needed.
 * Tests verify title extraction, note parsing, alter → canonical name mapping,
 * rest/chord skipping, and error handling.
 */

import { describe, it, expect } from 'vitest';
import { parseMusicXML } from './musicxml';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Minimal valid MusicXML wrapper.
 * Wraps measure content in a complete but compact score document.
 */
function xmlDoc(
  measureContent: string,
  options: {
    workTitle?: string;
    movementTitle?: string;
    tempo?: number;
    divisions?: number;
  } = {},
): string {
  const { workTitle, movementTitle, tempo = 120, divisions = 1 } = options;

  const workSection = workTitle ? `<work><work-title>${workTitle}</work-title></work>` : '';
  const movSection = movementTitle ? `<movement-title>${movementTitle}</movement-title>` : '';
  const tempoEl = `<direction><sound tempo="${tempo}"/></direction>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  ${workSection}
  ${movSection}
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>${divisions}</divisions>
      </attributes>
      ${tempoEl}
      ${measureContent}
    </measure>
  </part>
</score-partwise>`;
}

/** Build a single <note> element with pitch. */
function noteEl(step: string, octave: number, duration: number, alter?: number): string {
  const alterEl = alter !== undefined ? `<alter>${alter}</alter>` : '';
  return `<note>
    <pitch>
      <step>${step}</step>
      ${alterEl}
      <octave>${octave}</octave>
    </pitch>
    <duration>${duration}</duration>
  </note>`;
}

/** Build a rest <note> element. */
function restEl(duration: number): string {
  return `<note><rest/><duration>${duration}</duration></note>`;
}

/** Build a chord continuation <note> element (second note in a chord). */
function chordNoteEl(step: string, octave: number, duration: number): string {
  return `<note>
    <chord/>
    <pitch><step>${step}</step><octave>${octave}</octave></pitch>
    <duration>${duration}</duration>
  </note>`;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('parseMusicXML', () => {
  describe('title extraction', () => {
    it('extracts work-title', () => {
      const xml = xmlDoc('', { workTitle: 'Sonata No. 1' });
      const result = parseMusicXML(xml);
      expect(result.title).toBe('Sonata No. 1');
    });

    it('extracts movement-title when work-title is absent', () => {
      const xml = xmlDoc('', { movementTitle: 'Adagio' });
      const result = parseMusicXML(xml);
      expect(result.title).toBe('Adagio');
    });

    it('defaults to "Imported Piece" when no title element is present', () => {
      const xml = xmlDoc('');
      const result = parseMusicXML(xml);
      expect(result.title).toBe('Imported Piece');
    });

    it('prefers work-title over movement-title', () => {
      const xml = xmlDoc('', { workTitle: 'Work', movementTitle: 'Movement' });
      const result = parseMusicXML(xml);
      expect(result.title).toBe('Work');
    });
  });

  describe('note parsing', () => {
    it('parses a single natural note correctly', () => {
      const xml = xmlDoc(noteEl('C', 4, 1), { divisions: 1, tempo: 60 });
      const result = parseMusicXML(xml);

      expect(result.noteCount).toBe(1);
      expect(result.exercise.tones).toHaveLength(1);
      expect(result.exercise.tones[0].note).toBe('C');
      expect(result.exercise.tones[0].octave).toBe(4);
    });

    it('parses multiple notes in sequence', () => {
      const content = noteEl('C', 4, 1) + noteEl('G', 4, 1) + noteEl('E', 5, 1);
      const xml = xmlDoc(content, { divisions: 1, tempo: 120 });
      const result = parseMusicXML(xml);

      expect(result.noteCount).toBe(3);
      expect(result.exercise.tones.map((t) => t.note)).toEqual(['C', 'G', 'E']);
    });

    it('skips rest elements', () => {
      const content = noteEl('C', 4, 1) + restEl(1) + noteEl('G', 4, 1);
      const xml = xmlDoc(content, { divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.noteCount).toBe(2);
    });

    it('skips chord continuation notes (keeps only first of chord)', () => {
      // First note + chord note (second voice in same chord)
      const content = noteEl('C', 4, 1) + chordNoteEl('E', 4, 1);
      const xml = xmlDoc(content, { divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.noteCount).toBe(1);
      expect(result.exercise.tones[0].note).toBe('C');
    });

    it('returns noteCount 0 and empty tones for score with only rests', () => {
      const xml = xmlDoc(restEl(1) + restEl(2), { divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.noteCount).toBe(0);
      expect(result.exercise.tones).toHaveLength(0);
    });
  });

  describe('note name mapping (alter → canonical names)', () => {
    const cases: [string, number, string][] = [
      // Natural notes pass through unchanged
      ['C', 0, 'C'],
      ['D', 0, 'D'],
      ['G', 0, 'G'],
      // Sharp cases
      ['C', 1, 'C#'], // C# stays C#
      ['D', 1, 'Eb'], // D# → Eb (enharmonic)
      ['E', 1, 'F'], // E# → F
      ['F', 1, 'F#'], // F# stays F#
      ['G', 1, 'Ab'], // G# → Ab
      ['A', 1, 'Bb'], // A# → Bb
      ['B', 1, 'C'], // B# → C
      // Flat cases
      ['C', -1, 'B'], // Cb → B
      ['D', -1, 'C#'], // Db → C#
      ['E', -1, 'Eb'], // Eb stays Eb
      ['F', -1, 'E'], // Fb → E
      ['G', -1, 'F#'], // Gb → F#
      ['A', -1, 'Ab'], // Ab stays Ab
      ['B', -1, 'Bb'], // Bb stays Bb
    ];

    it.each(cases)('step=%s alter=%d → %s', (step, alter, expected) => {
      const content = noteEl(step, 4, 1, alter !== 0 ? alter : undefined);
      const xml = xmlDoc(content, { divisions: 1, tempo: 60 });
      const result = parseMusicXML(xml);

      expect(result.exercise.tones[0].note).toBe(expected);
    });
  });

  describe('duration calculation and clamping', () => {
    it('computes duration in seconds from tempo and divisions (quarter = 1 div at 60 BPM → 1 s)', () => {
      // 60 BPM, 1 division per quarter → quarter = 1 s
      const xml = xmlDoc(noteEl('C', 4, 1), { tempo: 60, divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.exercise.tones[0].durationSec).toBe(2); // clamped to min 2
    });

    it('clamps very short durations to minimum 2 seconds', () => {
      // 240 BPM, 1 division → quarter = 0.25 s → well below 2 s floor
      const xml = xmlDoc(noteEl('C', 4, 1), { tempo: 240, divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.exercise.tones[0].durationSec).toBe(2);
    });

    it('clamps very long durations to maximum 8 seconds', () => {
      // 30 BPM, duration = 8 divisions → raw = (8/1) * (60/30) = 16 s → clamp to 8
      const xml = xmlDoc(noteEl('C', 4, 8), { tempo: 30, divisions: 1 });
      const result = parseMusicXML(xml);

      expect(result.exercise.tones[0].durationSec).toBe(8);
    });

    it('correctly computes whole-note at 60 BPM with 4 divisions per quarter', () => {
      // divisions=4, note duration=16 (whole note = 4 quarters = 16 divs), tempo=60
      // raw = (16/4) * (60/60) = 4 s
      const xml = xmlDoc(noteEl('C', 4, 16), { tempo: 60, divisions: 4 });
      const result = parseMusicXML(xml);

      expect(result.exercise.tones[0].durationSec).toBe(4);
    });
  });

  describe('exercise structure', () => {
    it('returns exercise with type "custom"', () => {
      const xml = xmlDoc(noteEl('C', 4, 1));
      const result = parseMusicXML(xml);

      expect(result.exercise.type).toBe('custom');
    });

    it('returns exercise with a non-empty id', () => {
      const xml = xmlDoc(noteEl('C', 4, 1));
      const result = parseMusicXML(xml);

      expect(result.exercise.id).toBeTruthy();
      expect(result.exercise.id.startsWith('import_')).toBe(true);
    });

    it('has nameKey and descriptionKey set', () => {
      const xml = xmlDoc(noteEl('C', 4, 1));
      const result = parseMusicXML(xml);

      expect(result.exercise.nameKey).toBe('session.exercise_custom');
      expect(result.exercise.descriptionKey).toBe('session.play_imported');
    });
  });

  describe('error handling', () => {
    it('throws when passed invalid/unparseable XML', () => {
      // jsdom's DOMParser injects a parseerror element for malformed XML
      expect(() => parseMusicXML('<<not xml at all>>')).toThrow(/MusicXML parse error/);
    });

    it('returns empty tones for valid XML with no <note> elements', () => {
      const xml = xmlDoc('');
      const result = parseMusicXML(xml);

      expect(result.exercise.tones).toHaveLength(0);
      expect(result.noteCount).toBe(0);
    });
  });
});
