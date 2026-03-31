<script lang="ts">
  import { t } from '$lib/i18n';
</script>

<div class="placeholder-view">
  <div class="placeholder-icon">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
  </div>
  <h2>Tone Lab</h2>
  <p>{$t('placeholder.coming_soon')}</p>
</div>

<style>
  .placeholder-view {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 12px; color: var(--text-3);
  }
  .placeholder-icon svg {
    width: 48px; height: 48px; stroke: currentColor; fill: none;
    stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round;
  }
  h2 { font-size: 18px; font-weight: 600; color: var(--text); }
  p { font-size: 13px; }
</style>
