<script lang="ts">
  /**
   * Teacher View — load and visualize student progress report JSON exports.
   *
   * Accepts multiple student files simultaneously and shows them in a
   * two-panel layout: a student list on the left and a detail panel on the
   * right with stats overview, accuracy / activity trend charts, weak spots,
   * and a recent-sessions table.
   */
  import { t } from '$lib/i18n';
  import TrendChart from '$lib/components/TrendChart.svelte';

  /**
   * Matches the shape produced by the ProgressReport exporter.
   * Kept local so this page compiles independently of progressReport.ts.
   */
  interface ProgressReport {
    version: '1.0';
    exportedAt: string;
    studentName: string;
    profile: {
      instrument: string;
      experience: string;
      daysPerWeek: number;
      minutesPerSession: number;
    } | null;
    summary: {
      totalSessions: number;
      totalMinutes: number;
      streak: number;
      avgAccuracy: number;
      periodDays: number;
    };
    weakSpots: Array<{ note: string; avgCents: number; count: number }>;
    dailyActivity: Array<{ date: string; sessions: number; minutes: number; accuracy: number }>;
    recentSessions: Array<{
      date: string;
      durationSeconds: number;
      exerciseType: string;
      accuracy: number;
      avgCents: number;
    }>;
  }

  let students = $state<ProgressReport[]>([]);
  let selectedIdx = $state(-1);
  let loadError = $state('');
  let fileInput: HTMLInputElement;

  /**
   * Parse one or more JSON files dropped via the file picker.
   * Validates the `version` field and skips duplicates (same name + same
   * exportedAt timestamp).
   *
   * @param e - The native change event from the hidden file input.
   */
  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    loadError = '';

    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.version !== '1.0' || !data.studentName || !data.summary) {
          loadError = $t('teacher.invalid_file');
          continue;
        }
        // Skip exact duplicates (same name + same export timestamp).
        const exists = students.some(
          (s) => s.studentName === data.studentName && s.exportedAt === data.exportedAt
        );
        if (!exists) {
          students = [...students, data as ProgressReport];
          if (selectedIdx === -1) selectedIdx = 0;
        }
      } catch {
        loadError = $t('teacher.parse_error');
      }
    }
    // Reset the input so the same file can be re-loaded after removal.
    input.value = '';
  }

  /**
   * Remove a student from the list and adjust the selection index.
   *
   * @param idx - Index of the student to remove.
   */
  function removeStudent(idx: number) {
    students = students.filter((_, i) => i !== idx);
    if (selectedIdx >= students.length) selectedIdx = students.length - 1;
  }

  /**
   * Format a cents deviation with explicit sign.
   *
   * @param c - Cents value (positive = sharp, negative = flat).
   * @returns Formatted string like "+12" or "-5".
   */
  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  /**
   * Format an ISO date string as a short localised date.
   *
   * @param d - ISO 8601 date string.
   * @returns e.g. "15 Mar".
   */
  function fmtDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  let selected = $derived(
    selectedIdx >= 0 && selectedIdx < students.length ? students[selectedIdx] : null
  );

  // Chart data derived from the selected student's daily activity.
  let accuracyData = $derived(
    selected ? selected.dailyActivity.map((d) => d.accuracy * 100) : []
  );
  let activityData = $derived(selected ? selected.dailyActivity.map((d) => d.sessions) : []);
</script>

