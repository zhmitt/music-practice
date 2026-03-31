<script lang="ts">
  import { sessionActive, sessionPaused } from '$lib/stores/navigation';
  import { t } from '$lib/i18n';
</script>

{#if $sessionActive}
  <div class="session-view">
    <div class="session-progress-bar"><div class="session-progress-fill"></div></div>
    <div class="session-top-bar">
      <div class="session-steps">
        <span class="session-step active">{$t('session.task')} 1</span>
      </div>
      <div class="session-timer">00:00</div>
    </div>

    <div class="session-content">
      <div class="session-main">
        <p class="session-placeholder">{$t('placeholder.coming_soon')}</p>
      </div>
    </div>

    <div class="session-controls">
      <button class="ctrl-btn" onclick={() => sessionActive.set(false)}>{$t('session.done')}</button>
      <div class="ctrl-group">
        <button class="ctrl-btn" onclick={() => sessionPaused.update(v => !v)}>
          {$sessionPaused ? $t('session.resume') : $t('session.pause')}
        </button>
        <button class="ctrl-btn">{$t('session.next')}</button>
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

  .session-progress-bar { height: 3px; background: var(--surface-2); }
  .session-progress-fill { height: 100%; width: 25%; background: var(--accent); border-radius: 0 2px 2px 0; }

  .session-top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 28px; background: var(--bg-solid); border-bottom: 1px solid var(--border);
  }
  .session-steps { display: flex; gap: 16px; font-size: 12px; color: var(--text-3); }
  .session-step.active { color: var(--text); font-weight: 600; }
  .session-timer { font-size: 13px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }

  .session-content { flex: 1; display: flex; overflow: hidden; }
  .session-main {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px; background: var(--bg-solid);
  }
  .session-placeholder { font-size: 14px; color: var(--text-3); }

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
  .ctrl-group { display: flex; gap: 8px; }
</style>
