<script lang="ts">
  import { t } from '$lib/i18n';
</script>

<div class="placeholder-view">
  <div class="placeholder-icon">
    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>
  </div>
  <h2>{$t('nav.rhythm')}</h2>
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