<div class="teacher-view">
  <div class="teacher-header">
    <h1>{$t('teacher.title')}</h1>
    <button class="load-btn" onclick={() => fileInput.click()}>
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2" />
        <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
        <polyline points="9 15 12 12 15 15" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
      {$t('teacher.load_report')}
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json"
      multiple
      onchange={handleFileSelect}
      style="display:none"
    />
  </div>

  {#if loadError}
    <div class="load-error">{loadError}</div>
  {/if}

  {#if students.length === 0}
    <div class="empty-state">
      <p>{$t('teacher.empty')}</p>
    </div>
  {:else}
    <div class="teacher-content">
      <!-- Student list sidebar -->
      <div class="student-list">
        {#each students as s, i}
          <button
            class="student-item"
            class:active={selectedIdx === i}
            onclick={() => (selectedIdx = i)}
          >
            <div class="student-name">{s.studentName}</div>
            <div class="student-meta">{s.profile?.instrument ?? '?'} — {fmtDate(s.exportedAt)}</div>
          </button>
        {/each}
      </div>

      <!-- Selected student detail panel -->
      {#if selected}
        <div class="student-detail">
          <div class="detail-header">
            <h2>{selected.studentName}</h2>
            <button class="remove-btn" aria-label="Remove student" onclick={() => removeStudent(selectedIdx)}>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>

          <!-- Overview stat cards -->
          <div class="overview-row">
            <div class="card ov-card">
              <div class="ov-value">{selected.summary.totalSessions}</div>
              <div class="ov-label">{$t('progress.sessions')}</div>
            </div>
            <div class="card ov-card">
              <div class="ov-value">
                {selected.summary.totalMinutes}<span class="ov-unit">min</span>
              </div>
              <div class="ov-label">{$t('progress.practice_time')}</div>
            </div>
            <div class="card ov-card">
              <div class="ov-value">{Math.round(selected.summary.avgAccuracy * 100)}%</div>
              <div class="ov-label">{$t('progress.avg_accuracy')}</div>
            </div>
            <div class="card ov-card">
              <div class="ov-value streak">{selected.summary.streak}</div>
              <div class="ov-label">{$t('progress.streak')}</div>
            </div>
          </div>

          <!-- Trend charts -->
          <div class="trends-row">
            <div class="card trend-card">
              <div class="trend-label">{$t('progress.accuracy_trend')}</div>
              {#if accuracyData.length > 0}
                <TrendChart data={accuracyData} type="line" color="var(--green)" height={70} />
              {/if}
            </div>
            <div class="card trend-card">
              <div class="trend-label">{$t('progress.session_activity')}</div>
              {#if activityData.length > 0}
                <TrendChart data={activityData} type="bar" color="var(--accent)" height={70} />
              {/if}
            </div>
          </div>

          <!-- Weak spots -->
          {#if selected.weakSpots.length > 0}
            <div class="card weak-card">
              <div class="weak-title">{$t('progress.weak_spots')}</div>
              <div class="weak-list">
                {#each selected.weakSpots.slice(0, 6) as ws}
                  <div class="weak-item">
                    <span class="weak-note">{ws.note}</span>
                    <div class="weak-bar-wrap">
                      <div
                        class="weak-bar"
                        class:sharp={ws.avgCents > 0}
                        class:flat={ws.avgCents < 0}
                        style="width: {Math.min(100, Math.abs(ws.avgCents) * 2)}%"
                      ></div>
                    </div>
                    <span
                      class="weak-cents"
                      class:good={Math.abs(ws.avgCents) <= 5}
                      class:warn={Math.abs(ws.avgCents) > 5 && Math.abs(ws.avgCents) <= 15}
                      class:bad={Math.abs(ws.avgCents) > 15}
                    >{fmtCents(ws.avgCents)}ct</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Recent sessions table -->
          {#if selected.recentSessions.length > 0}
            <div class="card sessions-card">
              <div class="sessions-title">{$t('teacher.recent_sessions')}</div>
              <div class="sessions-list">
                {#each selected.recentSessions as s}
                  <div class="session-row">
                    <span class="s-date">{fmtDate(s.date)}</span>
                    <span class="s-type">{s.exerciseType}</span>
                    <span class="s-duration">{Math.round(s.durationSeconds / 60)}min</span>
                    <span class="s-accuracy" class:good={s.accuracy >= 0.7}>
                      {Math.round(s.accuracy * 100)}%
                    </span>
                    <span class="s-cents">~{Math.round(s.avgCents)}ct</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .teacher-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Header ────────────────────────────────────────────── */
  .teacher-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .teacher-header h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
  }

  .load-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .load-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  /* ── Error / empty ─────────────────────────────────────── */
  .load-error {
    font-size: 11px;
    color: var(--red);
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: var(--text-3);
    font-size: 14px;
  }

  /* ── Two-column layout ─────────────────────────────────── */
  .teacher-content {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 16px;
  }

  /* ── Student list ──────────────────────────────────────── */
  .student-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .student-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }

  .student-item:hover {
    background: var(--surface-hover);
  }

  .student-item.active {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--text);
  }

  .student-name {
    font-size: 13px;
    font-weight: 600;
  }

  .student-meta {
    font-size: 10px;
    color: var(--text-3);
  }

  /* ── Detail panel ──────────────────────────────────────── */
  .student-detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detail-header h2 {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin: 0;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--red);
  }

  /* ── Overview cards ────────────────────────────────────── */
  .overview-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .ov-card {
    padding: 14px;
    text-align: center;
  }

  .ov-value {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -1px;
  }

  .ov-unit {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-3);
    margin-left: 2px;
  }

  .ov-label {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  .streak {
    background: linear-gradient(135deg, var(--accent), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Trend charts ──────────────────────────────────────── */
  .trends-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .trend-card {
    padding: 16px;
  }

  .trend-label {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  /* ── Weak spots ────────────────────────────────────────── */
  .weak-card {
    padding: 16px;
  }

  .weak-title {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .weak-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .weak-item {
    display: grid;
    grid-template-columns: 48px 1fr 50px;
    align-items: center;
    gap: 8px;
  }

  .weak-note {
    font-size: 13px;
    font-weight: 600;
  }

  .weak-bar-wrap {
    height: 4px;
    background: var(--surface-2);
    border-radius: 2px;
    overflow: hidden;
  }

  .weak-bar {
    height: 100%;
    border-radius: 2px;
  }

  .weak-bar.sharp {
    background: var(--red);
  }

  .weak-bar.flat {
    background: var(--amber);
  }

  .weak-cents {
    font-size: 11px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .weak-cents.good {
    color: var(--green);
  }

  .weak-cents.warn {
    color: var(--amber);
  }

  .weak-cents.bad {
    color: var(--red);
  }

  /* ── Recent sessions ───────────────────────────────────── */
  .sessions-card {
    padding: 16px;
  }

  .sessions-title {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .session-row {
    display: grid;
    grid-template-columns: 70px 80px 50px 45px 50px;
    gap: 8px;
    font-size: 11px;
    color: var(--text-2);
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
  }

  .session-row:last-child {
    border-bottom: none;
  }

  .s-accuracy.good {
    color: var(--green);
    font-weight: 500;
  }

  .s-cents {
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }

  /* ── Responsive ────────────────────────────────────────── */
  @media (max-width: 768px) {
    .teacher-content {
      grid-template-columns: 1fr;
    }

    .overview-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .trends-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .teacher-header h1 { font-size: 15px; }
    .ov-card { padding: 10px 8px; }
    .ov-value { font-size: 18px; }
    .session-row {
      grid-template-columns: 60px 1fr 44px 40px 44px;
      gap: 6px;
    }
  }
</style>
