<script lang="ts">
  /**
   * EarTraining — sidebar panel for the Tone Lab ear-training mode.
   *
   * Hosts three sub-modes:
   *  - Interval Identification: hear two notes, click the interval name
   *  - Melodic Dictation: hear a melody, play it back on your instrument
   *  - Pitch Memory: hear a note, wait 3 s, play it from memory
   */
  import { t } from '$lib/i18n';
  import {
    earMode, earPhase, earResults, earCurrentQuestion, earCorrectAnswer,
    earMelodyNotes, earMelodyProgress, earFeedback,
    startIntervalId, answerIntervalId,
    startMelodicDictation, startPitchMemory,
    stopEarTraining, getEarScore, resetEarResults,
  } from '$lib/stores/earTraining';
  import { tonelabActive } from '$lib/stores/tonelab';

  /** Interval buttons shown during the Interval Identification answering phase. */
  const INTERVALS_FOR_BUTTONS = [
    { key: 'interval.unison',         label: 'P1' },
    { key: 'interval.major_second',   label: 'M2' },
    { key: 'interval.minor_third',    label: 'm3' },
    { key: 'interval.major_third',    label: 'M3' },
    { key: 'interval.perfect_fourth', label: 'P4' },
    { key: 'interval.perfect_fifth',  label: 'P5' },
    { key: 'interval.major_sixth',    label: 'M6' },
    { key: 'interval.octave',         label: 'P8' },
  ];

  type SubMode = 'interval_id' | 'melodic' | 'pitch_memory';
  let selectedMode: SubMode = $state('interval_id');

  /** Begin a fresh session in the currently selected sub-mode. */
  function handleStart(): void {
    resetEarResults();
    dispatchStart();
  }

  /** Start the next round without clearing the running score. */
  function handleNext(): void {
    dispatchStart();
  }

  function dispatchStart(): void {
    if (selectedMode === 'interval_id') startIntervalId();
    else if (selectedMode === 'melodic') startMelodicDictation();
    else startPitchMemory();
  }
</script>

