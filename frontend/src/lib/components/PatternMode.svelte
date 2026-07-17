<script lang="ts">
  import { t } from '$lib/i18n';
  import { ALL_PATTERNS, getPatternsByLevel, type PatternLevel } from '$lib/rhythm/patterns';
  import {
    patternPhase,
    currentPattern,
    currentRound,
    roundResults,
    latestTimings,
    countdownBeat,
    startPatternSession,
    repeatRound,
    nextRound,
    stopPatternSession,
  } from '$lib/stores/patternSession';
  import { onDestroy } from 'svelte';

  let selectedLevel = $state<PatternLevel>('anfaenger');
  let selectedPatternId = $state(ALL_PATTERNS[0].id);

  const levels: PatternLevel[] = ['anfaenger', 'fortgeschritten', 'schwer'];
  let filteredPatterns = $derived(getPatternsByLevel(selectedLevel));

  // Reset pattern selection when level changes
  $effect(() => {
    const patterns = getPatternsByLevel(selectedLevel);
    if (patterns.length > 0 && !patterns.find((p) => p.id === selectedPatternId)) {
      selectedPatternId = patterns[0].id;
    }
  });

  let selectedPattern = $derived(
    ALL_PATTERNS.find((p) => p.id === selectedPatternId) ?? ALL_PATTERNS[0],
  );

  function handleStart() {
    startPatternSession(selectedPattern);
  }

  function fmtDev(ms: number | null): string {
    if (ms === null) return '--';
    return ms >= 0 ? `+${ms}` : `${ms}`;
  }

  let isComplete = $derived($currentRound >= 4 && $patternPhase === 'scoring');

  onDestroy(() => {
    if ($patternPhase !== 'idle') stopPatternSession();
  });
</script>

