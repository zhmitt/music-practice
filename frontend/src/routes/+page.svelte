<script lang="ts">
  import { t } from '$lib/i18n';
  import { getUserProfile } from '$lib/stores/onboarding';
  import { generateSessionPlan } from '$lib/exercises/sessionPlan';
  import { startSession } from '$lib/stores/session';

  function handleStartSession() {
    const profile = getUserProfile();
    if (!profile) return; // shouldn't happen after onboarding
    const plan = generateSessionPlan(profile);
    startSession(plan);
  }

  // Get session minutes from profile for display
  const profile = getUserProfile();
  const sessionMinutes = profile?.minutesPerSession ?? 15;
</script>

<div class="dashboard">
  <div class="card session-card">
    <div class="session-header">
      <div>
        <div class="session-label">{$t('dashboard.today_session')}</div>
        <div class="session-title">{$t('dashboard.today_session')}</div>
      </div>
      <div class="session-duration">{sessionMinutes}<span>min</span></div>
    </div>

    <button class="start-btn" onclick={handleStartSession}>
      <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      {$t('dashboard.start_session')}
    </button>
    <div class="session-customize">
      <button class="customize-link">{$t('dashboard.customize')}</button>
    </div>
  </div>

  <div class="card streak-card">
    <div class="streak-num">0</div>
    <div class="streak-sub">{$t('dashboard.days_streak')}</div>
    <div class="days-row">
      <div class="day">Mo</div><div class="day">Di</div><div class="day">Mi</div>
      <div class="day">Do</div><div class="day">Fr</div><div class="day">Sa</div><div class="day">So</div>
    </div>
  </div>

  <div class="card week-card">
    <div class="week-header">
      <span class="week-label">{$t('dashboard.this_week')}</span>
      <span class="week-pct">0%</span>
    </div>
    <div class="week-track"><div class="week-fill" style="width: 0%"></div></div>
  </div>
</div>

<style>
  .dashboard {
    display: grid; gap: 12px;
    grid-template-columns: 1fr 320px;
    grid-template-rows: auto auto;
  }

  .session-card { grid-column: 1; grid-row: 1 / 3; padding: 28px; }
  .streak-card { grid-column: 2; grid-row: 1; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .week-card { grid-column: 2; grid-row: 2; padding: 22px; }

  .session-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .session-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .session-title { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .session-duration { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: var(--accent); }
  .session-duration span { font-size: 13px; font-weight: 400; color: var(--text-3); margin-left: 2px; }

  .start-btn {
    width: 100%; padding: 13px; border: none; border-radius: 12px;
    background: var(--accent); color: white; font-family: inherit;
    font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: -0.2px;
    transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .start-btn:hover { filter: brightness(1.1); box-shadow: 0 4px 24px rgba(99,102,241,0.3); transform: translateY(-1px); }
  .start-btn svg { width: 14px; height: 14px; fill: currentColor; stroke: none; }

  .session-customize { text-align: center; margin-top: 10px; }
  .customize-link { font-size: 11px; color: var(--text-3); border: none; background: none; cursor: pointer; font-family: inherit; }
  .customize-link:hover { color: var(--text-2); }

  .streak-num {
    font-size: 44px; font-weight: 900; letter-spacing: -2px; line-height: 1;
    background: linear-gradient(135deg, var(--accent), var(--green));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .streak-sub { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 3px; margin-bottom: 14px; }
  .days-row { display: flex; gap: 4px; }
  .day {
    width: 30px; height: 30px; border-radius: 8px; font-size: 9px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; color: var(--text-3);
  }

  .week-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .week-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; }
  .week-pct { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
  .week-track { height: 5px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
  .week-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--green)); }

  @media (max-width: 1024px) {
    .dashboard { grid-template-columns: 1fr; }
    .session-card { grid-column: 1; grid-row: auto; }
    .streak-card { grid-column: 1; grid-row: auto; }
    .week-card { grid-column: 1; grid-row: auto; }
  }
</style>