<div class="ear-panel">
  <!-- Sub-mode selector -->
  <div class="ear-modes">
    <button
      class="ear-mode-btn"
      class:active={selectedMode === 'interval_id'}
      onclick={() => { selectedMode = 'interval_id'; stopEarTraining(); }}
    >
      {$t('ear.interval_id')}
    </button>
    <button
      class="ear-mode-btn"
      class:active={selectedMode === 'melodic'}
      onclick={() => { selectedMode = 'melodic'; stopEarTraining(); }}
    >
      {$t('ear.melodic')}
    </button>
    <button
      class="ear-mode-btn"
      class:active={selectedMode === 'pitch_memory'}
      onclick={() => { selectedMode = 'pitch_memory'; stopEarTraining(); }}
    >
      {$t('ear.pitch_memory')}
    </button>
  </div>

  <!-- Idle: description + start button -->
  {#if $earPhase === 'idle'}
    <p class="ear-desc">
      {#if selectedMode === 'interval_id'}
        {$t('ear.interval_id_desc')}
      {:else if selectedMode === 'melodic'}
        {$t('ear.melodic_desc')}
      {:else}
        {$t('ear.pitch_memory_desc')}
      {/if}
    </p>
    {#if $tonelabActive}
      <button class="ear-start-btn" onclick={handleStart}>{$t('ear.start')}</button>
    {:else}
      <p class="ear-hint">{$t('ear.activate_hint')}</p>
    {/if}

  <!-- Listening: playing the reference notes -->
  {:else if $earPhase === 'listening'}
    <div class="ear-status">
      <div class="ear-listening-anim"></div>
      <span>{$t('ear.listening')}</span>
    </div>

  <!-- Answering: user input phase -->
  {:else if $earPhase === 'answering'}
    <div class="ear-question">{$earCurrentQuestion}</div>

    {#if selectedMode === 'interval_id'}
      <div class="interval-buttons">
        {#each INTERVALS_FOR_BUTTONS as iv}
          <button class="iv-btn" onclick={() => answerIntervalId(iv.key)}>{iv.label}</button>
        {/each}
      </div>

    {:else if selectedMode === 'melodic'}
      <div class="melody-progress">
        {#each $earMelodyNotes as n, i}
          <span
            class="melody-dot"
            class:done={i < $earMelodyProgress}
            class:current={i === $earMelodyProgress}
          >
            {#if i < $earMelodyProgress}
              {n.note}{n.octave}
            {:else if i === $earMelodyProgress}
              ?
            {:else}
              --
            {/if}
          </span>
        {/each}
      </div>
      <p class="ear-hint">{$t('ear.play_melody')}</p>

    {:else}
      <div class="memory-question">?</div>
      <p class="ear-hint">{$t('ear.play_note')}</p>
    {/if}

  <!-- Result: feedback + score + next/stop -->
  {:else if $earPhase === 'result'}
    <div
      class="ear-feedback"
      class:correct={$earFeedback === 'correct'}
      class:wrong={$earFeedback === 'wrong'}
    >
      {#if $earFeedback === 'correct'}
        {$t('ear.correct')}
      {:else}
        {$t('ear.wrong')} — {$t($earCorrectAnswer)}
      {/if}
    </div>

    <div class="ear-score">
      {getEarScore().correct}/{getEarScore().total}
    </div>

    <div class="ear-dots">
      {#each $earResults as r}
        <span class="ear-dot" class:correct={r.correct} class:wrong={!r.correct}></span>
      {/each}
    </div>

    <div class="ear-actions">
      <button class="ear-next-btn" onclick={handleNext}>{$t('tonelab.target.next')}</button>
      <button class="ear-stop-btn" onclick={stopEarTraining}>{$t('tonelab.target.stop')}</button>
    </div>
  {/if}
</div>

<style>
  .ear-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  /* Sub-mode tabs */
  .ear-modes { display: flex; gap: 4px; width: 100%; }

  .ear-mode-btn {
    flex: 1;
    padding: 6px 4px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-3);
    font-family: inherit;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ear-mode-btn.active {
    background: var(--accent-soft);
    color: var(--text);
    border-color: var(--accent);
    font-weight: 600;
  }
  .ear-mode-btn:hover:not(.active) { background: var(--surface-hover); }

  /* Description + hint */
  .ear-desc {
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.4;
    text-align: center;
    margin: 0;
  }
  .ear-hint {
    font-size: 10px;
    color: var(--text-3);
    text-align: center;
    margin: 0;
  }

  /* Start button */
  .ear-start-btn {
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
    width: 100%;
  }
  .ear-start-btn:hover { background: var(--accent); color: white; }

  /* Listening animation */
  .ear-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--accent);
    font-size: 12px;
  }
  .ear-listening-anim {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse-dot 1s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }

  /* Question label */
  .ear-question {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  /* Interval answer grid */
  .interval-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    width: 100%;
  }
  .iv-btn {
    padding: 8px 4px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s;
  }
  .iv-btn:hover {
    background: var(--accent-soft);
    color: var(--text);
    border-color: var(--accent);
  }

  /* Melodic dictation progress row */
  .melody-progress { display: flex; gap: 6px; }

  .melody-dot {
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    background: var(--surface-2);
    color: var(--text-3);
  }
  .melody-dot.done    { background: var(--green); color: white; }
  .melody-dot.current { background: var(--accent-soft); color: var(--accent); }

  /* Pitch memory question mark */
  .memory-question {
    font-size: 36px;
    font-weight: 900;
    color: var(--accent);
  }

  /* Result feedback */
  .ear-feedback { font-size: 14px; font-weight: 700; }
  .ear-feedback.correct { color: var(--green); }
  .ear-feedback.wrong   { color: var(--red); }

  .ear-score {
    font-size: 16px;
    font-weight: 800;
    color: var(--green);
  }

  /* Result dots */
  .ear-dots { display: flex; gap: 4px; }
  .ear-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--surface-2);
  }
  .ear-dot.correct { background: var(--green); }
  .ear-dot.wrong   { background: var(--red); }

  /* Next / Stop actions */
  .ear-actions { display: flex; gap: 8px; width: 100%; }

  .ear-next-btn,
  .ear-stop-btn {
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
  .ear-next-btn {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .ear-next-btn:hover { filter: brightness(1.1); }
  .ear-stop-btn:hover { background: var(--surface-hover); }
</style>
