<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '$lib/i18n';
  import {
    subPhase,
    subType,
    subBpm,
    subBars,
    subTimeSignature,
    countdownBeat,
    barResults,
    overallEvenness,
    startSubdivisionExercise,
    stopSubdivisionExercise,
    type SubdivisionType,
  } from '$lib/stores/subdivisionSession';

  const subTypes: { key: SubdivisionType; label: string }[] = [
    { key: 'eighth', label: 'rhythm.sub_trainer.type.eighth' },
    { key: 'triplet', label: 'rhythm.sub_trainer.type.triplet' },
    { key: 'sixteenth', label: 'rhythm.sub_trainer.type.sixteenth' },
  ];

  const timeSigs: Array<'3/4' | '4/4'> = ['3/4', '4/4'];
  const barOptions = [1, 2, 4];

  function adjustBpm(delta: number) {
    subBpm.update((b) => Math.max(40, Math.min(160, b + delta)));
  }

  onDestroy(() => {
    if ($subPhase !== 'idle') stopSubdivisionExercise();
  });
</script>

<div class="sub-mode">
  {#if $subPhase === 'idle'}
    <div class="sub-content">
      <div class="sub-main">
        <div class="sub-preview">
          <p class="sub-hint">{$t('rhythm.sub_trainer.hint')}</p>

          <!-- BPM -->
          <div class="bpm-area">
            <button class="bpm-btn" onclick={() => adjustBpm(-1)}>-</button>
            <div class="bpm-display">
              <span class="bpm-value">{$subBpm}</span>
              <span class="bpm-label">BPM</span>
            </div>
            <button class="bpm-btn" onclick={() => adjustBpm(1)}>+</button>
          </div>
          <input type="range" class="bpm-slider" min="40" max="160" bind:value={$subBpm} />

          <button class="start-btn" onclick={startSubdivisionExercise}>
            <svg viewBox="0 0 24 24" width="16" height="16"
              ><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg
            >
            {$t('rhythm.sub_trainer.start')}
          </button>
        </div>
      </div>

      <div class="sub-sidebar">
        <!-- Subdivision type -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.sub_trainer.type')}</div>
          <div class="pill-row">
            {#each subTypes as st}
              <button
                class="pill"
                class:active={$subType === st.key}
                onclick={() => subType.set(st.key)}
              >
                {$t(st.label)}
              </button>
            {/each}
          </div>
        </div>

        <!-- Time signature -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.sub_trainer.time_sig')}</div>
          <div class="pill-row">
            {#each timeSigs as ts}
              <button
                class="pill"
                class:active={$subTimeSignature === ts}
                onclick={() => subTimeSignature.set(ts)}
              >
                {ts}
              </button>
            {/each}
          </div>
        </div>

        <!-- Number of bars -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.sub_trainer.bars')}</div>
          <div class="pill-row">
            {#each barOptions as b}
              <button class="pill" class:active={$subBars === b} onclick={() => subBars.set(b)}>
                {b}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else if $subPhase === 'countdown'}
    <div class="sub-content">
      <div class="sub-main">
        <div class="countdown-area">
          <div class="countdown-num">{$countdownBeat || ''}</div>
          <div class="countdown-label">{$t('rhythm.sub_trainer.countdown')}</div>
        </div>
      </div>
      <div class="sub-sidebar"></div>
    </div>
  {:else if $subPhase === 'playing'}
    <div class="sub-content">
      <div class="sub-main">
        <div class="playing-area">
          <div class="playing-pulse"></div>
          <div class="playing-label">{$t('rhythm.sub_trainer.playing')}</div>
        </div>
      </div>
      <div class="sub-sidebar"></div>
    </div>
  {:else if $subPhase === 'scoring'}
    <div class="sub-content">
      <div class="sub-main">
        <!-- Overall evenness score -->
        <div class="evenness-display">
          <span
            class="evenness-value"
            class:good={$overallEvenness <= 15}
            class:warn={$overallEvenness > 15 && $overallEvenness <= 30}
            class:bad={$overallEvenness > 30}>{$overallEvenness}</span
          >
          <span class="evenness-unit">{$t('rhythm.sub_trainer.evenness_unit')}</span>
          <span class="evenness-label">{$t('rhythm.sub_trainer.evenness')}</span>
        </div>

        <!-- Deviation chart per bar -->
        {#each $barResults as bar}
          <div class="bar-result">
            <div class="bar-header">
              {$t('rhythm.sub_trainer.bar')}
              {bar.barNumber} — {bar.evennessScore} ms RMS
            </div>
            <div class="deviation-chart">
              {#each bar.slots as slot}
                <div class="slot-col" class:main-beat={slot.isMainBeat}>
                  <!-- Deviation track -->
                  <div class="dev-track">
                    <div class="dev-zero"></div>
                    {#if slot.deviationMs !== null}
                      <div
                        class="dev-dot"
                        class:good={!slot.isMainBeat && Math.abs(slot.deviationMs) <= 15}
                        class:warn={!slot.isMainBeat && Math.abs(slot.deviationMs) > 15}
                        style="bottom: {50 + (slot.deviationMs / 100) * 50}%"
                      ></div>
                    {:else if !slot.isMainBeat}
                      <div class="dev-miss">x</div>
                    {/if}
                  </div>
                  <!-- Label -->
                  <div class="slot-label" class:sub-label={!slot.isMainBeat}>{slot.label}</div>
                  <!-- Deviation value -->
                  {#if slot.deviationMs !== null && !slot.isMainBeat}
                    <div
                      class="slot-dev"
                      class:good={Math.abs(slot.deviationMs) <= 15}
                      class:warn={Math.abs(slot.deviationMs) > 15}
                    >
                      {slot.deviationMs >= 0 ? '+' : ''}{slot.deviationMs}
                    </div>
                  {:else if !slot.isMainBeat}
                    <div class="slot-dev miss">{$t('rhythm.sub_trainer.missed')}</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}

        <!-- Controls -->
        <div class="scoring-controls">
          <button class="ctrl-btn" onclick={stopSubdivisionExercise}
            >{$t('rhythm.sub_trainer.stop')}</button
          >
          <button
            class="ctrl-btn accent"
            onclick={() => {
              stopSubdivisionExercise();
              startSubdivisionExercise();
            }}
          >
            {$t('rhythm.sub_trainer.again')}
          </button>
        </div>
      </div>
      <div class="sub-sidebar"></div>
    </div>
  {/if}
</div>

<style>
  .sub-mode {
    height: 100%;
  }

  .sub-content {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 16px;
    height: 100%;
  }

  .sub-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow-y: auto;
  }

  .sub-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  /* ── Settings ── */
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .setting-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .pill-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .pill {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .pill:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .pill.active {
    background: var(--accent-soft);
    color: var(--text);
    border-color: var(--accent);
    font-weight: 600;
  }

  /* ── Preview / BPM ── */
  .sub-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .sub-hint {
    font-size: 13px;
    color: var(--text-3);
    text-align: center;
    max-width: 320px;
    line-height: 1.5;
    margin: 0;
  }

  .bpm-area {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .bpm-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    transition: all 0.12s;
  }
  .bpm-btn:hover {
    background: var(--surface-hover);
  }
  .bpm-display {
    text-align: center;
  }
  .bpm-value {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -2px;
    line-height: 1;
    color: var(--text);
  }
  .bpm-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 2px;
    display: block;
    margin-top: 2px;
  }
  .bpm-slider {
    width: 220px;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .start-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 12px;
    border: none;
    background: var(--accent);
    color: white;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent);
    transition: all 0.15s;
  }
  .start-btn:hover {
    filter: brightness(1.1);
    transform: scale(1.02);
  }

  /* ── Countdown ── */
  .countdown-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .countdown-num {
    font-size: 72px;
    font-weight: 900;
    color: var(--text);
    animation: pop 0.3s ease-out;
  }
  @keyframes pop {
    from {
      transform: scale(0.8);
      opacity: 0.5;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  .countdown-label {
    font-size: 13px;
    color: var(--text-3);
  }

  /* ── Playing ── */
  .playing-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .playing-pulse {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse-play 0.5s ease-in-out infinite alternate;
  }
  @keyframes pulse-play {
    from {
      transform: scale(1);
      opacity: 0.6;
    }
    to {
      transform: scale(1.3);
      opacity: 1;
    }
  }
  .playing-label {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
  }

  /* ── Evenness display ── */
  .evenness-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .evenness-value {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -2px;
  }
  .evenness-value.good {
    color: var(--green);
  }
  .evenness-value.warn {
    color: var(--amber);
  }
  .evenness-value.bad {
    color: var(--red);
  }
  .evenness-unit {
    font-size: 11px;
    color: var(--text-3);
  }
  .evenness-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Bar result ── */
  .bar-result {
    width: 100%;
    max-width: 500px;
    background: var(--surface-2);
    border-radius: 10px;
    padding: 12px 16px;
  }
  .bar-header {
    font-size: 11px;
    color: var(--text-3);
    font-weight: 600;
    margin-bottom: 8px;
  }

  /* ── Deviation chart ── */
  .deviation-chart {
    display: flex;
    gap: 2px;
  }

  .slot-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .slot-col.main-beat {
    opacity: 0.4;
  }

  .dev-track {
    width: 100%;
    height: 48px;
    position: relative;
    background: var(--surface);
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .dev-zero {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--text-3);
    opacity: 0.3;
  }
  .dev-dot {
    position: absolute;
    left: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transform: translate(-50%, 50%);
  }
  .dev-dot.good {
    background: var(--green);
  }
  .dev-dot.warn {
    background: var(--amber);
  }
  .dev-miss {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    color: var(--red);
    font-weight: 700;
  }

  .slot-label {
    font-size: 9px;
    color: var(--text-2);
    font-weight: 600;
    white-space: nowrap;
  }
  .slot-label.sub-label {
    color: var(--text-3);
  }

  .slot-dev {
    font-size: 8px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .slot-dev.good {
    color: var(--green);
  }
  .slot-dev.warn {
    color: var(--amber);
  }
  .slot-dev.miss {
    color: var(--red);
  }

  /* ── Controls ── */
  .scoring-controls {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .ctrl-btn {
    padding: 8px 18px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ctrl-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .ctrl-btn.accent {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .ctrl-btn.accent:hover {
    filter: brightness(1.1);
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .sub-content {
      grid-template-columns: 1fr;
    }
    .sub-sidebar {
      order: -1;
    }
  }
</style>
