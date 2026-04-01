<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '$lib/i18n';
  import PitchMeter from '$lib/components/PitchMeter.svelte';
  import StabilityGraph from '$lib/components/StabilityGraph.svelte';
  import PitchHistory from '$lib/components/PitchHistory.svelte';
  import {
    tonelabActive, tonelabMode,
    currentNote, currentOctave, currentCents, currentFrequency,
    isDetecting, audioLevel,
    historySamples, centsSamples, tendencies, stats,
    startToneLab, stopToneLab,
  } from '$lib/stores/tonelab';

  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  function toggle() {
    if ($tonelabActive) {
      stopToneLab();
    } else {
      startToneLab();
    }
  }

  onDestroy(() => {
    if ($tonelabActive) stopToneLab();
  });

  const modes = [
    { key: 'free_play' as const, enabled: true },
    { key: 'drone' as const, enabled: false },
    { key: 'target' as const, enabled: false },
    { key: 'interval' as const, enabled: false },
  ];
</script>

<div class="tonelab">
  <!-- Start/Stop button -->
  <div class="tonelab-header">
    <button class="toggle-btn" class:active={$tonelabActive} onclick={toggle}>
      {#if $tonelabActive}
        <svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>
        {$t('tonelab.stop')}
      {:else}
        <svg viewBox="0 0 24 24" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
        {$t('tonelab.start')}
      {/if}
    </button>
  </div>

  <!-- Main content: two columns -->
  <div class="tonelab-content">
    <!-- Left: Pitch display -->
    <div class="tonelab-main">
      {#if $tonelabActive}
        <div class="pitch-area">
          <div class="pitch-info">
            {#if $isDetecting}
              <div class="note-big">{$currentNote}<sup>{$currentOctave}</sup></div>
              <div class="hz-label">{$currentFrequency.toFixed(1)} Hz</div>
            {:else}
              <div class="note-big idle">--</div>
              <div class="hz-label">{$t('tonelab.no_signal')}</div>
            {/if}
          </div>
          <PitchMeter cents={$currentCents} active={$isDetecting} />
        </div>

        <!-- Cent display -->
        <div class="cent-display">
          {#if $isDetecting}
            <span class="cent-num" class:good={Math.abs($currentCents) <= 5} class:warn={Math.abs($currentCents) > 5 && Math.abs($currentCents) <= 15} class:bad={Math.abs($currentCents) > 15}>
              {fmtCents($currentCents)}
            </span>
            <span class="cent-unit">ct</span>
          {/if}
        </div>

        <!-- Level bars when no pitch -->
        {#if !$isDetecting}
          <div class="level-bars">
            {#each Array(5) as _, i}
              <div class="level-bar" class:active={$audioLevel > (i + 1) * 0.04}></div>
            {/each}
          </div>
        {/if}

        <!-- Stability graph -->
        <StabilityGraph samples={$centsSamples} />
      {:else}
        <div class="idle-prompt">
          <div class="idle-icon">
            <svg viewBox="0 0 24 24" width="48" height="48"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--text-3)" stroke-width="1.2"/><circle cx="12" cy="12" r="3" fill="none" stroke="var(--text-3)" stroke-width="1.2"/></svg>
          </div>
          <p>{$t('tonelab.no_signal')}</p>
        </div>
      {/if}
    </div>

    <!-- Right: Mode selector -->
    <div class="tonelab-sidebar">
      <div class="mode-label">{$t('tonelab.mode')}</div>
      <div class="mode-list">
        {#each modes as mode}
          <button
            class="mode-btn"
            class:active={$tonelabMode === mode.key}
            disabled={!mode.enabled}
            onclick={() => mode.enabled && tonelabMode.set(mode.key)}
          >
            <span class="mode-name">{$t(`tonelab.mode.${mode.key}`)}</span>
            {#if !mode.enabled}
              <span class="mode-badge">{$t('tonelab.mode.phase2')}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- History graph (full width) -->
  {#if $tonelabActive}
    <PitchHistory samples={$historySamples} />

    <!-- Stats row -->
    <div class="stats-row">
      <div class="card stat-card">
        <div class="stat-value">{$stats.toneCount}</div>
        <div class="stat-label">{$t('tonelab.stats.tones')}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">{Math.round($stats.accuracy * 100)}%</div>
        <div class="stat-label">{$t('tonelab.stats.accuracy')}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">±{Math.round($stats.avgCents)}ct</div>
        <div class="stat-label">{$t('tonelab.stats.avg_cents')}</div>
      </div>
    </div>

    <!-- Tendencies -->
    {#if $tendencies.length > 0}
      <div class="tendency-section">
        <div class="tendency-label">{$t('tonelab.tendency')}</div>
        <div class="tendency-list">
          {#each $tendencies.slice(0, 8) as tn}
            <div class="tendency-chip">
              <span class="tn-note">{tn.noteKey}</span>
              <span class="tn-cents"
                class:good={Math.abs(tn.avgCents) <= 5}
                class:warn={Math.abs(tn.avgCents) > 5 && Math.abs(tn.avgCents) <= 15}
                class:bad={Math.abs(tn.avgCents) > 15}
              >
                {fmtCents(tn.avgCents)}ct
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .tonelab {
    display: flex; flex-direction: column; gap: 16px;
    height: 100%;
  }

  /* ── Header ── */
  .tonelab-header { display: flex; justify-content: flex-end; }

  .toggle-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 20px; border-radius: 10px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-2); font-family: inherit;
    font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .toggle-btn:hover { background: var(--surface-hover); color: var(--text); }
  .toggle-btn.active {
    background: var(--accent); color: white; border-color: var(--accent);
  }
  .toggle-btn.active:hover { filter: brightness(1.1); }

  /* ── Content two-column ── */
  .tonelab-content {
    display: grid; grid-template-columns: 1fr 240px; gap: 16px;
    flex: 1; min-height: 0;
  }

  .tonelab-main {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 24px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  }

  .tonelab-sidebar {
    display: flex; flex-direction: column; gap: 12px;
    padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  }

  /* ── Pitch area ── */
  .pitch-area { display: flex; align-items: center; gap: 40px; }
  .pitch-info { text-align: center; }

  .note-big {
    font-size: 72px; font-weight: 900; letter-spacing: -3px; line-height: 1;
    color: var(--text);
  }
  .note-big.idle { color: var(--text-3); }
  .note-big sup { font-size: 28px; font-weight: 600; }
  .hz-label { font-size: 13px; color: var(--text-3); margin-top: 6px; }

  /* ── Cent display ── */
  .cent-display { display: flex; align-items: baseline; gap: 4px; }
  .cent-num { font-size: 32px; font-weight: 700; letter-spacing: -1px; color: var(--green); }
  .cent-num.good { color: var(--green); }
  .cent-num.warn { color: var(--amber); }
  .cent-num.bad { color: var(--red); }
  .cent-unit { font-size: 11px; color: var(--text-3); }

  /* ── Level bars ── */
  .level-bars { display: flex; gap: 4px; margin-top: 12px; }
  .level-bar {
    width: 4px; height: 24px; border-radius: 2px;
    background: var(--surface-2); transition: background 0.1s;
  }
  .level-bar.active { background: var(--accent); }

  /* ── Idle prompt ── */
  .idle-prompt {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    color: var(--text-3);
  }
  .idle-prompt p { font-size: 13px; }

  /* ── Mode selector ── */
  .mode-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px;
  }
  .mode-list { display: flex; flex-direction: column; gap: 6px; }

  .mode-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 13px; cursor: pointer; transition: all 0.15s; text-align: left;
  }
  .mode-btn:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
  .mode-btn.active { background: var(--accent-soft); color: var(--text); border-color: var(--accent); font-weight: 600; }
  .mode-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .mode-badge {
    font-size: 9px; padding: 2px 6px; border-radius: 4px;
    background: var(--surface-2); color: var(--text-3);
  }

  /* ── Stats row ── */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

  .stat-card {
    padding: 16px; text-align: center;
  }
  .stat-value { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
  .stat-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px; margin-top: 4px;
  }

  /* ── Tendencies ── */
  .tendency-section { display: flex; flex-direction: column; gap: 8px; }
  .tendency-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px;
  }
  .tendency-list { display: flex; flex-wrap: wrap; gap: 8px; }

  .tendency-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 8px;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 13px;
  }
  .tn-note { font-weight: 600; }
  .tn-cents { font-size: 11px; color: var(--text-3); }
  .tn-cents.good { color: var(--green); }
  .tn-cents.warn { color: var(--amber); }
  .tn-cents.bad { color: var(--red); }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .tonelab-content { grid-template-columns: 1fr; }
    .tonelab-sidebar { order: -1; }
  }
</style>
