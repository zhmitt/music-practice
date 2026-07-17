<script lang="ts">
  import { t } from '$lib/i18n';
  import { createAssignment, exportAssignment } from '$lib/stores/assignments';
  import type { ExerciseDef, ToneTarget } from '$lib/types/session';

  let teacherName = $state('');
  let title = $state('');
  let description = $state('');
  let dueDate = $state('');
  let exported = $state(false);

  // Simple exercise builder: note sequence input
  let noteInput = $state('C4 D4 E4 F4 G4'); // space-separated notes like "Bb4 C5 D5"
  let duration = $state(4); // seconds per note
  let exerciseType = $state<'long_tones' | 'scale' | 'custom'>('custom');

  function parseNotes(input: string): ToneTarget[] {
    return input
      .trim()
      .split(/\s+/)
      .map((token) => {
        const match = token.match(/^([A-Gb#]+)(\d)$/);
        if (!match) return null;
        return { note: match[1], octave: parseInt(match[2]), durationSec: duration };
      })
      .filter((t): t is ToneTarget => t !== null);
  }

  function handleCreate() {
    const tones = parseNotes(noteInput);
    if (tones.length === 0 || !title.trim() || !teacherName.trim()) return;

    const exercise: ExerciseDef = {
      id: `teacher_exercise_${Date.now()}`,
      type: exerciseType,
      nameKey: 'session.exercise_custom',
      descriptionKey: 'session.play_imported',
      tones,
    };

    const assignment = createAssignment(teacherName, title, description, dueDate || null, [
      exercise,
    ]);

    exportAssignment(assignment);
    exported = true;
    setTimeout(() => {
      exported = false;
    }, 2000);
  }
</script>

<div class="creator-panel">
  <div class="creator-label">{$t('assignment.create_title')}</div>

  <div class="creator-field">
    <label class="field-label" for="assignment-teacher-name">{$t('assignment.teacher_name')}</label>
    <input
      id="assignment-teacher-name"
      type="text"
      class="creator-input"
      bind:value={teacherName}
      placeholder={$t('assignment.teacher_placeholder')}
    />
  </div>

  <div class="creator-field">
    <label class="field-label" for="assignment-title">{$t('assignment.assignment_title')}</label>
    <input
      id="assignment-title"
      type="text"
      class="creator-input"
      bind:value={title}
      placeholder={$t('assignment.title_placeholder')}
    />
  </div>

  <div class="creator-field">
    <label class="field-label" for="assignment-description">{$t('assignment.description')}</label>
    <input
      id="assignment-description"
      type="text"
      class="creator-input"
      bind:value={description}
      placeholder={$t('assignment.desc_placeholder')}
    />
  </div>

  <div class="creator-field">
    <label class="field-label" for="assignment-due-date">{$t('assignment.due_date')}</label>
    <input id="assignment-due-date" type="date" class="creator-input" bind:value={dueDate} />
  </div>

  <div class="creator-field">
    <label class="field-label" for="assignment-notes">{$t('assignment.notes')}</label>
    <input
      id="assignment-notes"
      type="text"
      class="creator-input mono"
      bind:value={noteInput}
      placeholder="C4 D4 E4 F4 G4"
    />
    <span class="field-hint">{$t('assignment.notes_hint')}</span>
  </div>

  <div class="creator-field">
    <div class="field-label" id="assignment-duration-label">{$t('assignment.hold_duration')}</div>
    <div class="dur-row" role="group" aria-labelledby="assignment-duration-label">
      {#each [2, 3, 4, 6, 8] as d}
        <button class="dur-pill" class:active={duration === d} onclick={() => (duration = d)}
          >{d}s</button
        >
      {/each}
    </div>
  </div>

  <button
    class="create-btn"
    onclick={handleCreate}
    disabled={!title.trim() || !teacherName.trim() || parseNotes(noteInput).length === 0}
  >
    <svg viewBox="0 0 24 24" width="14" height="14"
      ><path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      /></svg
    >
    {$t('assignment.create_export')}
  </button>

  {#if exported}
    <div class="creator-flash">{$t('assignment.created')}</div>
  {/if}
</div>

<style>
  .creator-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .creator-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .creator-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .field-label {
    font-size: 11px;
    color: var(--text-2);
  }
  .field-hint {
    font-size: 10px;
    color: var(--text-3);
  }

  .creator-input {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
  }
  .creator-input:focus {
    border-color: var(--accent);
  }
  .creator-input::placeholder {
    color: var(--text-3);
  }
  .creator-input.mono {
    font-family: monospace;
    letter-spacing: 0.5px;
  }

  .dur-row {
    display: flex;
    gap: 4px;
  }
  .dur-pill {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .dur-pill.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
  }
  .dur-pill:hover:not(.active) {
    background: var(--surface-hover);
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid var(--accent);
    background: var(--accent-soft);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .create-btn:hover:not(:disabled) {
    background: var(--accent);
    color: white;
  }
  .create-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .creator-flash {
    font-size: 11px;
    color: var(--green);
    font-weight: 600;
  }
</style>
