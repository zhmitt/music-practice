<script lang="ts">
  import { sessionActive } from '$lib/stores/navigation';
  import { t } from '$lib/i18n';
  import PitchMeter from './PitchMeter.svelte';
  import StabilityGraph from './StabilityGraph.svelte';
  import {
    sessionPlan, exerciseIndex, toneIndex, tonePhase, sessionPhase,
    toneResults, centsSamples, currentCents, currentNote, currentFrequency,
    audioLevel, elapsedSeconds,
    stopSession, togglePause, skipTone, nextExercise, repeatExercise,
  } from '$lib/stores/session';

  // Format seconds as MM:SS
  function fmtTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // Format cents with sign
  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  // Reactive derived values — must use $store directly so Svelte 5 tracks dependencies
  let exercise = $derived.by(() => {
    const plan = $sessionPlan;
    const idx = $exerciseIndex;
    if (!plan) return null;
    return plan.exercises[idx] ?? null;
  });

  let tone = $derived.by(() => {
    const ex = exercise;
    const idx = $toneIndex;
    if (!ex) return null;
    return ex.tones[idx] ?? null;
  });

  let progress = $derived.by(() => {
    const plan = $sessionPlan;
    const eIdx = $exerciseIndex;
    const tIdx = $toneIndex;
    if (!plan) return 0;
    const totalTones = plan.exercises.reduce((s, e) => s + e.tones.length, 0);
    if (totalTones === 0) return 0;
    let done = 0;
    for (let i = 0; i < eIdx; i++) {
      done += plan.exercises[i].tones.length;
    }
    done += tIdx;
    return done / totalTones;
  });

  // Hold progress (0-1) for the current tone
  let holdProgress = $derived.by(() => {
    if (!tone || $tonePhase !== 'held') return 0;
    // Approximate from centsSamples length (each sample = 50ms)
    const heldMs = $centsSamples.length * 50;
    const targetMs = tone.durationSec * 1000;
    return Math.min(1, heldMs / targetMs);
  });
</script>

