<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '$lib/i18n';
  import PatternMode from '$lib/components/PatternMode.svelte';
  import SubdivisionMode from '$lib/components/SubdivisionMode.svelte';
  import {
    bpm, timeSignature, accentMode, subdivision, clickSound, volume,
    isPlaying, currentBeat,
    toggleMetronome, stopMetronome, tapTempo, adjustBpm,
    type TimeSignature, type AccentMode, type Subdivision, type ClickSound,
  } from '$lib/stores/metronome';

  function getBeatsPerBar(ts: TimeSignature): number {
    switch (ts) {
      case '2/4': return 2;
      case '3/4': return 3;
      case '4/4': return 4;
      case '6/8': return 6;
    }
  }

  const beats = $derived(Array.from({ length: getBeatsPerBar($timeSignature) }, (_, i) => i));

  const modes = [
    { key: 'metronome' as const, enabled: true },
    { key: 'patterns' as const, enabled: true },
    { key: 'subdivision' as const, enabled: true },
    { key: 'dictation' as const, enabled: false },
  ];

  let activeMode = $state('metronome');

  const timeSigs: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];
  const accents: { key: AccentMode; label: string }[] = [
    { key: 'standard', label: 'rhythm.accent.standard' },
    { key: 'beat1_only', label: 'rhythm.accent.beat1_only' },
    { key: 'none', label: 'rhythm.accent.none' },
  ];
  const subs: { key: Subdivision; label: string }[] = [
    { key: 'none', label: 'rhythm.sub.none' },
    { key: 'eighth', label: 'rhythm.sub.eighth' },
    { key: 'triplet', label: 'rhythm.sub.triplet' },
    { key: 'sixteenth', label: 'rhythm.sub.sixteenth' },
  ];
  const sounds: { key: ClickSound; label: string }[] = [
    { key: 'click', label: 'rhythm.sound.click' },
    { key: 'woodblock', label: 'rhythm.sound.woodblock' },
    { key: 'rimshot', label: 'rhythm.sound.rimshot' },
    { key: 'soft', label: 'rhythm.sound.soft' },
  ];

  onDestroy(() => {
    if ($isPlaying) stopMetronome();
  });
</script>

