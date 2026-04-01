<script lang="ts">
  import { t } from '$lib/i18n';
  import { locale, type Locale } from '$lib/i18n/index';
  import { settingsOpen } from '$lib/stores/navigation';
  import { themeMode, type ThemeMode } from '$lib/stores/theme';
  import { getUserProfile, type Instrument, type ExperienceLevel } from '$lib/stores/onboarding';
  import { getHistory } from '$lib/stores/history';

  // Load current profile
  let profile = getUserProfile();
  let instrument: Instrument = $state(profile?.instrument ?? 'horn_bb');
  let tuning = $state(442);
  let displayMode = $state<'notated' | 'concert'>('notated');
  let daysPerWeek = $state(profile?.daysPerWeek ?? 5);
  let minutesPerSession = $state(profile?.minutesPerSession ?? 15);
  let showResetConfirm = $state(false);
  let savedFlash = $state(false);

  // Load tuning from localStorage
  try {
    const savedTuning = localStorage.getItem('tt-tuning');
    if (savedTuning) tuning = parseInt(savedTuning, 10);
    const savedDisplay = localStorage.getItem('tt-display-mode');
    if (savedDisplay === 'concert' || savedDisplay === 'notated') displayMode = savedDisplay;
  } catch { /* ignore */ }

  const instruments: Array<{ key: Instrument; labelKey: string }> = [
    { key: 'horn_bb', labelKey: 'ob.instrument.horn_bb' },
    { key: 'horn_f', labelKey: 'ob.instrument.horn_f' },
    { key: 'double_horn', labelKey: 'ob.instrument.double_horn' },
    { key: 'trumpet_bb', labelKey: 'ob.instrument.trumpet_bb' },
    { key: 'clarinet_bb', labelKey: 'ob.instrument.clarinet_bb' },
    { key: 'flute', labelKey: 'ob.instrument.flute' },
    { key: 'trombone', labelKey: 'ob.instrument.trombone' },
    { key: 'oboe', labelKey: 'ob.instrument.oboe' },
  ];

  const dayOptions = [3, 4, 5, 6, 7];
  const minuteOptions = [10, 15, 20, 30, 45];

  function save() {
    // Persist profile
    const updated = {
      instrument,
      experience: profile?.experience ?? ('beginner' as ExperienceLevel),
      daysPerWeek,
      minutesPerSession,
    };
    try {
      localStorage.setItem('tt-user-profile', JSON.stringify(updated));
      localStorage.setItem('tt-tuning', String(tuning));
      localStorage.setItem('tt-display-mode', displayMode);
    } catch { /* ignore */ }

    // Update tuning in audio engine (if running via Tauri)
    updateTuning();

    savedFlash = true;
    setTimeout(() => { savedFlash = false; }, 1500);
  }

  async function updateTuning() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_reference_tuning', { frequency: tuning });
      await invoke('set_display_mode', { mode: displayMode === 'concert' ? 'Concert' : 'Notated' });
    } catch { /* ignore in browser */ }
  }

  function setLocale(l: Locale) {
    locale.set(l);
    try { localStorage.setItem('tt-locale', l); } catch { /* ignore */ }
  }

  function setTheme(m: ThemeMode) {
    themeMode.set(m);
  }

  function exportData() {
    const data = {
      profile: getUserProfile(),
      history: getHistory(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tonetrainer-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetData() {
    try {
      localStorage.removeItem('tt-session-history');
      localStorage.removeItem('tt-user-profile');
      localStorage.removeItem('tt-onboarding-completed');
      localStorage.removeItem('tt-tuning');
      localStorage.removeItem('tt-display-mode');
    } catch { /* ignore */ }
    showResetConfirm = false;
    location.reload();
  }

  function close() {
    save();
    settingsOpen.set(false);
  }
</script>

{#if $settingsOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="settings-backdrop" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}></div>

  <!-- Panel -->
  <div class="settings-panel">
    <div class="settings-header">
      <h2>{$t('nav.settings')}</h2>
      <button class="close-btn" onclick={close}>
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="settings-scroll">
      <!-- Instrument -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.instrument')}</div>
        <select class="setting-select" bind:value={instrument} onchange={save}>
          {#each instruments as inst}
            <option value={inst.key}>{$t(inst.labelKey)}</option>
          {/each}
        </select>
      </section>

      <!-- Tuning -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.tuning')}</div>
        <div class="tuning-row">
          <span class="tuning-value">A = {tuning} Hz</span>
          <input type="range" min="430" max="450" step="1" bind:value={tuning} onchange={save} class="tuning-slider" />
        </div>
      </section>

      <!-- Display Mode -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.display_mode')}</div>
        <div class="pill-row">
          <button class="pill" class:active={displayMode === 'notated'} onclick={() => { displayMode = 'notated'; save(); }}>
            {$t('settings.display_notated')}
          </button>
          <button class="pill" class:active={displayMode === 'concert'} onclick={() => { displayMode = 'concert'; save(); }}>
            {$t('settings.display_concert')}
          </button>
        </div>
      </section>

      <!-- Practice Goals -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.goals')}</div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.days_per_week')}</span>
          <div class="pill-row">
            {#each dayOptions as d}
              <button class="pill small" class:active={daysPerWeek === d} onclick={() => { daysPerWeek = d; save(); }}>{d}</button>
            {/each}
          </div>
        </div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.minutes_per_session')}</span>
          <div class="pill-row">
            {#each minuteOptions as m}
              <button class="pill small" class:active={minutesPerSession === m} onclick={() => { minutesPerSession = m; save(); }}>{m}</button>
            {/each}
          </div>
        </div>
      </section>

      <!-- Appearance -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.appearance')}</div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.language')}</span>
          <div class="pill-row">
            <button class="pill" class:active={$locale === 'de'} onclick={() => setLocale('de')}>Deutsch</button>
            <button class="pill" class:active={$locale === 'en'} onclick={() => setLocale('en')}>English</button>
          </div>
        </div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.theme')}</span>
          <div class="pill-row">
            <button class="pill" class:active={$themeMode === 'auto'} onclick={() => setTheme('auto')}>{$t('theme.auto')}</button>
            <button class="pill" class:active={$themeMode === 'dark'} onclick={() => setTheme('dark')}>{$t('theme.dark')}</button>
            <button class="pill" class:active={$themeMode === 'light'} onclick={() => setTheme('light')}>{$t('theme.light')}</button>
          </div>
        </div>
      </section>

      <!-- Data -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.data')}</div>
        <button class="action-btn" onclick={exportData}>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          {$t('settings.export')}
        </button>
        <p class="action-desc">{$t('settings.export_desc')}</p>

        {#if !showResetConfirm}
          <button class="action-btn danger" onclick={() => showResetConfirm = true}>
            {$t('settings.reset')}
          </button>
          <p class="action-desc">{$t('settings.reset_desc')}</p>
        {:else}
          <div class="confirm-row">
            <span class="confirm-text">{$t('settings.reset_confirm')}</span>
            <button class="action-btn danger" onclick={resetData}>{$t('settings.reset')}</button>
            <button class="action-btn" onclick={() => showResetConfirm = false}>{$t('ob.back')}</button>
          </div>
        {/if}
      </section>
    </div>

    <!-- Saved flash -->
    {#if savedFlash}
      <div class="saved-toast">{$t('settings.saved')}</div>
    {/if}
  </div>
{/if}

<style>
  .settings-backdrop {
    position: fixed; inset: 0; z-index: 900;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
  }

  .settings-panel {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 901;
    width: 380px; max-width: 100vw;
    background: var(--bg-solid); border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .settings-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid var(--border);
  }
  .settings-header h2 { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }

  .close-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: transparent; color: var(--text-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .close-btn:hover { background: var(--surface-hover); color: var(--text); }

  .settings-scroll {
    flex: 1; overflow-y: auto; padding: 16px 24px 40px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* ── Sections ── */
  .setting-section {
    display: flex; flex-direction: column; gap: 10px;
    padding-bottom: 20px; border-bottom: 1px solid var(--border);
  }
  .setting-section:last-child { border-bottom: none; }

  .section-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Select ── */
  .setting-select {
    width: 100%; padding: 8px 12px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text); font-family: inherit; font-size: 13px;
    cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .setting-select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }

  /* ── Tuning ── */
  .tuning-row { display: flex; align-items: center; gap: 12px; }
  .tuning-value { font-size: 14px; font-weight: 600; min-width: 90px; font-variant-numeric: tabular-nums; }
  .tuning-slider {
    flex: 1; height: 4px; appearance: none; border-radius: 2px;
    background: var(--surface-2); outline: none;
  }
  .tuning-slider::-webkit-slider-thumb {
    appearance: none; width: 16px; height: 16px; border-radius: 50%;
    background: var(--accent); cursor: pointer;
  }

  /* ── Pill buttons ── */
  .pill-row { display: flex; flex-wrap: wrap; gap: 6px; }

  .pill {
    padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 12px; cursor: pointer; transition: all 0.15s;
  }
  .pill:hover { background: var(--surface-hover); color: var(--text); }
  .pill.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); font-weight: 600; }
  .pill.small { padding: 5px 12px; min-width: 36px; text-align: center; }

  /* ── Goals ── */
  .goal-group { display: flex; flex-direction: column; gap: 6px; }
  .goal-label { font-size: 12px; color: var(--text-2); }

  /* ── Action buttons ── */
  .action-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 9px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-2); font-family: inherit;
    font-size: 12px; cursor: pointer; transition: all 0.15s;
    width: fit-content;
  }
  .action-btn:hover { background: var(--surface-hover); color: var(--text); }
  .action-btn.danger { color: var(--red); border-color: var(--red-soft); }
  .action-btn.danger:hover { background: var(--red-soft); }

  .action-desc { font-size: 11px; color: var(--text-3); margin: 0; }

  .confirm-row {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    padding: 10px; border-radius: 10px; background: var(--red-soft);
  }
  .confirm-text { font-size: 12px; color: var(--red); flex: 1; min-width: 180px; }

  /* ── Saved toast ── */
  .saved-toast {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    padding: 6px 16px; border-radius: 8px;
    background: var(--green); color: white;
    font-size: 11px; font-weight: 600;
    animation: fadeInOut 1.5s ease-out forwards;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
