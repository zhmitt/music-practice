<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    assignments,
    importAssignment,
    removeAssignment,
    markAssignmentCompleted,
    parseAssignmentFile,
  } from '$lib/stores/assignments';
  import { startSession } from '$lib/stores/session';
  import type { Assignment } from '$lib/types/assignment';

  let fileInput: HTMLInputElement;
  let importError = $state('');

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    importError = '';

    try {
      const text = await file.text();
      const assignment = parseAssignmentFile(text);
      if (!assignment) {
        importError = $t('assignment.invalid');
        return;
      }
      if (assignment.exercises.length === 0) {
        importError = $t('assignment.no_exercises');
        return;
      }
      importAssignment(assignment);
    } catch {
      importError = $t('assignment.parse_error');
    }
    input.value = '';
  }

  function practiceAssignment(a: Assignment) {
    startSession({
      exercises: a.exercises,
      totalMinutes: Math.max(
        5,
        Math.ceil((a.exercises.reduce((s, ex) => s + ex.tones.length, 0) * 4) / 60),
      ),
    });
    // Mark as completed after starting
    markAssignmentCompleted(a.id);
  }

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  function fmtDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }
</script>

<div class="assignment-panel">
  <div class="assignment-header">
    <div class="assignment-title">{$t('assignment.title')}</div>
    <button class="assignment-import-btn" onclick={() => fileInput.click()}>
      <svg viewBox="0 0 24 24" width="14" height="14"
        ><path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        /><polyline
          points="14 2 14 8 20 8"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        /><line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" stroke-width="2" /><polyline
          points="9 15 12 12 15 15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        /></svg
      >
      {$t('assignment.import')}
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json"
      onchange={handleFileSelect}
      style="display:none"
    />
  </div>

  {#if importError}
    <div class="assignment-error">{importError}</div>
  {/if}

  {#if $assignments.length > 0}
    <div class="assignment-list">
      {#each $assignments as record}
        <div
          class="assignment-item"
          class:completed={record.completed}
          class:overdue={!record.completed && isOverdue(record.assignment.dueDate)}
        >
          <div class="assignment-info">
            <div class="assignment-name">
              {record.assignment.title}
              {#if record.completed}
                <svg viewBox="0 0 16 16" width="14" height="14" class="check-icon"
                  ><path
                    d="M6 10.8L3.2 8l-.9.9L6 12.6l8-8-.9-.9L6 10.8z"
                    fill="var(--green)"
                  /></svg
                >
              {/if}
            </div>
            <div class="assignment-meta">
              {record.assignment.teacherName}
              {#if record.assignment.dueDate}
                — {$t('assignment.due')} {fmtDate(record.assignment.dueDate)}
              {/if}
            </div>
            {#if record.assignment.description}
              <div class="assignment-desc">{record.assignment.description}</div>
            {/if}
          </div>
          <div class="assignment-actions">
            <button
              class="assignment-play-btn"
              aria-label={`${$t('assignment.practice')}: ${record.assignment.title}`}
              title={`${$t('assignment.practice')}: ${record.assignment.title}`}
              onclick={() => practiceAssignment(record.assignment)}
            >
              <svg viewBox="0 0 24 24" width="12" height="12"
                ><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" /></svg
              >
            </button>
            <button
              class="assignment-del-btn"
              aria-label={`${$t('assignment.delete')}: ${record.assignment.title}`}
              title={`${$t('assignment.delete')}: ${record.assignment.title}`}
              onclick={() => removeAssignment(record.assignment.id)}
            >
              <svg viewBox="0 0 24 24" width="12" height="12"
                ><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" /><line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="currentColor"
                  stroke-width="2"
                /></svg
              >
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="assignment-empty">{$t('assignment.empty')}</p>
  {/if}
</div>

<style>
  .assignment-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .assignment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .assignment-title {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .assignment-import-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .assignment-import-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  .assignment-error {
    font-size: 11px;
    color: var(--red);
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
  }

  .assignment-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .assignment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    transition: border-color 0.15s;
  }
  .assignment-item:hover {
    border-color: var(--text-3);
  }
  .assignment-item.completed {
    opacity: 0.6;
  }
  .assignment-item.overdue {
    border-color: var(--amber);
  }

  .assignment-info {
    flex: 1;
    min-width: 0;
  }
  .assignment-name {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .assignment-meta {
    font-size: 10px;
    color: var(--text-3);
    margin-top: 2px;
  }
  .assignment-desc {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 4px;
    line-height: 1.4;
  }

  .assignment-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .assignment-play-btn,
  .assignment-del-btn {
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
  .assignment-play-btn:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
  }
  .assignment-del-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--red);
    border-color: var(--red);
  }

  .assignment-empty {
    font-size: 12px;
    color: var(--text-3);
    text-align: center;
    padding: 16px 0;
    margin: 0;
  }
</style>
