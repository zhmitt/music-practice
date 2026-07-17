<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    getStreak,
    getAvgAccuracy,
    getNoteTendencies,
    getRecentSessions,
    getDailyAggregates,
    getSessionCount,
    getTotalMinutes,
    historyVersion,
  } from '$lib/stores/history';
  import TrendChart from '$lib/components/TrendChart.svelte';

  // ── Period selector ────────────────────────────────────────────────────────

  type Period = 7 | 30 | null;
  let period: Period = $state(30);

  // ── Derived data — recomputed whenever period changes ─────────────────────

  let aggregates = $derived.by(() => {
    $historyVersion;
    return getDailyAggregates(period);
  });
  let sessionCount = $derived.by(() => {
    $historyVersion;
    return getSessionCount(period);
  });
  let totalMinutes = $derived.by(() => {
    $historyVersion;
    return getTotalMinutes(period);
  });
  let avgAccuracy = $derived.by(() => {
    $historyVersion;
    return getAvgAccuracy(period ?? 9999);
  });

  // Chart series extracted from aggregates
  let accuracyData = $derived(aggregates.filter((d) => d.sessions > 0).map((d) => d.accuracy));
  let activityData = $derived(aggregates.map((d) => d.sessions));

  // Stats that are period-independent
  let streak = $derived.by(() => {
    $historyVersion;
    return getStreak();
  });
  let weakSpots = $derived.by(() => {
    $historyVersion;
    return getNoteTendencies(30).slice(0, 5);
  });
  let diary = $derived.by(() => {
    $historyVersion;
    return getRecentSessions(15);
  });
  let nextFocus = $derived.by((): { key: string; params: Record<string, string> } => {
    $historyVersion;

    if (getSessionCount(30) === 0) {
      return { key: 'progress.next_focus_first', params: {} };
    }
    if (weakSpots.length > 0 && Math.abs(weakSpots[0].avgCents) > 10) {
      return {
        key: 'progress.next_focus_weak',
        params: { note: weakSpots[0].note },
      };
    }
    if (avgAccuracy < 0.6) {
      return { key: 'progress.next_focus_basics', params: {} };
    }
    if (streak >= 3) {
      return {
        key: 'progress.next_focus_streak',
        params: { days: String(streak) },
      };
    }
    return { key: 'progress.next_focus_continue', params: {} };
  });

  // ── Formatters ─────────────────────────────────────────────────────────────

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

  function formatText(key: string, params: Record<string, string>): string {
    let text = $t(key);
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(`{${paramKey}}`, value);
    }
    return text;
  }
</script>

