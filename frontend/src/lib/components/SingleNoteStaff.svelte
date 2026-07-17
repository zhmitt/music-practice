<script lang="ts">
  import { hasAccidental, needsLedgerLines, noteToStaffPos, staffY } from '$lib/music/noteUtils';

  interface Props {
    note: string;
    octave: number;
    size?: 'sm' | 'md' | 'lg';
    accent?: boolean;
    muted?: boolean;
  }

  let { note, octave, size = 'md', accent = false, muted = false }: Props = $props();

  const SIZE_CONFIG = {
    sm: {
      width: 58,
      height: 42,
      staffTop: 12,
      lineGap: 5,
      noteRadius: 3.6,
      stemLength: 14,
      accidentalSize: 8,
      ledgerHalf: 6,
    },
    md: {
      width: 74,
      height: 52,
      staffTop: 14,
      lineGap: 6,
      noteRadius: 4.4,
      stemLength: 18,
      accidentalSize: 10,
      ledgerHalf: 7,
    },
    lg: {
      width: 92,
      height: 62,
      staffTop: 16,
      lineGap: 7,
      noteRadius: 5.2,
      stemLength: 22,
      accidentalSize: 12,
      ledgerHalf: 8,
    },
  } as const;

  let config = $derived(SIZE_CONFIG[size]);
  let pos = $derived(noteToStaffPos(note, octave));
  let y = $derived(staffY(pos, config.staffTop, config.lineGap));
  let accidental = $derived(hasAccidental(note));
  let ledgerLines = $derived(needsLedgerLines(pos));
  let viewMetrics = $derived.by(() => {
    const staffLineYs = [-4, -2, 0, 2, 4].map((linePos) =>
      staffY(linePos, config.staffTop, config.lineGap),
    );
    const ledgerYs = ledgerLines.map((ledgerPos) =>
      staffY(ledgerPos, config.staffTop, config.lineGap),
    );

    let minY = Math.min(...staffLineYs, ...ledgerYs, y - config.noteRadius - 2);
    let maxY = Math.max(...staffLineYs, ...ledgerYs, y + config.noteRadius + 2);

    if (accidental) {
      minY = Math.min(minY, y - config.accidentalSize);
      maxY = Math.max(maxY, y + config.accidentalSize * 0.5);
    }

    if (pos >= 0) {
      maxY = Math.max(maxY, y + config.stemLength + 1);
    } else {
      minY = Math.min(minY, y - config.stemLength - 1);
    }

    const padding = Math.max(4, config.noteRadius + 2);
    const viewMinY = Math.floor(minY - padding);
    const viewMaxY = Math.ceil(maxY + padding);

    return {
      minY: viewMinY,
      height: Math.max(config.height, viewMaxY - viewMinY),
    };
  });
  let toneColor = $derived.by(() => {
    if (accent) return 'var(--accent)';
    if (muted) return 'var(--text-3)';
    return 'var(--text)';
  });
</script>

<svg
  class="single-note-staff"
  viewBox={`0 ${viewMetrics.minY} ${config.width} ${viewMetrics.height}`}
  width={config.width}
  height={viewMetrics.height}
  aria-label={`${note}${octave}`}
>
  {#each [-4, -2, 0, 2, 4] as linePos}
    <line
      x1="8"
      y1={staffY(linePos, config.staffTop, config.lineGap)}
      x2={config.width - 8}
      y2={staffY(linePos, config.staffTop, config.lineGap)}
      stroke="var(--border)"
      stroke-width="0.8"
    />
  {/each}

  {#each ledgerLines as ledgerPos}
    <line
      x1={config.width / 2 - config.ledgerHalf}
      y1={staffY(ledgerPos, config.staffTop, config.lineGap)}
      x2={config.width / 2 + config.ledgerHalf}
      y2={staffY(ledgerPos, config.staffTop, config.lineGap)}
      stroke="var(--border)"
      stroke-width="0.9"
    />
  {/each}

  {#if accidental}
    <text
      x={config.width / 2 - config.noteRadius * 2.2}
      y={y + config.noteRadius}
      font-size={config.accidentalSize}
      fill={toneColor}
      text-anchor="middle"
      font-family="serif">{accidental === 'b' ? '\u266D' : '\u266F'}</text
    >
  {/if}

  <ellipse
    cx={config.width / 2}
    cy={y}
    rx={config.noteRadius}
    ry={config.noteRadius * 0.78}
    fill={toneColor}
    opacity={muted ? 0.7 : 1}
    transform={`rotate(-10 ${config.width / 2} ${y})`}
  />

  {#if pos >= 0}
    <line
      x1={config.width / 2 - config.noteRadius + 0.4}
      y1={y}
      x2={config.width / 2 - config.noteRadius + 0.4}
      y2={y + config.stemLength}
      stroke={toneColor}
      stroke-width="1.2"
      opacity={muted ? 0.7 : 1}
    />
  {:else}
    <line
      x1={config.width / 2 + config.noteRadius - 0.4}
      y1={y}
      x2={config.width / 2 + config.noteRadius - 0.4}
      y2={y - config.stemLength}
      stroke={toneColor}
      stroke-width="1.2"
      opacity={muted ? 0.7 : 1}
    />
  {/if}
</svg>

<style>
  .single-note-staff {
    display: block;
    overflow: visible;
  }
</style>
