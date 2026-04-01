<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    getStreak, getWeekMinutes, getAvgAccuracy,
    getNoteTendencies, getRecentSessions,
    getHistory,
  } from '$lib/stores/history';

  function fmtCents(c: number): string {
    const rounded = Math.round(c);
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function fmtDuration(seconds: number): string {
    const m = Math.round(seconds / 60);
    return `${m} ${$t('progress.minutes_short')}`;
  }

  // Reactive data — re-read on mount
  const history = getHistory();
  const streak = getStreak();
  const weekMinutes = getWeekMinutes();
  const avgAccuracy = getAvgAccuracy(30);
  const weakSpots = getNoteTendencies(30).slice(0, 5);
  const diary = getRecentSessions(15);
  const totalSessions = history.length;
</script>

<div class="progress-view">
  <!-- Overview cards -->
  <div class="overview-label">{$t('progress.overview')}</div>
  <div class="overview-row">
    <div class="card overview-card">
      <div class="ov-value">{totalSessions}</div>
      <div class="ov-label">{$t('progress.sessions')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value">{weekMinutes}<span class="ov-unit">{$t('progress.minutes_short')}</span></div>
      <div class="ov-label">{$t('progress.practice_time')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value">{totalSessions > 0 ? `${Math.round(avgAccuracy * 100)}%` : '--'}</div>
      <div class="ov-label">{$t('progress.avg_accuracy')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value streak-value">{streak}</div>
      <div class="ov-label">{$t('progress.streak')}</div>
    </div>
  </div>

  <!-- Two-column: weak spots + diary -->
  <div class="progress-grid">
    <!-- Weak spots -->
    <div class="card progress-section">
      <div class="section-title">{$t('progress.weak_spots')}</div>
      {#if weakSpots.length > 0}
        <div class="weak-list">
          {#each weakSpots as ws}
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
              <span class="weak-cents"
                class:good={Math.abs(ws.avgCents) <= 5}
                class:warn={Math.abs(ws.avgCents) > 5 && Math.abs(ws.avgCents) <= 15}
                class:bad={Math.abs(ws.avgCents) > 15}
              >
                {fmtCents(ws.avgCents)}ct
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-hint">{$t('progress.weak_spots_empty')}</p>
      {/if}
    </div>

    <!-- Diary -->
    <div class="card progress-section">
      <div class="section-title">{$t('progress.diary')}</div>
      {#if diary.length > 0}
        <div class="diary-list">
          {#each diary as session}
            <div class="diary-item">
              <div class="diary-date">{fmtDate(session.date)}</div>
              <div class="diary-details">
                <span class="diary-duration">{fmtDuration(session.durationSeconds)}</span>
                <span class="diary-accuracy">{Math.round(session.accuracy * 100)}%</span>
                <span class="diary-cents">±{Math.round(session.avgCents)}ct</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-hint">{$t('progress.diary_empty')}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .progress-view {
    display: flex; flex-direction: column; gap: 16px;
  }

  /* ── Overview ── */
  .overview-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px;
  }

  .overview-row {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }

  .overview-card { padding: 20px; text-align: center; }

  .ov-value {
    font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1;
  }
  .ov-unit { font-size: 12px; font-weight: 400; color: var(--text-3); margin-left: 2px; }
  .ov-label {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px; margin-top: 6px;
  }

  .streak-value {
    background: linear-gradient(135deg, var(--accent), var(--green));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  /* ── Two-column grid ── */
  .progress-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }

  .progress-section { padding: 22px; }

  .section-title {
    font-size: 11px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 16px;
  }

  .empty-hint { font-size: 13px; color: var(--text-3); }

  /* ── Weak spots ── */
  .weak-list { display: flex; flex-direction: column; gap: 10px; }

  .weak-item {
    display: grid; grid-template-columns: 48px 1fr 56px;
    align-items: center; gap: 10px;
  }

  .weak-note { font-size: 14px; font-weight: 600; }

  .weak-bar-wrap {
    height: 5px; background: var(--surface-2); border-radius: 3px;
    overflow: hidden;
  }
  .weak-bar {
    height: 100%; border-radius: 3px; transition: width 0.3s;
  }
  .weak-bar.sharp { background: var(--red); }
  .weak-bar.flat { background: var(--amber); }

  .weak-cents { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
  .weak-cents.good { color: var(--green); }
  .weak-cents.warn { color: var(--amber); }
  .weak-cents.bad { color: var(--red); }

  /* ── Diary ── */
  .diary-list { display: flex; flex-direction: column; gap: 8px; }

  .diary-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; border-radius: 10px; background: var(--surface);
    border: 1px solid var(--border);
  }

  .diary-date { font-size: 13px; font-weight: 500; }
  .diary-details { display: flex; gap: 12px; font-size: 12px; color: var(--text-3); }
  .diary-accuracy { color: var(--green); font-weight: 500; }
  .diary-cents { font-variant-numeric: tabular-nums; }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .overview-row { grid-template-columns: repeat(2, 1fr); }
    .progress-grid { grid-template-columns: 1fr; }
  }
</style>