<div class="progress-view">
  <!-- Period selector -->
  <div class="period-row">
    <button
      class="period-pill"
      class:active={period === 7}
      onclick={() => {
        period = 7;
      }}>{$t('progress.period.7')}</button
    >
    <button
      class="period-pill"
      class:active={period === 30}
      onclick={() => {
        period = 30;
      }}>{$t('progress.period.30')}</button
    >
    <button
      class="period-pill"
      class:active={period === null}
      onclick={() => {
        period = null;
      }}>{$t('progress.period.all')}</button
    >
  </div>

  <div class="card focus-card">
    <div class="focus-card-label">{$t('progress.next_focus')}</div>
    <div class="focus-card-text">{formatText(nextFocus.key, nextFocus.params)}</div>
  </div>

  <!-- Overview cards -->
  <div class="section-label">{$t('progress.overview')}</div>
  <div class="overview-row">
    <div class="card overview-card">
      <div class="ov-value">{sessionCount}</div>
      <div class="ov-label">{$t('progress.sessions')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value">
        {totalMinutes}<span class="ov-unit">{$t('progress.minutes_short')}</span>
      </div>
      <div class="ov-label">{$t('progress.practice_time')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value">{sessionCount > 0 ? `${Math.round(avgAccuracy * 100)}%` : '--'}</div>
      <div class="ov-label">{$t('progress.avg_accuracy')}</div>
    </div>
    <div class="card overview-card">
      <div class="ov-value streak-value">{streak}</div>
      <div class="ov-label">{$t('progress.streak')}</div>
    </div>
  </div>

  <!-- Trend charts -->
  <div class="section-label">{$t('progress.trends')}</div>
  <div class="trends-row">
    <!-- Accuracy trend -->
    <div class="card trend-card">
      <div class="trend-header">
        <span class="trend-title">{$t('progress.accuracy_trend')}</span>
        {#if accuracyData.length > 0}
          <span class="trend-value" style="color: var(--green)">
            {Math.round(accuracyData[accuracyData.length - 1] * 100)}%
          </span>
        {/if}
      </div>
      {#if accuracyData.length > 1}
        <TrendChart
          data={accuracyData}
          type="line"
          color="var(--green)"
          height={72}
          showZero={false}
        />
      {:else}
        <div class="chart-empty">{$t('progress.diary_empty')}</div>
      {/if}
    </div>

    <!-- Session activity -->
    <div class="card trend-card">
      <div class="trend-header">
        <span class="trend-title">{$t('progress.session_activity')}</span>
        {#if sessionCount > 0}
          <span class="trend-value" style="color: var(--accent)">
            {sessionCount}
          </span>
        {/if}
      </div>
      {#if activityData.some((v) => v > 0)}
        <TrendChart
          data={activityData}
          type="bar"
          color="var(--accent)"
          height={72}
          showZero={true}
        />
      {:else}
        <div class="chart-empty">{$t('progress.diary_empty')}</div>
      {/if}
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
              <span
                class="weak-cents"
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
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Period selector ── */
  .period-row {
    display: flex;
    gap: 6px;
  }
  .focus-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
  }
  .focus-card-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .focus-card-text {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.6;
  }

  .period-pill {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s;
  }

  .period-pill:hover {
    color: var(--text-1);
    border-color: var(--text-3);
  }

  .period-pill.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  /* ── Section labels ── */
  .section-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Overview ── */
  .overview-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .overview-card {
    padding: 20px;
    text-align: center;
  }

  .ov-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
  }

  .ov-unit {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-3);
    margin-left: 2px;
  }

  .ov-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 6px;
  }

  .streak-value {
    background: linear-gradient(135deg, var(--accent), var(--green));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ── Trend charts ── */
  .trends-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .trend-card {
    padding: 18px 18px 14px;
  }

  .trend-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .trend-title {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .trend-value {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .chart-empty {
    font-size: 12px;
    color: var(--text-3);
    padding: 16px 0;
    text-align: center;
  }

  /* ── Two-column grid ── */
  .progress-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .progress-section {
    padding: 22px;
  }

  .section-title {
    font-size: 11px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--text-3);
  }

  /* ── Weak spots ── */
  .weak-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .weak-item {
    display: grid;
    grid-template-columns: 48px 1fr 56px;
    align-items: center;
    gap: 10px;
  }

  .weak-note {
    font-size: 14px;
    font-weight: 600;
  }

  .weak-bar-wrap {
    height: 5px;
    background: var(--surface-2);
    border-radius: 3px;
    overflow: hidden;
  }

  .weak-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }

  .weak-bar.sharp {
    background: var(--red);
  }
  .weak-bar.flat {
    background: var(--amber);
  }

  .weak-cents {
    font-size: 12px;
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

  /* ── Diary ── */
  .diary-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .diary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .diary-date {
    font-size: 13px;
    font-weight: 500;
  }

  .diary-details {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-3);
  }

  .diary-accuracy {
    color: var(--green);
    font-weight: 500;
  }

  .diary-cents {
    font-variant-numeric: tabular-nums;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .overview-row {
      grid-template-columns: repeat(2, 1fr);
    }
    .trends-row {
      grid-template-columns: 1fr;
    }
    .progress-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .overview-card {
      padding: 14px 10px;
    }
    .ov-value {
      font-size: 22px;
    }
    .progress-section {
      padding: 16px;
    }
    .trend-card {
      padding: 14px 12px;
    }
    .diary-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
</style>
