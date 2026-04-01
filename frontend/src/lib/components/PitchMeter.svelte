<script lang="ts">
  let { cents = 0, active = false }: { cents: number; active: boolean } = $props();

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  // Map cents (-50..+50) to top position (100%..0%)
  let dotTop = $derived(50 - clamp(cents, -50, 50));

  let dotColor = $derived(
    !active ? 'var(--text-3)' :
    Math.abs(cents) <= 5 ? 'var(--green-2)' :
    Math.abs(cents) <= 15 ? 'var(--amber)' :
    'var(--red)'
  );

  let dotShadow = $derived(
    !active ? 'none' :
    Math.abs(cents) <= 5 ? 'var(--dot-shadow)' :
    Math.abs(cents) <= 15 ? '0 0 14px rgba(251,191,36,0.5), 0 0 4px rgba(251,191,36,0.8)' :
    '0 0 14px rgba(248,113,113,0.5), 0 0 4px rgba(248,113,113,0.8)'
  );
</script>

<div class="pitch-meter">
  <div class="pitch-label-top">+50</div>
  <div class="pitch-track"></div>
  <div class="pitch-center"></div>
  <div
    class="pitch-dot"
    style="top: {dotTop}%; background: {dotColor}; box-shadow: {dotShadow};"
  ></div>
  <div class="pitch-label-bottom">-50</div>
</div>

<style>
  .pitch-meter { width: 32px; height: 260px; position: relative; }

  .pitch-track {
    position: absolute; left: 50%; transform: translateX(-50%);
    width: 5px; height: 100%; border-radius: 3px;
    background: var(--track-gradient);
  }

  .pitch-center {
    position: absolute; left: -4px; right: -4px;
    top: 50%; height: 1px; background: var(--stab-line);
  }

  .pitch-dot {
    position: absolute; left: 50%; transform: translate(-50%, -50%);
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--green-2);
    box-shadow: var(--dot-shadow);
    transition: top 0.12s ease-out, background 0.2s, box-shadow 0.2s;
  }

  .pitch-label-top, .pitch-label-bottom {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 9px; color: var(--text-3);
  }
  .pitch-label-top { top: -16px; }
  .pitch-label-bottom { bottom: -16px; }
</style>
