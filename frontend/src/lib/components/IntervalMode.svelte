<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    intervalPhase, intervalChallenge, intervalResults,
    intervalHoldProgress, intervalCurrentCents,
    startIntervalTraining, stopIntervalTraining, nextInterval, getIntervalScore,
  } from '$lib/stores/intervalTraining';
  import { tonelabActive } from '$lib/stores/tonelab';

  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }
</script>

<div class="interval-panel">
  {#if $intervalPhase === 'idle'}
    <div class="interval-prompt">
      <p class="interval-desc">{$t('tonelab.interval.desc')}</p>
      {#if $tonelabActive}
        <button class="interval-start-btn" onclick={startIntervalTraining}>
          {$t('tonelab.interval.start')}
        </button>
      {/if}
    </div>
  {:else if $intervalChallenge}
    <!-- Challenge display -->
    <div class="interval-challenge">
      <div class="iv-root">
        <div class="iv-label">{$t('tonelab.interval.root')}</div>
        <div class="iv-note">{$intervalChallenge.rootNote}<sup>{$intervalChallenge.rootOctave}</sup></div>
      </div>
      <div class="iv-arrow">+</div>
      <div class="iv-target">
        <div class="iv-label">{$t($intervalChallenge.intervalName)}</div>
        <div class="iv-note target-note">{$intervalChallenge.targetNote}<sup>{$intervalChallenge.targetOctave}</sup></div>
      </div>
    </div>

    <!-- Phase indicator -->
    <div class="iv-phase">
      {#if $intervalPhase === 'listening'}
        <span class="phase-text listening">{$t('tonelab.interval.listen')}</span>
      {:else if $intervalPhase === 'playing'}
        <!-- Hold progress bar -->
        <div class="hold-bar-wrap">
          <div
            class="hold-bar"
            style="width: {$intervalHoldProgress * 100}%"
            class:good={Math.abs($intervalCurrentCents) <= 5}
            class:warn={Math.abs($intervalCurrentCents) > 5 && Math.abs($intervalCurrentCents) <= 15}
          ></div>
        </div>
        <span class="phase-cents">
          {#if $intervalHoldProgress > 0}
            {fmtCents($intervalCurrentCents)}ct
          {:else}
            {$t('tonelab.interval.your_turn')}
          {/if}
        </span>
      {:else if $intervalPhase === 'result'}
        {#if $intervalResults[$intervalResults.length - 1]?.correct}
          <span class="phase-text good">{$t('tonelab.target.good')}</span>
        {:else}
          <span class="phase-text warn">{fmtCents($intervalResults[$intervalResults.length - 1]?.avgCents ?? 0)}ct</span>
        {/if}
      {/if}
    </div>

    <!-- Score -->
    {#if $intervalResults.length > 0}
      <div class="iv-score">
        <span class="score-correct">{getIntervalScore().correct}/{getIntervalScore().total}</span>
        <span class="score-avg">~{Math.round(getIntervalScore().avgCents)}ct</span>
      </div>
      <div class="iv-dots">
        {#each $intervalResults as r}
          <span class="iv-dot" class:correct={r.correct} class:wrong={!r.correct}></span>
        {/each}
      </div>
    {/if}

    <!-- Actions -->
    {#if $intervalPhase === 'result'}
      <div class="iv-actions">
        <button class="iv-next-btn" onclick={nextInterval}>{$t('tonelab.target.next')}</button>
        <button class="iv-stop-btn" onclick={stopIntervalTraining}>{$t('tonelab.target.stop')}</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .interval-panel {
    display: flex; flex-direction: column; gap: 12px; align-items: center;
    margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--border);
  }

  .interval-prompt { text-align: center; }
  .interval-desc { font-size: 11px; color: var(--text-3); line-height: 1.4; margin: 0 0 12px; }

  .interval-start-btn {
    padding: 8px 20px; border-radius: 10px; border: 1px solid var(--accent);
    background: var(--accent-soft); color: var(--text); font-family: inherit;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .interval-start-btn:hover { background: var(--accent); color: white; }

  .interval-challenge {
    display: flex; align-items: center; gap: 12px;
  }
  .iv-root, .iv-target { text-align: center; }
  .iv-label { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
  .iv-note { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
  .iv-note sup { font-size: 12px; font-weight: 600; }
  .iv-note.target-note { color: var(--accent); }
  .iv-arrow { font-size: 16px; color: var(--text-3); margin-top: 10px; }

  .iv-phase { width: 100%; text-align: center; }
  .phase-text { font-size: 12px; font-weight: 600; }
  .phase-text.listening { color: var(--accent); }
  .phase-text.good { color: var(--green); }
  .phase-text.warn { color: var(--amber); }
  .phase-cents { font-size: 11px; color: var(--text-2); display: block; margin-top: 4px; }

  .hold-bar-wrap {
    height: 4px; background: var(--surface-2); border-radius: 2px;
    overflow: hidden; width: 100%;
  }
  .hold-bar {
    height: 100%; border-radius: 2px; background: var(--accent);
    transition: width 0.1s;
  }
  .hold-bar.good { background: var(--green); }
  .hold-bar.warn { background: var(--amber); }

  .iv-score { display: flex; gap: 12px; font-size: 13px; }
  .score-correct { font-weight: 700; color: var(--green); }
  .score-avg { color: var(--text-3); font-variant-numeric: tabular-nums; }

  .iv-dots { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
  .iv-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--surface-2);
  }
  .iv-dot.correct { background: var(--green); }
  .iv-dot.wrong { background: var(--amber); }

  .iv-actions { display: flex; gap: 8px; width: 100%; }
  .iv-next-btn, .iv-stop-btn {
    flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 12px; cursor: pointer; transition: all 0.15s;
  }
  .iv-next-btn { background: var(--accent); color: white; border-color: var(--accent); }
  .iv-next-btn:hover { filter: brightness(1.1); }
  .iv-stop-btn:hover { background: var(--surface-hover); }
</style>
