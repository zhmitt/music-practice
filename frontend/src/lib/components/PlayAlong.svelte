<script lang="ts">
  /**
   * PlayAlong — self-contained play-along component.
   *
   * Shows scrolling staff notation while the user plays along with their
   * instrument. Reads live pitch from the Tauri backend (same `get_pitch`
   * invoke as the ToneLab). Each note gets a time-window based on the BPM;
   * detection within that window with acceptable intonation marks the note
   * as passed.
   *
   * State machine: idle → countdown → playing → complete
   *
   * @example
   * <PlayAlong tones={scaleTones} title="Bb Major" onComplete={handleResults} />
   */

  import type { ToneTarget } from '$lib/types/session';
  import { t } from '$lib/i18n';
  import StaffNotation from './StaffNotation.svelte';

  /** Per-note outcome recorded after the play-along finishes. */
  export interface PlayAlongResult {
    /** The note that was expected. */
    target: ToneTarget;
    /** Whether pitch matching the target was detected at all. */
    detected: boolean;
    /** Mean cent deviation across all matching samples (0 when not detected). */
    avgCents: number;
    /** True when detected and |avgCents| <= PASS_CENTS_THRESHOLD. */
    passed: boolean;
  }

  interface Props {
    /** Ordered list of notes to play through. */
    tones: ToneTarget[];
    /** Optional heading shown above the staff. */
    title?: string;
    /** Called once when all notes have been evaluated. */
    onComplete?: (results: PlayAlongResult[]) => void;
  }

  let { tones, title = '', onComplete }: Props = $props();

  // ── Constants ────────────────────────────────────────────────────────────────

  /** Intonation tolerance in cents to count a note as passed. */
  const PASS_CENTS_THRESHOLD = 15;
  /** Minimum pitch confidence from backend to accept a sample. */
  const MIN_CONFIDENCE = 0.4;
  /** How often (ms) we poll the backend for a pitch sample during play. */
  const TICK_MS = 50;
  /**
   * Horizontal pixel offset of note index 0 in StaffNotation.
   * Must match START_X constant in StaffNotation.svelte.
   */
  const STAFF_START_X = 50;
  /**
   * Horizontal pixels between consecutive notes in StaffNotation.
   * Must match NOTE_SPACING constant in StaffNotation.svelte.
   */
  const STAFF_NOTE_SPACING = 36;

  // ── State ────────────────────────────────────────────────────────────────────

  type Phase = 'idle' | 'countdown' | 'playing' | 'complete';

  let phase = $state<Phase>('idle');
  let bpm = $state(60);
  let playReference = $state(false);
  let currentIdx = $state(-1);
  let countdownNum = $state(3);
  let results = $state<PlayAlongResult[]>([]);

  // Per-note accumulator (mutated imperatively inside intervals/timeouts)
  let noteCentsSamples: number[] = [];
  let noteDetected = false;

  let tickInterval: ReturnType<typeof setInterval> | null = null;
  let advanceTimeout: ReturnType<typeof setTimeout> | null = null;

  let scrollContainer: HTMLDivElement | undefined = $state();

  // ── Derived ──────────────────────────────────────────────────────────────────

  /** Summary statistics once the play-along is complete. */
  let score = $derived.by(() => {
    if (results.length === 0) return { passed: 0, total: 0, pct: 0, avgAbsCents: 0 };
    const passed = results.filter(r => r.passed).length;
    const avgAbsCents = results.reduce((sum, r) => sum + Math.abs(r.avgCents), 0) / results.length;
    return {
      passed,
      total: results.length,
      pct: Math.round((passed / results.length) * 100),
      avgAbsCents,
    };
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Duration in milliseconds for one beat at the current BPM. */
  function beatDurationMs(): number {
    return (60 / bpm) * 1000;
  }

  /**
   * Duration the cursor stays on note at `idx`.
   * Scales with the note's durationSec so longer notes get more time,
   * with a minimum of one beat.
   */
  function noteDurationMs(idx: number): number {
    const noteDur = tones[idx]?.durationSec ?? 1;
    return beatDurationMs() * Math.max(1, noteDur / 2);
  }

  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  // ── Core logic ───────────────────────────────────────────────────────────────

  /** Scroll the staff container so the current note is roughly one-third from the left. */
  function scrollToNote(idx: number): void {
    if (!scrollContainer) return;
    const noteX = STAFF_START_X + idx * STAFF_NOTE_SPACING;
    const targetLeft = Math.max(0, noteX - scrollContainer.clientWidth / 3);
    scrollContainer.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }

  /** Play audio reference for note at `idx` via Web Audio. */
  async function playReferenceNote(idx: number): Promise<void> {
    try {
      const { playNote } = await import('$lib/audio/playNote');
      const dur = Math.min(noteDurationMs(idx) * 0.8, 1500);
      playNote(tones[idx].note, tones[idx].octave, dur, 0.15);
    } catch {
      // Audio failure is non-fatal
    }
  }

  /** Poll the Tauri backend for the current pitch and update per-note accumulators. */
  async function tickPitch(): Promise<void> {
    if (phase !== 'playing' || currentIdx < 0 || currentIdx >= tones.length) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // get_pitch returns { note_name, octave, cent_deviation, confidence } or null
      const pitch = await invoke<{
        note_name: string;
        octave: number;
        cent_deviation: number;
        confidence: number;
      } | null>('get_pitch');

      if (pitch && pitch.confidence >= MIN_CONFIDENCE) {
        const target = tones[currentIdx];
        if (pitch.note_name === target.note && pitch.octave === target.octave) {
          noteDetected = true;
          noteCentsSamples.push(pitch.cent_deviation);
        }
      }
    } catch {
      // Backend may not be active (desktop required); fail silently
    }
  }

  /** Commit the current note's result and move to the next note (or finish). */
  function advanceNote(): void {
    const avg =
      noteCentsSamples.length > 0
        ? noteCentsSamples.reduce((a, b) => a + b, 0) / noteCentsSamples.length
        : 0;

    results = [
      ...results,
      {
        target: tones[currentIdx],
        detected: noteDetected,
        avgCents: avg,
        passed: noteDetected && Math.abs(avg) <= PASS_CENTS_THRESHOLD,
      },
    ];

    const next = currentIdx + 1;
    if (next >= tones.length) {
      finishPlayAlong();
    } else {
      startNote(next);
    }
  }

  /** Initialise state for note at `idx` and schedule its advance. */
  function startNote(idx: number): void {
    currentIdx = idx;
    noteCentsSamples = [];
    noteDetected = false;

    scrollToNote(idx);

    if (playReference) {
      playReferenceNote(idx);
    }

    advanceTimeout = setTimeout(advanceNote, noteDurationMs(idx));
  }

  /** Begin the full play-along sequence. */
  async function startPlayAlong(): Promise<void> {
    // Reset all state
    results = [];
    currentIdx = -1;
    phase = 'countdown';

    // 3-2-1 countdown
    for (let i = 3; i >= 1; i--) {
      countdownNum = i;
      await sleep(700);
    }

    // Attempt to start Tauri audio (desktop only; silently skip in browser)
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('start_audio', { deviceName: null });
    } catch {
      // Not available in browser dev — that's fine
    }

    phase = 'playing';
    startNote(0);
    tickInterval = setInterval(tickPitch, TICK_MS);
  }

  /** Clean up timers and stop audio. */
  function teardown(): void {
    if (tickInterval !== null) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    if (advanceTimeout !== null) {
      clearTimeout(advanceTimeout);
      advanceTimeout = null;
    }
    // Stop Tauri audio capture
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('stop_audio'))
      .catch(() => {});
  }

  /** Called when all notes have been processed. */
  function finishPlayAlong(): void {
    teardown();
    phase = 'complete';
    onComplete?.(results);
  }

  /** User-initiated stop; resets to idle. */
  function stopPlayAlong(): void {
    teardown();
    phase = 'idle';
    currentIdx = -1;
    results = [];
  }
