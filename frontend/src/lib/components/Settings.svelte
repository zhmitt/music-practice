<script lang="ts">
  import { get } from 'svelte/store';
  import { onDestroy, onMount } from 'svelte';
  import { teacherFeaturesEnabled } from '$lib/config/appVariant';
  import { t } from '$lib/i18n';
  import { locale, setLocale } from '$lib/i18n/index';
  import {
    ensureMicrophonePermission,
    loadAudioPreferences,
    microphoneDevices,
    refreshMicrophoneDevices,
    selectedMicrophoneDevice,
    setSelectedMicrophoneDevice,
    syncAudioAnalysisContext,
  } from '$lib/stores/audioPreferences';
  import { settingsOpen } from '$lib/stores/navigation';
  import {
    loadNotePreferences,
    noteVisualMode,
    pitchDisplayMode,
    saveNoteVisualMode,
    savePitchDisplayMode,
    type NoteVisualMode,
    type PitchDisplayMode,
  } from '$lib/stores/notePreferences';
  import { themeMode, type ThemeMode } from '$lib/stores/theme';
  import {
    getUserProfile,
    saveProfile,
    type Instrument,
    type ExperienceLevel,
  } from '$lib/stores/onboarding';
  import { getKV, setKV, clearAllData } from '$lib/db';
  import type { TauriAudioDebugSnapshot } from '$lib/types/tauri';
  import { invokeTauri, isTauriRuntime } from '$lib/tauri/runtime';
  import SharePanel from './SharePanel.svelte';
  import AssignmentCreator from './AssignmentCreator.svelte';
  import PracticeNote from './PracticeNote.svelte';

  // Load current profile
  let profile = getUserProfile();
  let instrument: Instrument = $state(profile?.instrument ?? 'horn_bb');
  let tuning = $state(442);
  let displayMode = $state<PitchDisplayMode>('notated');
  let noteMode = $state<NoteVisualMode>('hybrid');
  let daysPerWeek = $state(profile?.daysPerWeek ?? 5);
  let minutesPerSession = $state(profile?.minutesPerSession ?? 15);
  let showResetConfirm = $state(false);
  let savedFlash = $state(false);
  let microphoneStatus = $state<'idle' | 'granted' | 'denied'>('idle');
  let showAudioDebug = $state(false);
  let audioDebug = $state<TauriAudioDebugSnapshot | null>(null);
  let audioDebugLogs = $state<string[]>([]);
  let lastDebugSignature = '';
  let debugInterval: ReturnType<typeof setInterval> | null = null;

  // Load tuning and display-mode from the kv store on mount
  onMount(async () => {
    try {
      const savedTuning = await getKV('tt-tuning');
      if (savedTuning) tuning = parseInt(savedTuning, 10);
      await loadNotePreferences();
      displayMode = get(pitchDisplayMode);
      noteMode = get(noteVisualMode);
      await loadAudioPreferences();
    } catch {
      /* ignore */
    }
  });

  onDestroy(() => {
    stopDebugPolling();
  });

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

  async function save() {
    // Persist profile
    const updated = {
      instrument,
      experience: profile?.experience ?? ('beginner' as ExperienceLevel),
      daysPerWeek,
      minutesPerSession,
    };
    profile = updated;
    try {
      await saveProfile(updated);
      await setKV('tt-tuning', String(tuning));
      await savePitchDisplayMode(displayMode);
      await saveNoteVisualMode(noteMode);
    } catch {
      /* ignore */
    }

    // Update audio configuration in the running engine (if inside Tauri)
    await updateAudioPreferences();

    savedFlash = true;
    setTimeout(() => {
      savedFlash = false;
    }, 1500);
  }

  async function updateAudioPreferences() {
    await syncAudioAnalysisContext({
      instrument,
      tuning,
      displayMode,
    });
  }

  function setTheme(m: ThemeMode) {
    themeMode.set(m);
  }

  async function requestMicrophoneAccess() {
    const granted = await ensureMicrophonePermission();
    microphoneStatus = granted ? 'granted' : 'denied';
    if (granted) {
      await refreshMicrophoneDevices();
    }
  }

  async function handleMicrophoneChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    await setSelectedMicrophoneDevice(value === '__default__' ? null : value);
    // Active audio leases are restarted centrally by setSelectedMicrophoneDevice.
    void pollAudioDebug();
  }

  function microphoneLabel(deviceName: string, isDefault: boolean): string {
    return isDefault ? `${deviceName} (${$t('settings.microphone_system')})` : deviceName;
  }

  async function resetData() {
    try {
      await clearAllData();
    } catch {
      /* ignore */
    }
    showResetConfirm = false;
    location.reload();
  }

  async function close() {
    stopDebugPolling();
    await save();
    settingsOpen.set(false);
  }

  function recordDebugEvent(message: string) {
    const stamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    audioDebugLogs = [`${stamp} ${message}`, ...audioDebugLogs].slice(0, 24);
  }

  function stopDebugPolling() {
    if (debugInterval) {
      clearInterval(debugInterval);
      debugInterval = null;
    }
  }

  async function pollAudioDebug() {
    if (!isTauriRuntime()) {
      audioDebug = null;
      return;
    }

    let snapshot: TauriAudioDebugSnapshot | null;
    try {
      snapshot = await invokeTauri('get_audio_debug');
    } catch {
      return;
    }
    if (!snapshot) return;

    const signature = [
      snapshot.detector_status,
      snapshot.active_device_name ?? 'none',
      snapshot.latest_pitch
        ? `${snapshot.latest_pitch.note_name}${snapshot.latest_pitch.octave}`
        : '--',
      snapshot.tentative_pitch
        ? `${snapshot.tentative_pitch.note_name}${snapshot.tentative_pitch.octave}`
        : '--',
    ].join('|');

    if (signature !== lastDebugSignature) {
      const detail = snapshot.latest_pitch
        ? `${snapshot.detector_status}: ${snapshot.latest_pitch.note_name}${snapshot.latest_pitch.octave}`
        : snapshot.tentative_pitch
          ? `${snapshot.detector_status}: ~${snapshot.tentative_pitch.note_name}${snapshot.tentative_pitch.octave}`
          : snapshot.detector_status;
      recordDebugEvent(detail);
      lastDebugSignature = signature;
    }

    audioDebug = snapshot;
  }

  function toggleAudioDebug() {
    showAudioDebug = !showAudioDebug;

    if (!showAudioDebug) {
      stopDebugPolling();
      return;
    }

    void pollAudioDebug();
    stopDebugPolling();
    debugInterval = setInterval(() => {
      void pollAudioDebug();
    }, 300);
  }
