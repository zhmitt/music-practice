<script lang="ts">
  import { t } from '$lib/i18n';
</script>

<div class="placeholder-view">
  <div class="placeholder-icon">
    <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  </div>
  <h2>{$t('nav.progress')}</h2>
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