<div class="pattern-mode">
  {#if $patternPhase === 'idle'}
    <!-- Pattern selection -->
    <div class="pattern-content">
      <div class="pattern-main">
        <div class="pattern-preview">
          <div class="preview-name">{$t(selectedPattern.nameKey)}</div>
          <div class="preview-info">
            {selectedPattern.timeSignature} / {selectedPattern.bpm} BPM
          </div>
          <!-- Beat block visualization -->
          <div class="beat-blocks">
            {#each selectedPattern.beats as beat}
              <div
                class="beat-block"
                class:rest={beat.type === 'rest'}
                style="flex: {beat.duration}"
              >
                <span class="block-label">{beat.label}</span>
              </div>
            {/each}
          </div>
          <button class="start-pattern-btn" onclick={handleStart}>
            <svg viewBox="0 0 24 24" width="16" height="16"
              ><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg
            >
            {$t('rhythm.pat.start')}
          </button>
        </div>
      </div>

      <div class="pattern-sidebar">
        <!-- Level selector -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.pat.level')}</div>
          <div class="pill-row">
            {#each levels as lv}
              <button
                class="pill"
                class:active={selectedLevel === lv}
                onclick={() => (selectedLevel = lv)}>{$t(`rhythm.pat.level.${lv}`)}</button
              >
            {/each}
          </div>
        </div>

        <!-- Pattern list -->
        <div class="setting-group">
          <div class="setting-label">{$t('rhythm.pat.select')}</div>
          <div class="pattern-list">
            {#each filteredPatterns as pat}
              <button
                class="pattern-item"
                class:active={selectedPatternId === pat.id}
                onclick={() => (selectedPatternId = pat.id)}
              >
                <span class="pat-name">{$t(pat.nameKey)}</span>
                <span class="pat-meta">{pat.bpm} BPM</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Active session -->
    <div class="pattern-content">
      <div class="pattern-main">
        <!-- Round indicator -->
        <div class="round-row">
          <span class="round-text"
            >{$t('rhythm.pat.round')} {$currentRound} {$t('rhythm.pat.of')} 4</span
          >
          <div class="round-dots">
            {#each [1, 2, 3, 4] as r}
              <span
                class="round-dot"
                class:filled={r <= $currentRound}
                class:current={r === $currentRound}
              ></span>
            {/each}
          </div>
        </div>

        {#if $patternPhase === 'countdown'}
          <!-- Count-in -->
          <div class="countdown-area">
            <div class="countdown-num">{$countdownBeat || ''}</div>
            <div class="countdown-label">{$t('rhythm.pat.countdown')}</div>
          </div>
        {:else if $patternPhase === 'playing'}
          <!-- Playing -->
          <div class="playing-area">
            <div class="playing-pulse"></div>
            <div class="playing-label">{$t('rhythm.pat.playing')}</div>
            <!-- Beat blocks showing progress -->
            {#if $currentPattern}
              <div class="beat-blocks beat-blocks-active">
                {#each $currentPattern.beats as beat}
                  <div
                    class="beat-block"
                    class:rest={beat.type === 'rest'}
                    style="flex: {beat.duration}"
                  >
                    <span class="block-label">{beat.label}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else if $patternPhase === 'scoring'}
          <!-- Results -->
          <div class="scoring-area">
            {#if isComplete}
              <div class="complete-badge">{$t('rhythm.pat.complete')}</div>
            {/if}

            <!-- Score -->
            {#if $roundResults.length > 0}
              {@const latest = $roundResults[$roundResults.length - 1]}
              <div class="score-display">
                <span class="score-value">{latest.scorePct}%</span>
                <span class="score-label">{$t('rhythm.pat.score')}</span>
              </div>
            {/if}

            <!-- Per-beat results -->
            <div class="timing-results">
              {#each $latestTimings as timing}
                <div class="timing-row">
                  <span class="timing-label">{$t('rhythm.pat.beat')} {timing.label}</span>
                  <span class="timing-icon">
                    {#if timing.actualMs === null}
                      <svg viewBox="0 0 16 16" width="14" height="14"
                        ><line
                          x1="4"
                          y1="4"
                          x2="12"
                          y2="12"
                          stroke="var(--red)"
                          stroke-width="2"
                        /><line
                          x1="12"
                          y1="4"
                          x2="4"
                          y2="12"
                          stroke="var(--red)"
                          stroke-width="2"
                        /></svg
                      >
                    {:else if timing.hit}
                      <svg viewBox="0 0 16 16" width="14" height="14"
                        ><path
                          d="M4 8l3 3 5-5"
                          stroke="var(--green)"
                          stroke-width="2"
                          fill="none"
                        /></svg
                      >
                    {:else}
                      <svg viewBox="0 0 16 16" width="14" height="14"
                        ><circle
                          cx="8"
                          cy="8"
                          r="5"
                          stroke="var(--amber)"
                          stroke-width="2"
                          fill="none"
                        /></svg
                      >
                    {/if}
                  </span>
                  <span
                    class="timing-dev"
                    class:good={timing.hit}
                    class:warn={timing.deviationMs !== null && !timing.hit}
                    class:miss={timing.actualMs === null}
                  >
                    {timing.actualMs === null
                      ? $t('rhythm.pat.missed')
                      : `${fmtDev(timing.deviationMs)} ms`}
                  </span>
                </div>
              {/each}
            </div>

            <!-- Trend (all rounds) -->
            {#if $roundResults.length > 1}
              <div class="trend-row">
                <span class="trend-label">{$t('rhythm.pat.trend')}</span>
                <div class="trend-values">
                  {#each $roundResults as rr, i}
                    <span class="trend-item">
                      {#if i > 0}<span class="trend-arrow">--></span>{/if}
                      {rr.scorePct}%
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Controls -->
            <div class="scoring-controls">
              <button class="ctrl-btn" onclick={stopPatternSession}>{$t('rhythm.pat.stop')}</button>
              <button class="ctrl-btn" onclick={repeatRound}>{$t('rhythm.pat.nochmal')}</button>
              {#if !isComplete}
                <button class="ctrl-btn accent" onclick={nextRound}
                  >{$t('rhythm.pat.weiter')}</button
                >
              {:else}
                <button class="ctrl-btn accent" onclick={stopPatternSession}
                  >{$t('session.done')}</button
                >
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Sidebar: pattern info during session -->
      <div class="pattern-sidebar">
        {#if $currentPattern}
          <div class="setting-group">
            <div class="setting-label">{$t('session.task')}</div>
            <div class="pat-task-name">{$t($currentPattern.nameKey)}</div>
            <div class="pat-task-meta">
              {$currentPattern.timeSignature} / {$currentPattern.bpm} BPM
            </div>
          </div>
          <div class="setting-group">
            <div class="setting-label">{$t('rhythm.pat.round')}</div>
            <div class="pat-task-name">{$currentRound} / 4</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .pattern-mode {
    height: 100%;
  }

  .pattern-content {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 16px;
    height: 100%;
  }

  .pattern-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 32px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  .pattern-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow-y: auto;
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
    white-space: nowrap;
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

  /* ── Pattern list ── */
  .pattern-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pattern-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.12s;
    text-align: left;
  }
  .pattern-item:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .pattern-item.active {
    background: var(--accent-soft);
    color: var(--text);
    border-color: var(--accent);
    font-weight: 600;
  }
  .pat-meta {
    font-size: 11px;
    color: var(--text-3);
  }

  /* ── Preview ── */
  .pattern-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .preview-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .preview-info {
    font-size: 13px;
    color: var(--text-3);
  }

  /* ── Beat blocks ── */
  .beat-blocks {
    display: flex;
    gap: 4px;
    width: 100%;
    max-width: 400px;
  }
  .beat-block {
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    transition: all 0.1s;
  }
  .beat-block.rest {
    background: var(--surface-2);
    border-color: var(--border);
    color: var(--text-3);
    opacity: 0.5;
  }
  .beat-blocks-active .beat-block {
    animation: pulse-block 0.6s ease-in-out infinite alternate;
  }
  @keyframes pulse-block {
    from {
      opacity: 0.7;
    }
    to {
      opacity: 1;
    }
  }

  .start-pattern-btn {
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
  .start-pattern-btn:hover {
    filter: brightness(1.1);
    transform: scale(1.02);
  }

  /* ── Round indicator ── */
  .round-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .round-text {
    font-size: 12px;
    color: var(--text-3);
    font-weight: 500;
  }
  .round-dots {
    display: flex;
    gap: 6px;
  }
  .round-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--text-3);
    transition: all 0.15s;
  }
  .round-dot.filled {
    background: var(--accent);
    border-color: var(--accent);
  }
  .round-dot.current {
    box-shadow: 0 0 8px var(--accent);
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

  /* ── Scoring ── */
  .scoring-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 400px;
  }

  .complete-badge {
    padding: 6px 16px;
    border-radius: 8px;
    background: var(--green);
    color: white;
    font-size: 13px;
    font-weight: 600;
  }

  .score-display {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .score-value {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -2px;
    color: var(--text);
  }
  .score-label {
    font-size: 13px;
    color: var(--text-3);
  }

  /* ── Timing results ── */
  .timing-results {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .timing-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--surface-2);
    font-size: 13px;
  }
  .timing-label {
    flex: 1;
    color: var(--text-2);
  }
  .timing-icon {
    display: flex;
    align-items: center;
  }
  .timing-dev {
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .timing-dev.good {
    color: var(--green);
  }
  .timing-dev.warn {
    color: var(--amber);
  }
  .timing-dev.miss {
    color: var(--red);
  }

  /* ── Trend ── */
  .trend-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--surface-2);
  }
  .trend-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .trend-values {
    display: flex;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
  }
  .trend-arrow {
    color: var(--text-3);
    margin: 0 2px;
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

  /* ── Sidebar task info ── */
  .pat-task-name {
    font-size: 16px;
    font-weight: 600;
  }
  .pat-task-meta {
    font-size: 12px;
    color: var(--text-3);
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .pattern-content {
      grid-template-columns: 1fr;
    }
    .pattern-sidebar {
      order: -1;
    }
  }
</style>