<div class="rhythm">
  <!-- Mode tabs -->
  <div class="rhythm-header">
    <div class="mode-tabs">
      {#each modes as mode}
        <button
          class="mode-tab"
          class:active={activeMode === mode.key}
          disabled={!mode.enabled}
          onclick={() => mode.enabled && (activeMode = mode.key)}
        >
          {$t(`rhythm.${mode.key}`)}
          {#if !mode.enabled}
            <span class="tab-badge">{$t('rhythm.phase2')}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  {#if activeMode === 'subdivision'}
    <SubdivisionMode />
  {:else if activeMode === 'patterns'}
    <PatternMode />
  {:else if activeMode === 'metronome'}
    <div class="metro-content">
      <!-- Left: Main metronome area -->
      <div class="metro-main">
        <!-- Beat visualization -->
        <div class="beat-row">
          {#each beats as i}
            <div
              class="beat-dot"
              class:active={$currentBeat === i}
              class:downbeat={i === 0}
            >
              {i + 1}
            </div>
          {/each}
        </div>

        <!-- BPM display -->
        <div class="bpm-area">
          <button class="bpm-btn" onclick={() => adjustBpm(-1)} aria-label="Decrease BPM">-</button>
          <div class="bpm-display">
            <span class="bpm-value">{$bpm}</span>
            <span class="bpm-label">{$t('rhythm.bpm')}</span>
          </div>
          <button class="bpm-btn" onclick={() => adjustBpm(1)} aria-label="Increase BPM">+</button>
        </div>

        <!-- BPM slider -->
        <input
          type="range"
          class="bpm-slider"
          min="40"
          max="208"
          bind:value={$bpm}
        />

        <!-- Controls -->
        <div class="metro-controls">
          <button class="tap-btn" onclick={tapTempo}>
            {$t('rhythm.tap')}
          </button>
          <button class="play-btn" class:active={$isPlaying} onclick={toggleMetronome}>
            {#if $isPlaying}
              <svg viewBox="0 0 24 24" width="20" height="20"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
            {/if}
          </button>
        </div>
      </div>

      <!-- Right: Settings panel -->
      <div class="metro-sidebar">
        <!-- Time signature -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.time_sig')}</div>
          <div class="pill-row">
            {#each timeSigs as ts}
              <button
                class="pill"
                class:active={$timeSignature === ts}
                onclick={() => timeSignature.set(ts)}
              >{ts}</button>
            {/each}
          </div>
        </div>

        <!-- Accent -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.accent')}</div>
          <div class="pill-row">
            {#each accents as a}
              <button
                class="pill"
                class:active={$accentMode === a.key}
                onclick={() => accentMode.set(a.key)}
              >{$t(a.label)}</button>
            {/each}
          </div>
        </div>

        <!-- Subdivision -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.subdivisions')}</div>
          <div class="pill-row pill-row-wrap">
            {#each subs as s}
              <button
                class="pill"
                class:active={$subdivision === s.key}
                onclick={() => subdivision.set(s.key)}
              >{$t(s.label)}</button>
            {/each}
          </div>
        </div>

        <!-- Sound -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.sound')}</div>
          <div class="pill-row pill-row-wrap">
            {#each sounds as snd}
              <button
                class="pill"
                class:active={$clickSound === snd.key}
                onclick={() => clickSound.set(snd.key)}
              >{$t(snd.label)}</button>
            {/each}
          </div>
        </div>

        <!-- Volume -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.volume')}</div>
          <input
            type="range"
            class="vol-slider"
            min="0"
            max="1"
            step="0.05"
            bind:value={$volume}
          />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .rhythm {
    display: flex; flex-direction: column; gap: 16px;
    height: 100%;
  }

  /* ── Mode tabs ── */
  .rhythm-header { display: flex; }
  .mode-tabs { display: flex; gap: 4px; }

  .mode-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .mode-tab:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
  .mode-tab.active {
    background: var(--accent-soft); color: var(--text); border-color: var(--accent); font-weight: 600;
  }
  .mode-tab:disabled { opacity: 0.4; cursor: not-allowed; }

  .tab-badge {
    font-size: 9px; padding: 2px 6px; border-radius: 4px;
    background: var(--surface-2); color: var(--text-3);
  }

  /* ── Content layout ── */
  .metro-content {
    display: grid; grid-template-columns: 1fr 280px; gap: 16px;
    flex: 1; min-height: 0;
  }

  .metro-main {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 24px; padding: 32px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  }

  .metro-sidebar {
    display: flex; flex-direction: column; gap: 16px;
    padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  }

  /* ── Beat dots ── */
  .beat-row { display: flex; gap: 12px; }

  .beat-dot {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: var(--text-3);
    background: var(--surface-2); border: 2px solid var(--border);
    transition: all 0.08s ease-out;
  }
  .beat-dot.active {
    background: var(--accent); color: white; border-color: var(--accent);
    transform: scale(1.15);
    box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .beat-dot.downbeat { font-weight: 900; }
  .beat-dot.downbeat.active {
    background: var(--accent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 50%, transparent);
  }

  /* ── BPM ── */
  .bpm-area { display: flex; align-items: center; gap: 24px; }

  .bpm-btn {
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text); font-size: 20px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.12s; font-family: inherit;
  }
  .bpm-btn:hover { background: var(--surface-hover); }
  .bpm-btn:active { transform: scale(0.95); }

  .bpm-display { text-align: center; }
  .bpm-value {
    font-size: 56px; font-weight: 900; letter-spacing: -3px; line-height: 1;
    color: var(--text);
  }
  .bpm-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 2px; margin-top: 4px; display: block;
  }

  .bpm-slider {
    width: 260px; accent-color: var(--accent);
    cursor: pointer;
  }

  /* ── Controls ── */
  .metro-controls { display: flex; gap: 12px; align-items: center; }

  .tap-btn {
    padding: 10px 24px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-2); font-family: inherit; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all 0.12s;
  }
  .tap-btn:hover { background: var(--surface-hover); color: var(--text); }
  .tap-btn:active { transform: scale(0.97); }

  .play-btn {
    width: 56px; height: 56px; border-radius: 50%;
    border: none; background: var(--accent); color: white;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .play-btn:hover { filter: brightness(1.1); transform: scale(1.05); }
  .play-btn:active { transform: scale(0.97); }
  .play-btn.active { background: var(--red); }

  /* ── Settings sidebar ── */
  .setting-group { display: flex; flex-direction: column; gap: 8px; }

  .setting-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px;
  }

  .pill-row { display: flex; gap: 4px; }
  .pill-row-wrap { flex-wrap: wrap; }

  .pill {
    padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 12px; cursor: pointer; transition: all 0.12s; white-space: nowrap;
  }
  .pill:hover { background: var(--surface-hover); color: var(--text); }
  .pill.active {
    background: var(--accent-soft); color: var(--text); border-color: var(--accent);
    font-weight: 600;
  }

  .vol-slider {
    width: 100%; accent-color: var(--accent); cursor: pointer;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .metro-content { grid-template-columns: 1fr; }
    .metro-sidebar { order: -1; }
    .mode-tabs { overflow-x: auto; }
  }

  @media (max-width: 480px) {
    .metro-main { padding: 20px 16px; gap: 16px; }
    .metro-sidebar { padding: 14px; }
    .bpm-value { font-size: 44px; }
    .bpm-slider { width: 200px; }
    .beat-dot { width: 38px; height: 38px; font-size: 14px; }
    .play-btn { width: 48px; height: 48px; }
  }
</style>