</script>

{#if $settingsOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="settings-backdrop"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
  ></div>

  <!-- Panel -->
  <div class="settings-panel">
    <div class="settings-header">
      <h2>{$t('nav.settings')}</h2>
      <button
        class="close-btn"
        aria-label={$t('common.close')}
        title={$t('common.close')}
        onclick={close}
      >
        <svg viewBox="0 0 24 24" width="18" height="18"
          ><path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          /></svg
        >
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
          <input
            type="range"
            min="430"
            max="450"
            step="1"
            bind:value={tuning}
            onchange={save}
            class="tuning-slider"
          />
        </div>
      </section>

      <!-- Display Mode -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.display_mode')}</div>
        <div class="pill-row">
          <button
            class="pill"
            class:active={displayMode === 'notated'}
            onclick={() => {
              displayMode = 'notated';
              save();
            }}
          >
            {$t('settings.display_notated')}
          </button>
          <button
            class="pill"
            class:active={displayMode === 'concert'}
            onclick={() => {
              displayMode = 'concert';
              save();
            }}
          >
            {$t('settings.display_concert')}
          </button>
        </div>
      </section>

      <section class="setting-section">
        <div class="section-label">{$t('settings.note_visual_mode')}</div>
        <div class="pill-row">
          <button
            class="pill"
            class:active={noteMode === 'note'}
            onclick={() => {
              noteMode = 'note';
              save();
            }}
          >
            {$t('settings.note_visual_note')}
          </button>
          <button
            class="pill"
            class:active={noteMode === 'notation'}
            onclick={() => {
              noteMode = 'notation';
              save();
            }}
          >
            {$t('settings.note_visual_staff')}
          </button>
          <button
            class="pill"
            class:active={noteMode === 'hybrid'}
            onclick={() => {
              noteMode = 'hybrid';
              save();
            }}
          >
            {$t('settings.note_visual_hybrid')}
          </button>
        </div>
        <div class="note-preview">
          <PracticeNote note="Bb" octave={4} size="md" sourceMode="written" accent />
        </div>
      </section>

      <!-- Audio -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.audio')}</div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.microphone')}</span>
          <select
            class="setting-select"
            value={$selectedMicrophoneDevice ?? '__default__'}
            onchange={handleMicrophoneChange}
          >
            <option value="__default__">{$t('settings.microphone_default')}</option>
            {#each $microphoneDevices as device}
              <option value={device.device_name}
                >{microphoneLabel(device.device_name, device.is_default)}</option
              >
            {/each}
          </select>
          <div class="pill-row">
            <button class="pill" onclick={() => void requestMicrophoneAccess()}>
              {$t('ob.mic.allow')}
            </button>
            <button class="pill" onclick={() => void refreshMicrophoneDevices()}>
              {$t('settings.microphone_refresh')}
            </button>
          </div>
          {#if $microphoneDevices.length === 0}
            <p class="action-desc">{$t('settings.microphone_none_found')}</p>
          {/if}
          {#if microphoneStatus === 'granted'}
            <p class="action-desc">{$t('settings.microphone_permission_granted')}</p>
          {:else if microphoneStatus === 'denied'}
            <p class="action-desc">{$t('settings.microphone_permission_denied')}</p>
          {/if}
          <p class="action-desc">{$t('settings.microphone_usage_hint_running')}</p>
        </div>
        <button class="action-btn" type="button" onclick={toggleAudioDebug}>
          {showAudioDebug ? $t('settings.debug_hide') : $t('settings.debug_show')}
        </button>
        {#if showAudioDebug}
          <div class="debug-card">
            {#if audioDebug}
              <div class="debug-grid">
                <div>
                  <span class="debug-label">{$t('settings.debug_status')}</span><span
                    >{audioDebug.detector_status}</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_device')}</span><span
                    >{audioDebug.active_device_name ?? '—'}</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_sample_rate')}</span><span
                    >{audioDebug.sample_rate} Hz</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_buffer')}</span><span
                    >{audioDebug.analysis_buffer_len}/{audioDebug.window_size}</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_level')}</span><span
                    >{audioDebug.audio_level.rms.toFixed(3)} RMS</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_peak')}</span><span
                    >{audioDebug.audio_level.peak.toFixed(3)}</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_confidence')}</span><span
                    >{audioDebug.raw_confidence ? audioDebug.raw_confidence.toFixed(2) : '—'}</span
                  >
                </div>
                <div>
                  <span class="debug-label">{$t('settings.debug_frequency')}</span><span
                    >{audioDebug.raw_frequency_hz
                      ? `${audioDebug.raw_frequency_hz.toFixed(1)} Hz`
                      : '—'}</span
                  >
                </div>
              </div>

              <div class="debug-pitches">
                <div class="debug-pitch-block">
                  <span class="debug-label">{$t('settings.debug_tentative')}</span>
                  {#if audioDebug.tentative_pitch}
                    <PracticeNote
                      note={audioDebug.tentative_pitch.note_name}
                      octave={audioDebug.tentative_pitch.octave}
                      size="sm"
                      sourceMode={displayMode === 'concert' ? 'concert' : 'written'}
                    />
                  {:else}
                    <span>—</span>
                  {/if}
                </div>
                <div class="debug-pitch-block">
                  <span class="debug-label">{$t('settings.debug_detected')}</span>
                  {#if audioDebug.latest_pitch}
                    <PracticeNote
                      note={audioDebug.latest_pitch.note_name}
                      octave={audioDebug.latest_pitch.octave}
                      size="sm"
                      sourceMode={displayMode === 'concert' ? 'concert' : 'written'}
                      accent
                    />
                  {:else}
                    <span>—</span>
                  {/if}
                </div>
              </div>

              <div class="debug-log">
                <div class="debug-log-head">
                  <span class="section-label">{$t('settings.debug_log')}</span>
                  <button
                    class="pill small"
                    type="button"
                    onclick={() => {
                      audioDebugLogs = [];
                    }}
                  >
                    {$t('settings.debug_clear')}
                  </button>
                </div>
                {#if audioDebugLogs.length > 0}
                  {#each audioDebugLogs as line}
                    <div class="debug-line">{line}</div>
                  {/each}
                {:else}
                  <div class="debug-line empty">{$t('settings.debug_empty')}</div>
                {/if}
              </div>
            {:else}
              <p class="action-desc">{$t('settings.debug_unavailable')}</p>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Practice Goals -->
      <section class="setting-section">
        <div class="section-label">{$t('settings.goals')}</div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.days_per_week')}</span>
          <div class="pill-row">
            {#each dayOptions as d}
              <button
                class="pill small"
                class:active={daysPerWeek === d}
                onclick={() => {
                  daysPerWeek = d;
                  save();
                }}>{d}</button
              >
            {/each}
          </div>
        </div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.minutes_per_session')}</span>
          <div class="pill-row">
            {#each minuteOptions as m}
              <button
                class="pill small"
                class:active={minutesPerSession === m}
                onclick={() => {
                  minutesPerSession = m;
                  save();
                }}>{m}</button
              >
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
            <button class="pill" class:active={$locale === 'de'} onclick={() => setLocale('de')}
              >Deutsch</button
            >
            <button class="pill" class:active={$locale === 'en'} onclick={() => setLocale('en')}
              >English</button
            >
          </div>
        </div>
        <div class="goal-group">
          <span class="goal-label">{$t('settings.theme')}</span>
          <div class="pill-row">
            <button
              class="pill"
              class:active={$themeMode === 'auto'}
              onclick={() => setTheme('auto')}>{$t('theme.auto')}</button
            >
            <button
              class="pill"
              class:active={$themeMode === 'dark'}
              onclick={() => setTheme('dark')}>{$t('theme.dark')}</button
            >
            <button
              class="pill"
              class:active={$themeMode === 'light'}
              onclick={() => setTheme('light')}>{$t('theme.light')}</button
            >
          </div>
        </div>
      </section>

      {#if teacherFeaturesEnabled}
        <!-- Teacher: Assignments -->
        <section class="setting-section">
          <AssignmentCreator />
        </section>
      {/if}

      <!-- Data -->
      <section class="setting-section">
        <SharePanel />

        {#if !showResetConfirm}
          <button class="action-btn danger" onclick={() => (showResetConfirm = true)}>
            {$t('settings.reset')}
          </button>
          <p class="action-desc">{$t('settings.reset_desc')}</p>
        {:else}
          <div class="confirm-row">
            <span class="confirm-text">{$t('settings.reset_confirm')}</span>
            <button class="action-btn danger" onclick={resetData}>{$t('settings.reset')}</button>
            <button class="action-btn" onclick={() => (showResetConfirm = false)}
              >{$t('ob.back')}</button
            >
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
    position: fixed;
    inset: 0;
    z-index: 900;
    background: rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(1px) saturate(0.96);
  }

  .settings-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 901;
    width: 380px;
    max-width: 100vw;
    background: var(--bg-solid);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    box-shadow: -12px 0 36px rgba(15, 23, 42, 0.12);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-header h2 {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .close-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  .settings-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Sections ── */
  .setting-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .setting-section:last-child {
    border-bottom: none;
  }

  .section-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Select ── */
  .setting-select {
    width: 100%;
    padding: 8px 12px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .setting-select:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  /* ── Tuning ── */
  .tuning-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .tuning-value {
    font-size: 14px;
    font-weight: 600;
    min-width: 90px;
    font-variant-numeric: tabular-nums;
  }
  .tuning-slider {
    flex: 1;
    height: 4px;
    appearance: none;
    border-radius: 2px;
    background: var(--surface-2);
    outline: none;
  }
  .tuning-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  /* ── Pill buttons ── */
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .pill:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .pill.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
  }
  .pill.small {
    padding: 5px 12px;
    min-width: 36px;
    text-align: center;
  }

  /* ── Goals ── */
  .goal-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .goal-label {
    font-size: 12px;
    color: var(--text-2);
  }

  /* ── Action buttons ── */
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    width: fit-content;
  }
  .action-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .action-btn.danger {
    color: var(--red);
    border-color: var(--red-soft);
  }
  .action-btn.danger:hover {
    background: var(--red-soft);
  }

  .action-desc {
    font-size: 11px;
    color: var(--text-3);
    margin: 0;
  }

  .note-preview {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 64px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .debug-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 4px;
    padding: 12px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .debug-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }

  .debug-grid > div,
  .debug-pitch-block {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    font-size: 12px;
    color: var(--text-2);
  }

  .debug-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
  }

  .debug-pitches {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .debug-log {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .debug-log-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .debug-line {
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-2);
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--surface-2);
  }

  .debug-line.empty {
    color: var(--text-3);
  }

  .confirm-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    background: var(--red-soft);
  }
  .confirm-text {
    font-size: 12px;
    color: var(--red);
    flex: 1;
    min-width: 180px;
  }

  /* ── Saved toast ── */
  .saved-toast {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 16px;
    border-radius: 8px;
    background: var(--green);
    color: white;
    font-size: 11px;
    font-weight: 600;
    animation: fadeInOut 1.5s ease-out forwards;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(8px);
    }
    15% {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @media (max-width: 480px) {
    .settings-panel {
      width: 100vw;
    }
    .debug-grid,
    .debug-pitches {
      grid-template-columns: 1fr;
    }
  }
</style>
