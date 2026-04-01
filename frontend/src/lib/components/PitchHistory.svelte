<script lang="ts">
  import { t } from '$lib/i18n';
  import type { PitchSample } from '$lib/types/tonelab';

  let { samples = [], maxDurationMs = 60000 }: { samples: PitchSample[]; maxDurationMs?: number } = $props();

  const WIDTH = 800;
  const HEIGHT = 80;
  const CENTER = HEIGHT / 2;

  let pathD = $derived(buildPath(samples, maxDurationMs));

  function buildPath(s: PitchSample[], maxMs: number): string {
    if (s.length < 2) return '';

    const now = Date.now();
    const clamp = (v: number) => Math.min(50, Math.max(-50, v));

    const points = s.map(sample => ({
      x: ((sample.timestampMs - (now - maxMs)) / maxMs) * WIDTH,
      y: CENTER - (clamp(sample.cents) / 50) * CENTER,
    })).filter(p => p.x >= 0);

    if (points.length < 2) return '';

    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const mx = ((prev.x + cur.x) / 2).toFixed(1);
      const my = ((prev.y + cur.y) / 2).toFixed(1);
      d += ` Q${prev.x.toFixed(1)},${prev.y.toFixed(1)} ${mx},${my}`;
    }
    const last = points[points.length - 1];
    d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;

    return d;
  }
</script>

<div class="pitch-history">
  <div class="history-label">{$t('tonelab.history')}</div>
  <div class="history-canvas">
    <div class="history-center-line"></div>
    <div class="history-path">
      <svg viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="none">
        {#if pathD}
          <path d={pathD} fill="none" stroke="var(--green-2)" stroke-width="1.5" opacity="0.6" />
        {/if}
      </svg>
    </div>
    <div class="history-time-labels">
      <span>60s</span>
      <span>30s</span>
      <span>now</span>
    </div>
  </div>
</div>

<style>
  .pitch-history { width: 100%; }

  .history-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 8px;
  }

  .history-canvas {
    width: 100%; height: 80px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px;
    position: relative; overflow: hidden;
  }

  .history-center-line {
    position: absolute; top: 50%; left: 0; right: 0;
    height: 1px; background: var(--stab-line);
  }

  .history-path { position: absolute; inset: 0; }
  .history-path svg { width: 100%; height: 100%; }

  .history-time-labels {
    position: absolute; bottom: 4px; left: 8px; right: 8px;
    display: flex; justify-content: space-between;
    font-size: 8px; color: var(--text-3); opacity: 0.5;
  }
</style>
