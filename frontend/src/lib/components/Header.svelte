<script lang="ts">
  import { page } from '$app/state';
  import { locale, t } from '$lib/i18n';
  import { selectedInstrument } from '$lib/stores/onboarding';
  import ThemeToggle from './ThemeToggle.svelte';

  function pageTitle(): string {
    const path = page.url.pathname;
    if (path === '/') return $t('nav.dashboard');
    if (path.startsWith('/tonelab')) return $t('nav.tonelab');
    if (path.startsWith('/rhythm')) return $t('nav.rhythm');
    if (path.startsWith('/progress')) return $t('nav.progress');
    if (path.startsWith('/teacher')) return $t('nav.teacher');
    return '';
  }

  function dateLabel(): string {
    return new Intl.DateTimeFormat($locale === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date());
  }
</script>

<header class="header">
  <span class="page-title">{pageTitle()}</span>
  <div class="header-right">
    <span class="date-label">{dateLabel()}</span>
    <span class="instrument-chip">{$t(`header.instrument.${$selectedInstrument}`)}</span>
    <ThemeToggle />
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    background: var(--bg-solid);
    border-bottom: 1px solid var(--border);
    transition: background 0.3s;
  }

  .page-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.3px;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .date-label {
    font-size: 11px;
    color: var(--text-3);
  }

  .instrument-chip {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-2);
    padding: 5px 11px;
    border-radius: 7px;
    background: var(--surface-2);
  }

  @media (max-width: 480px) {
    .header {
      padding: 0 14px;
    }
    .page-title {
      font-size: 13px;
    }
    .date-label {
      display: none;
    }
    .instrument-chip {
      font-size: 10px;
      padding: 4px 8px;
    }
  }
</style>
