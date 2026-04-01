<script lang="ts">
  import type { ToneTarget } from '$lib/types/session';

  interface Props {
    tones: ToneTarget[];
    currentIndex: number;
  }

  let { tones, currentIndex }: Props = $props();

  /**
   * Map note name + octave to a vertical staff position.
   * Position 0 = middle line (B4 in treble clef).
   * Each step = one staff position (half a line gap).
   * Positive = up, negative = down.
   */
  const NOTE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SHARP_FLAT_MAP: Record<string, { base: string; }> = {
    'C#': { base: 'C' }, 'Db': { base: 'D' },
    'D#': { base: 'D' }, 'Eb': { base: 'E' },
    'F#': { base: 'F' }, 'Gb': { base: 'G' },
    'G#': { base: 'G' }, 'Ab': { base: 'A' },
    'A#': { base: 'A' }, 'Bb': { base: 'B' },
  };

  function noteToStaffPos(note: string, octave: number): number {
    // Get base note name (strip accidentals for positioning)
    let baseName = note;
    if (SHARP_FLAT_MAP[note]) {
      baseName = SHARP_FLAT_MAP[note].base;
    }

    const noteIdx = NOTE_ORDER.indexOf(baseName);
    if (noteIdx === -1) return 0;

    // B4 = position 0 (middle line of treble clef)
    // Staff positions: each line/space is 1 unit
    // C4=0, D4=1, E4=2, F4=3, G4=4, A4=5, B4=6
    const posInOctave = noteIdx; // 0..6
    const absolutePos = (octave - 4) * 7 + posInOctave;

    // B4 (absolutePos=6) should be at staff position 0 (middle line)
    // Each staff line is 2 positions apart
    // Treble clef lines from bottom: E4, G4, B4, D5, F5
    // B4 = middle line = y-center
    return absolutePos - 6; // relative to B4
  }

  function hasAccidental(note: string): string | null {
    if (note.includes('#')) return '#';
    if (note.includes('b') && note !== 'B') return 'b';
    return null;
  }

  function needsLedgerLine(pos: number): number[] {
    // Ledger lines needed below staff (below E4, pos = -4)
    // and above staff (above F5, pos = 4)
    const lines: number[] = [];
    if (pos <= -5) {
      // Below staff: C4 (-6), need ledger at -6
      for (let p = -6; p <= pos && p <= -6; p += 2) {
        lines.push(p);
      }
    }
    if (pos >= 6) {
      // Above staff: A5 (6), need ledger at 6, 8, etc.
      for (let p = 6; p <= pos; p += 2) {
        lines.push(p);
      }
    }
    return lines;
  }

  // Layout constants
  const STAFF_TOP = 40;
  const LINE_GAP = 12;
  const NOTE_SPACING = 36;
  const START_X = 50;
  const NOTE_RADIUS = 5;

  // Staff y-position for a given staff position
  function staffY(pos: number): number {
    // pos=0 is B4 = middle line (3rd line from bottom = index 2)
    // 5 lines: positions -4, -2, 0, 2, 4 (E4, G4, B4, D5, F5)
    // Middle line (B4, pos=0) is at STAFF_TOP + 2 * LINE_GAP
    return STAFF_TOP + 2 * LINE_GAP - pos * (LINE_GAP / 2);
  }

  let notePositions = $derived(tones.map((t, i) => {
    const pos = noteToStaffPos(t.note, t.octave);
    const x = START_X + i * NOTE_SPACING;
    const y = staffY(pos);
    const acc = hasAccidental(t.note);
    const ledgers = needsLedgerLine(pos);
    return { x, y, pos, acc, ledgers, tone: t, index: i };
  }));

  let svgWidth = $derived(Math.max(200, START_X + tones.length * NOTE_SPACING + 20));
</script>

<div class="staff-wrap">
  <svg viewBox="0 0 {svgWidth} 100" width="{svgWidth}" height="100" class="staff-svg">
    <!-- Staff lines (5 lines) -->
    {#each [-4, -2, 0, 2, 4] as pos}
      <line
        x1="10" y1={staffY(pos)}
        x2={svgWidth - 10} y2={staffY(pos)}
        stroke="var(--border)" stroke-width="0.8"
      />
    {/each}

    <!-- Treble clef symbol (simplified) -->
    <text x="16" y={staffY(0) + 8} font-size="32" fill="var(--text-3)" font-family="serif">&#119070;</text>

    <!-- Notes -->
    {#each notePositions as np}
      <!-- Ledger lines -->
      {#each np.ledgers as lpos}
        <line
          x1={np.x - 8} y1={staffY(lpos)}
          x2={np.x + 8} y2={staffY(lpos)}
          stroke="var(--border)" stroke-width="0.8"
        />
      {/each}

      <!-- Accidental -->
      {#if np.acc}
        <text
          x={np.x - 10} y={np.y + 4}
          font-size="12"
          fill={np.index === currentIndex ? 'var(--accent)' : np.index < currentIndex ? 'var(--green)' : 'var(--text-3)'}
          text-anchor="middle"
          font-family="serif"
        >{np.acc === 'b' ? '\u266D' : '\u266F'}</text>
      {/if}

      <!-- Note head -->
      <ellipse
        cx={np.x} cy={np.y}
        rx={NOTE_RADIUS} ry={NOTE_RADIUS * 0.8}
        fill={np.index === currentIndex ? 'var(--accent)' : np.index < currentIndex ? 'var(--green)' : 'var(--text-3)'}
        opacity={np.index < currentIndex ? 0.5 : 1}
        transform="rotate(-10, {np.x}, {np.y})"
      />

      <!-- Stem -->
      {#if np.pos >= 0}
        <!-- Stem down for notes on or above middle line -->
        <line
          x1={np.x - NOTE_RADIUS + 0.5} y1={np.y}
          x2={np.x - NOTE_RADIUS + 0.5} y2={np.y + 24}
          stroke={np.index === currentIndex ? 'var(--accent)' : np.index < currentIndex ? 'var(--green)' : 'var(--text-3)'}
          stroke-width="1.2"
          opacity={np.index < currentIndex ? 0.5 : 1}
        />
      {:else}
        <!-- Stem up for notes below middle line -->
        <line
          x1={np.x + NOTE_RADIUS - 0.5} y1={np.y}
          x2={np.x + NOTE_RADIUS - 0.5} y2={np.y - 24}
          stroke={np.index === currentIndex ? 'var(--accent)' : np.index < currentIndex ? 'var(--green)' : 'var(--text-3)'}
          stroke-width="1.2"
          opacity={np.index < currentIndex ? 0.5 : 1}
        />
      {/if}

      <!-- Active indicator glow -->
      {#if np.index === currentIndex}
        <circle
          cx={np.x} cy={np.y} r="10"
          fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.3"
        />
      {/if}
    {/each}
  </svg>
</div>

<style>
  .staff-wrap {
    width: 100%; overflow-x: auto;
    padding: 4px 0;
  }
  .staff-svg {
    display: block;
  }
</style>
