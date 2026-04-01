<script lang="ts">
  import { t } from '$lib/i18n';

  let { samples = [], maxSamples = 160 }: { samples: number[]; maxSamples?: number } = $props();

  const WIDTH = 500;
  const HEIGHT = 48;
  const CENTER = HEIGHT / 2;

  let pathD = $derived(buildPath(samples, maxSamples));

  function buildPath(s: number[], max: number): string {
    if (s.length < 2) return '';
    // Use the last `max` samples
    const data = s.length > max ? s.slice(-max) : s;
    const step = WIDTH / (max - 1);
    const clamp = (v: number) => Math.min(50, Math.max(-50, v));

    const points = data.map((c, i) => ({
      x: i * step,
      y: CENTER - (clamp(c) / 50) * CENTER,
    }));

    // Build smooth quadratic bezier path
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const mx = (prev.x + cur.x) / 2;
      const my = (prev.y + cur.y) / 2;
      d += ` Q${prev.x},${prev.y} ${mx},${my}`;
    }
    // Final segment
    const last = points[points.length - 1];
    d += ` L${last.x},${last.y}`;

    return d;
  }
</script>

<div class="stability-graph">
  <div class="stab-label">{$t('session.stability')}</div>
  <div class="stab-canvas">
    <div class="stab-line"></div>
    <div class="stab-path">
      <svg viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="none">
        {#if pathD}
          <path d={pathD} fill="none" stroke="var(--green-2)" stroke-width="1.5" opacity="0.6" />
        {/if}
      </svg>
    </div>
  </div>
</div>

<style>
  .stability-graph { width: 100%; max-width: 500px; margin-top: 32px; }

  .stab-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 8px;
  }

  .stab-canvas {
    width: 100%; height: 48px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px;
    position: relative; overflow: hidden;
  }

  .stab-line {
    position: absolute; top: 50%; left: 0; right: 0;
    height: 1px; background: var(--stab-line);
  }

  .stab-path { position: absolute; inset: 0; }
  .stab-path svg { width: 100%; height: 100%; }
</style>