{#if $sessionActive}
  <div class="session-view">
    <!-- Progress bar -->
    <div class="session-progress-bar">
      <div class="session-progress-fill" style="width: {progress * 100}%"></div>
    </div>

    <!-- Top bar -->
    <div class="session-top-bar">
      <div class="session-steps">
        {#if $sessionPlan}
          {#each $sessionPlan.exercises as ex, i}
            <span class="session-step" class:active={i === $exerciseIndex} class:done={i < $exerciseIndex}>
              {$t(ex.nameKey)}
            </span>
          {/each}
        {/if}
      </div>
      <div class="session-timer">{fmtTime($elapsedSeconds)}</div>
    </div>

    <!-- Content -->
    <div class="session-content">
      <!-- Main pitch area -->
      <div class="session-main">
        {#if $sessionPhase === 'completed'}
          <div class="session-complete">
            <div class="complete-icon">
              <svg viewBox="0 0 24 24" width="48" height="48"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--green)"/></svg>
            </div>
            <h2 class="complete-title">{$t('session.session_complete')}</h2>
            <div class="complete-stats">
              {#each $toneResults as r}
                <div class="complete-tone">
                  <span class="tone-name">{r.target.note}{r.target.octave}</span>
                  <span class="tone-cents" class:good={r.passed}>{r.passed ? fmtCents(r.avgCents) + 'ct' : '--'}</span>
                </div>
              {/each}
            </div>
          </div>

        {:else if $sessionPhase === 'between_exercises'}
          <div class="session-complete">
            <div class="complete-icon">
              <svg viewBox="0 0 24 24" width="40" height="40"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="var(--green)"/></svg>
            </div>
            <h2 class="complete-title">{$t('session.exercise_complete')}</h2>
            <div class="complete-stats">
              {#each $toneResults as r}
                <div class="complete-tone">
                  <span class="tone-name">{r.target.note}{r.target.octave}</span>
                  <span class="tone-cents" class:good={r.passed}>{r.passed ? fmtCents(r.avgCents) + 'ct' : '--'}</span>
                </div>
              {/each}
            </div>
          </div>

        {:else}
          <!-- Active exercise -->
          <div class="pitch-area">
            <div class="pitch-info">
              {#if $currentNote && ($tonePhase === 'detecting' || $tonePhase === 'held')}
                <div class="note-big">{$currentNote}</div>
                <div class="hz-label">{$currentFrequency.toFixed(1)} Hz</div>
              {:else if tone}
                <div class="note-big target">{tone.note}<sup>{tone.octave}</sup></div>
                <div class="hz-label">{$t('session.waiting_for_tone')}</div>
              {/if}
            </div>
            <PitchMeter
              cents={$currentCents}
              active={$tonePhase === 'detecting' || $tonePhase === 'held'}
            />
          </div>

          <!-- Cent display -->
          <div class="cent-display">
            {#if $tonePhase === 'detecting' || $tonePhase === 'held'}
              <span class="cent-num" class:good={Math.abs($currentCents) <= 5} class:warn={Math.abs($currentCents) > 5 && Math.abs($currentCents) <= 15} class:bad={Math.abs($currentCents) > 15}>
                {fmtCents($currentCents)}
              </span>
              <span class="cent-unit">ct</span>
            {/if}
          </div>

          <!-- Hold progress bar (visible when held) -->
          {#if $tonePhase === 'held' && tone}
            <div class="hold-bar-wrap">
              <div class="hold-bar">
                <div class="hold-fill" style="width: {holdProgress * 100}%"></div>
              </div>
              <div class="hold-label">
                {$t('session.tone_held')} {Math.round(holdProgress * tone.durationSec)}s / {tone.durationSec}s
              </div>
            </div>
          {/if}

          <!-- Phase hint -->
          {#if $tonePhase === 'waiting'}
            <div class="phase-hint">{$t('session.waiting_for_tone')}</div>
            <!-- Audio level indicator -->
            <div class="level-bars">
              {#each Array(5) as _, i}
                <div class="level-bar" class:active={$audioLevel > (i + 1) * 0.04}></div>
              {/each}
            </div>
          {:else if $tonePhase === 'detecting'}
            <div class="phase-hint">{$t('session.detecting')}</div>
          {/if}

          <!-- Stability graph -->
          <StabilityGraph samples={$centsSamples} />
        {/if}
      </div>

      <!-- Sidebar panel -->
      <div class="session-sidebar-panel">
        {#if exercise && $sessionPhase === 'running'}
          <div class="task-section">
            <div class="task-label">{$t('session.task')}</div>
            {#if tone}
              <div class="task-text">
                {$t('session.hold_tone')} {tone.durationSec} {$t('session.seconds')}.
              </div>
            {/if}
          </div>

          <!-- Listen button (placeholder) -->
          <button class="listen-btn" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
            {$t('session.listen')}
          </button>

          <!-- Tone list -->
          <div class="tone-section">
            <div class="tone-list-label">{$t('session.tones')}</div>
            <div class="tone-list">
              {#each exercise.tones as t, i}
                {@const result = $toneResults[i]}
                <div class="tone-item" class:current={i === $toneIndex} class:done={i < $toneIndex || result?.passed} class:upcoming={i > $toneIndex}>
                  <span class="tone-dot">
                    {#if result?.passed}
                      <svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 10.8L3.2 8l-.9.9L6 12.6l8-8-.9-.9L6 10.8z" fill="var(--green)"/></svg>
                    {:else if i === $toneIndex}
                      <span class="dot-active"></span>
                    {:else}
                      <span class="dot-empty"></span>
                    {/if}
                  </span>
                  <span class="tone-name">{t.note}{t.octave}</span>
                  {#if result}
                    <span class="tone-cents-small" class:good={result.passed}>{fmtCents(result.avgCents)}ct</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Stats -->
          <div class="sidebar-stats">
            <div class="stat-item">
              <div class="stat-label">{$t('session.accuracy')}</div>
              <div class="stat-value">
                {#if $toneResults.length > 0}
                  {Math.round(($toneResults.filter(r => r.passed).length / $toneResults.length) * 100)}%
                {:else}
                  --
                {/if}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">{$t('session.stability')}</div>
              <div class="stat-value">
                {#if $toneResults.length > 0}
                  ±{Math.round($toneResults.reduce((s, r) => s + r.stability, 0) / $toneResults.length)}ct
                {:else}
                  --
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="session-controls">
      <button class="ctrl-btn" onclick={() => stopSession()}>{$t('session.done')}</button>
      <div class="ctrl-group">
        {#if $sessionPhase === 'between_exercises'}
          <button class="ctrl-btn" onclick={() => repeatExercise()}>{$t('session.repeat')}</button>
          <button class="ctrl-btn accent" onclick={() => nextExercise()}>{$t('session.next')}</button>
        {:else if $sessionPhase === 'completed'}
          <button class="ctrl-btn accent" onclick={() => stopSession()}>{$t('session.done')}</button>
        {:else}
          <button class="ctrl-btn" onclick={() => togglePause()}>
            {$sessionPhase === 'paused' ? $t('session.resume') : $t('session.pause')}
          </button>
          <button class="ctrl-btn" onclick={() => skipTone()}>{$t('session.skip')}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .session-view {
    position: fixed; inset: 0; background: var(--bg);
    z-index: 1000; display: flex; flex-direction: column;
    transition: background 0.3s;
  }

  /* ── Progress bar ── */
  .session-progress-bar { height: 3px; background: var(--surface-2); }
  .session-progress-fill {
    height: 100%; background: var(--accent); border-radius: 0 2px 2px 0;
    transition: width 0.3s;
  }

  /* ── Top bar ── */
  .session-top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 28px; background: var(--bg-solid); border-bottom: 1px solid var(--border);
  }
  .session-steps { display: flex; gap: 16px; font-size: 12px; color: var(--text-3); }
  .session-step.active { color: var(--text); font-weight: 600; }
  .session-step.done { color: var(--green); }
  .session-timer { font-size: 13px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }

  /* ── Content layout ── */
  .session-content { flex: 1; display: flex; overflow: hidden; }

  .session-main {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px; background: var(--bg-solid); gap: 8px;
  }

  .session-sidebar-panel {
    width: 280px; padding: 28px 24px; background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 24px;
    overflow-y: auto;
  }

  /* ── Pitch area ── */
  .pitch-area {
    display: flex; align-items: center; gap: 40px;
  }

  .pitch-info { text-align: center; }

  .note-big {
    font-size: 80px; font-weight: 900; letter-spacing: -3px; line-height: 1;
    color: var(--text);
  }
  .note-big.target { color: var(--text-3); }
  .note-big sup { font-size: 32px; font-weight: 600; }

  .hz-label { font-size: 13px; color: var(--text-3); margin-top: 6px; }

  /* ── Cent display ── */
  .cent-display { display: flex; align-items: baseline; gap: 4px; margin-top: 8px; }
  .cent-num { font-size: 32px; font-weight: 700; letter-spacing: -1px; color: var(--green); }
  .cent-num.good { color: var(--green); }
  .cent-num.warn { color: var(--amber); }
  .cent-num.bad { color: var(--red); }
  .cent-unit { font-size: 11px; color: var(--text-3); }

  /* ── Hold progress bar ── */
  .hold-bar-wrap { width: 100%; max-width: 340px; margin-top: 16px; }
  .hold-bar {
    width: 100%; height: 5px; background: var(--surface-2); border-radius: 3px; overflow: hidden;
  }
  .hold-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, var(--accent), var(--green));
    transition: width 0.15s;
  }
  .hold-label {
    font-size: 11px; color: var(--text-3); text-align: center; margin-top: 6px;
    font-variant-numeric: tabular-nums;
  }

  /* ── Phase hints + level bars ── */
  .phase-hint { font-size: 13px; color: var(--text-3); margin-top: 12px; }

  .level-bars { display: flex; gap: 4px; margin-top: 12px; }
  .level-bar {
    width: 4px; height: 24px; border-radius: 2px;
    background: var(--surface-2); transition: background 0.1s;
  }
  .level-bar.active { background: var(--accent); }

  /* ── Session complete ── */
  .session-complete {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  .complete-icon { opacity: 0.9; }
  .complete-title { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .complete-stats { display: flex; gap: 20px; margin-top: 8px; }
  .complete-tone { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .complete-tone .tone-name { font-size: 14px; font-weight: 600; }
  .complete-tone .tone-cents { font-size: 12px; color: var(--text-3); }
  .complete-tone .tone-cents.good { color: var(--green); }

  /* ── Sidebar: Task section ── */
  .task-section { display: flex; flex-direction: column; gap: 6px; }
  .task-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px;
  }
  .task-text { font-size: 14px; color: var(--text-2); line-height: 1.5; }

  /* ── Listen button ── */
  .listen-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-3); font-family: inherit;
    font-size: 12px; cursor: not-allowed; opacity: 0.5;
  }

  /* ── Tone list ── */
  .tone-section { display: flex; flex-direction: column; gap: 8px; }
  .tone-list-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px;
  }
  .tone-list { display: flex; flex-direction: column; gap: 6px; }

  .tone-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 8px; font-size: 13px;
    color: var(--text-3); transition: all 0.15s;
  }
  .tone-item.current {
    background: var(--accent-soft); color: var(--text); font-weight: 600;
  }
  .tone-item.done { color: var(--text-2); }

  .tone-dot { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; }
  .dot-active {
    width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
    box-shadow: 0 0 8px var(--accent-soft);
  }
  .dot-empty {
    width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid var(--text-3);
  }

  .tone-item .tone-name { flex: 1; }
  .tone-cents-small { font-size: 11px; color: var(--text-3); }
  .tone-cents-small.good { color: var(--green); }

  /* ── Sidebar stats ── */
  .sidebar-stats {
    display: flex; gap: 16px; margin-top: auto; padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .stat-item { flex: 1; }
  .stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }

  /* ── Controls ── */
  .session-controls {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px; background: var(--bg-solid); border-top: 1px solid var(--border);
  }
  .ctrl-btn {
    padding: 8px 18px; border-radius: 9px; border: 1px solid var(--border);
    background: var(--bg-solid); color: var(--text-2); font-family: inherit;
    font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }
  .ctrl-btn:hover { background: var(--surface-hover); color: var(--text); }
  .ctrl-btn.accent {
    background: var(--accent); color: white; border-color: var(--accent);
  }
  .ctrl-btn.accent:hover { filter: brightness(1.1); }
  .ctrl-group { display: flex; gap: 8px; }

  /* ── Mobile: hide sidebar ── */
  @media (max-width: 768px) {
    .session-sidebar-panel { display: none; }
  }
</style>
