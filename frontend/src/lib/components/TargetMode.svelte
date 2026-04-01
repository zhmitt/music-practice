<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    targetPhase, targetNote, targetOctave, targetResults,
    targetHoldProgress, targetCurrentCentsAvg,
    startTargetTraining, stopTargetTraining, nextTarget, getTargetScore,
    setInstrumentKey,
  } from '$lib/stores/targetTraining';
  import { tonelabActive } from '$lib/stores/tonelab';

  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  // Read instrument from localStorage to determine transposition key
  function getInstrumentKey(): string {
    try {
      const raw = localStorage.getItem('tt-user-profile');
      if (raw) {
        const p = JSON.parse(raw);
        const instr = p.instrument || 'horn_bb';
        if (['horn_bb', 'trumpet_bb', 'clarinet_bb', 'double_horn'].includes(instr)) return 'bb';
        if (instr === 'horn_f') return 'f';
        return 'concert';
      }
    } catch { /* fall through to default */ }
    return 'bb';
  }

  function handleStart() {
    setInstrumentKey(getInstrumentKey());
    startTargetTraining();
  }
</script>

<div class="target-panel">
  {#if $targetPhase === 'idle'}
    <div class="target-prompt">
      <p class="target-desc">{$t('tonelab.target.desc')}</p>
      {#if $tonelabActive}
        <button class="target-start-btn" onclick={handleStart}>
          {$t('tonelab.target.start')}
        </button>
      {/if}
    </div>
  {:else}
    <!-- Current target -->
    <div class="target-current">
      <div class="target-label">{$t('tonelab.target.play')}</div>
      <div class="target-note-big">{$targetNote}<sup>{$targetOctave}</sup></div>
    </div>

    <!-- Hold progress ring -->
    <div class="hold-ring-wrap">
      <svg viewBox="0 0 80 80" class="hold-ring">
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" stroke-width="4" />
        <circle cx="40" cy="40" r="34" fill="none"
          stroke={$targetPhase === 'result'
            ? ($targetResults[$targetResults.length - 1]?.passed ? 'var(--green)' : 'var(--amber)')
            : 'var(--accent)'}
          stroke-width="4"
          stroke-dasharray={2 * Math.PI * 34}
          stroke-dashoffset={2 * Math.PI * 34 * (1 - $targetHoldProgress)}
          stroke-linecap="round"
          transform="rotate(-90 40 40)"
          style="transition: stroke-dashoffset 0.1s"
        />
      </svg>
      <div class="hold-center">
        {#if $targetPhase === 'waiting'}
          <span class="hold-status waiting">{$t('tonelab.target.waiting')}</span>
        {:else if $targetPhase === 'detecting' || $targetPhase === 'held'}
          <span class="hold-status detecting">{fmtCents($targetCurrentCentsAvg)}ct</span>
        {:else if $targetPhase === 'result'}
          {#if $targetResults[$targetResults.length - 1]?.passed}
            <span class="hold-status good">{$t('tonelab.target.good')}</span>
          {:else}
            <span class="hold-status warn">{fmtCents($targetResults[$targetResults.length - 1]?.avgCents ?? 0)}ct</span>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Results so far -->
    {#if $targetResults.length > 0}
      <div class="target-score">
        <span class="score-passed">{getTargetScore().passed}/{getTargetScore().total}</span>
        <span class="score-avg">~{Math.round(getTargetScore().avgCents)}ct</span>
      </div>
      <div class="target-history">
        {#each $targetResults as r}
          <span
            class="result-dot"
            class:passed={r.passed}
            class:failed={!r.passed}
            title="{r.note} {fmtCents(r.avgCents)}ct"
          ></span>
        {/each}
      </div>
    {/if}

    <!-- Next / Stop buttons -->
    {#if $targetPhase === 'result'}
      <div class="target-actions">
        <button class="target-next-btn" onclick={nextTarget}>{$t('tonelab.target.next')}</button>
        <button class="target-stop-btn" onclick={stopTargetTraining}>{$t('tonelab.target.stop')}</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .target-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .target-prompt { text-align: center; }

  .target-desc {
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.4;
    margin: 0 0 12px;
  }

  .target-start-btn {
    padding: 8px 20px;
    border-radius: 10px;
    border: 1px solid var(--accent);
    background: var(--accent-soft);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .target-start-btn:hover { background: var(--accent); color: white; }

  .target-current { text-align: center; }

  .target-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .target-note-big {
    font-size: 36px;
    font-weight: 900;
    letter-spacing: -2px;
  }
  .target-note-big sup {
    font-size: 16px;
    font-weight: 600;
  }

  .hold-ring-wrap {
    position: relative;
    width: 80px;
    height: 80px;
  }
  .hold-ring { width: 100%; height: 100%; }

  .hold-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hold-status { font-size: 11px; font-weight: 600; }
  .hold-status.waiting  { color: var(--text-3); }
  .hold-status.detecting { color: var(--accent); }
  .hold-status.good    { color: var(--green); }
  .hold-status.warn    { color: var(--amber); }

  .target-score {
    display: flex;
    gap: 12px;
    font-size: 13px;
  }
  .score-passed { font-weight: 700; color: var(--green); }
  .score-avg    { color: var(--text-3); font-variant-numeric: tabular-nums; }

  .target-history {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .result-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--surface-2);
    transition: background 0.15s;
  }
  .result-dot.passed { background: var(--green); }
  .result-dot.failed { background: var(--amber); }

  .target-actions {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .target-next-btn,
  .target-stop-btn {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .target-next-btn {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .target-next-btn:hover { filter: brightness(1.1); }
  .target-stop-btn:hover { background: var(--surface-hover); }
</style>
