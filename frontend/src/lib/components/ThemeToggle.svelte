<script lang="ts">
  import { themeMode, cycleTheme } from '$lib/stores/theme';
  import { t } from '$lib/i18n';

  const labels: Record<string, string> = { auto: 'theme.auto', dark: 'theme.dark', light: 'theme.light' };
</script>

<button class="theme-toggle" onclick={cycleTheme} title={$t(labels[$themeMode])}>
  {#if $themeMode === 'light'}
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  {:else if $themeMode === 'dark'}
    <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  {:else}
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><path d="M12 6a6 6 0 0 0 0 12" fill="currentColor" opacity="0.15"/></svg>
  {/if}
</button>

<style>
  .theme-toggle {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .theme-toggle:hover { background: var(--surface-hover); color: var(--text); }
  .theme-toggle svg {
    width: 14px; height: 14px; stroke: currentColor; fill: none;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }
</style>