</script>

<div class="playalong">
  {#if title}
    <div class="pa-title">{title}</div>
  {/if}

  <!-- Scrolling staff notation -->
  <div class="pa-staff-wrap" bind:this={scrollContainer}>
    <StaffNotation {tones} currentIndex={phase === 'playing' ? currentIdx : -1} />

    <!-- Per-note result dots rendered above the SVG while playing or complete -->
    {#if (phase === 'playing' || phase === 'complete') && results.length > 0}
      <div class="pa-result-overlay" aria-hidden="true">
        {#each results as r, i}
          <div
            class="pa-dot"
            class:passed={r.passed}
            class:missed={!r.passed && r.detected}
            class:undetected={!r.detected}
            style="left: {STAFF_START_X + i * STAFF_NOTE_SPACING}px"
          ></div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- ── IDLE ── -->
  {#if phase === 'idle'}
    <div class="pa-controls">
      <div class="pa-setting">
        <span class="pa-label">{$t('playalong.tempo')}</span>
        <input type="range" min="40" max="120" bind:value={bpm} class="pa-slider" />
        <span class="pa-bpm">{bpm}</span>
      </div>

      <div class="pa-setting">
        <label class="pa-label pa-label--check">
          <input type="checkbox" bind:checked={playReference} class="pa-check" />
          {$t('playalong.reference')}
        </label>
      </div>

      <button class="pa-start-btn" onclick={startPlayAlong}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
        </svg>
        {$t('playalong.start')}
      </button>
    </div>

  <!-- ── COUNTDOWN ── -->
  {:else if phase === 'countdown'}
    <div class="pa-countdown" role="status" aria-live="polite">{countdownNum}</div>

  <!-- ── PLAYING ── -->
  {:else if phase === 'playing'}
    <div class="pa-playing-bar">
      <span class="pa-progress" aria-live="polite">
        {currentIdx + 1} / {tones.length}
      </span>
      <button class="pa-stop-btn" onclick={stopPlayAlong}>{$t('playalong.stop')}</button>
    </div>

  <!-- ── COMPLETE ── -->
  {:else if phase === 'complete'}
    <div class="pa-results">
      <div class="pa-score-row">
        <div class="pa-score-big">{score.pct}%</div>
        <div class="pa-score-detail">
          {score.passed}/{score.total} &mdash; ~{Math.round(score.avgAbsCents)}ct
        </div>
      </div>

      <div class="pa-note-results" role="list">
        {#each results as r}
          <span
            class="pa-note-chip"
            class:passed={r.passed}
            class:missed={!r.passed && r.detected}
            class:undetected={!r.detected}
            role="listitem"
          >
            {r.target.note}{r.target.octave}
            {#if r.detected}
              <small>{fmtCents(r.avgCents)}ct</small>
            {:else}
              <small>--</small>
            {/if}
          </span>
        {/each}
      </div>

      <div class="pa-result-actions">
        <button class="pa-start-btn" onclick={startPlayAlong}>{$t('playalong.again')}</button>
        <button class="pa-stop-btn" onclick={stopPlayAlong}>{$t('playalong.close')}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .playalong {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
  }

  /* ── Title ── */
  .pa-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
  }

  /* ── Staff scroll area ── */
  .pa-staff-wrap {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 0;
    scrollbar-width: thin;
  }

  /* ── Result dots above completed notes ── */
  .pa-result-overlay {
    position: absolute;
    top: 4px;
    left: 0;
    pointer-events: none;
  }

  .pa-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    top: 0;
    transform: translateX(-4px);
    transition: background 0.2s;
  }

  .pa-dot.passed    { background: var(--green); }
  .pa-dot.missed    { background: var(--amber); }
  .pa-dot.undetected { background: var(--red); opacity: 0.45; }

  /* ── Idle controls ── */
  .pa-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pa-setting {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pa-label {
    font-size: 11px;
    color: var(--text-3);
    min-width: 60px;
    flex-shrink: 0;
  }

  .pa-label--check {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    min-width: unset;
  }

  .pa-slider {
    flex: 1;
    accent-color: var(--accent);
  }

  .pa-bpm {
    font-size: 12px;
    font-weight: 600;
    width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--text-2);
  }

  .pa-check {
    accent-color: var(--accent);
    cursor: pointer;
  }

  /* ── Shared button base ── */
  .pa-start-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: 10px;
    border: none;
    background: var(--accent);
    color: white;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.15s;
  }

  .pa-start-btn:hover {
    filter: brightness(1.1);
  }

  .pa-stop-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .pa-stop-btn:hover {
    background: var(--surface-hover);
  }

  /* ── Countdown ── */
  .pa-countdown {
    font-size: 48px;
    font-weight: 900;
    text-align: center;
    color: var(--accent);
    padding: 20px 0;
    letter-spacing: -2px;
  }

  /* ── Playing bar ── */
  .pa-playing-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pa-progress {
    font-size: 12px;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }

  /* ── Results ── */
  .pa-results {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .pa-score-row {
    text-align: center;
  }

  .pa-score-big {
    font-size: 36px;
    font-weight: 900;
    letter-spacing: -2px;
    color: var(--green);
  }

  .pa-score-detail {
    font-size: 12px;
    color: var(--text-3);
  }

  .pa-note-results {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
  }

  .pa-note-chip {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--surface-2);
    color: var(--text-3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .pa-note-chip.passed    { background: rgba(34,197,94,0.1); color: var(--green); }
  .pa-note-chip.missed    { background: rgba(245,158,11,0.1); color: var(--amber); }
  .pa-note-chip.undetected { opacity: 0.45; }

  .pa-note-chip small {
    font-size: 9px;
  }

  .pa-result-actions {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .pa-result-actions .pa-start-btn {
    flex: 1;
  }

  .pa-result-actions .pa-stop-btn {
    flex: 1;
  }
</style>
