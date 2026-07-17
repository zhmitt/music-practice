<script lang="ts">
  import { t } from '$lib/i18n';
  import { parseMusicXML } from '$lib/import/musicxml';
  import {
    importedPieces,
    addImportedPiece,
    removeImportedPiece,
    type ImportedPiece,
  } from '$lib/stores/imports';
  import { startSession } from '$lib/stores/session';

  let fileInput: HTMLInputElement;
  let importError = $state('');

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    importError = '';

    try {
      const text = await file.text();
      const result = parseMusicXML(text);

      if (result.exercise.tones.length === 0) {
        importError = $t('import.no_notes');
        return;
      }

      const piece: ImportedPiece = {
        id: `import_${Date.now()}`,
        title: result.title,
        noteCount: result.noteCount,
        importedAt: new Date().toISOString().slice(0, 10),
        exercise: result.exercise,
      };

      addImportedPiece(piece);
    } catch {
      importError = $t('import.parse_error');
    }

    // Reset so the same file can be re-imported
    input.value = '';
  }

  function practicePiece(piece: ImportedPiece) {
    startSession({
      exercises: [piece.exercise],
      totalMinutes: Math.max(5, Math.ceil((piece.noteCount * 3) / 60)),
    });
  }
</script>

<div class="import-panel">
  <div class="import-header">
    <div class="import-title">{$t('import.title')}</div>
    <button class="import-btn" onclick={() => fileInput.click()}>
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
      {$t('import.add_file')}
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".xml,.musicxml"
      onchange={handleFileSelect}
      class="hidden-input"
    />
  </div>

  {#if importError}
    <div class="import-error">{importError}</div>
  {/if}

  {#if $importedPieces.length > 0}
    <div class="piece-list">
      {#each $importedPieces as piece (piece.id)}
        <div class="piece-item">
          <div class="piece-info">
            <div class="piece-title">{piece.title}</div>
            <div class="piece-meta">
              {piece.noteCount}
              {$t('import.notes')} &mdash; {piece.importedAt}
            </div>
          </div>
          <div class="piece-actions">
            <button class="piece-play-btn" onclick={() => practicePiece(piece)} title="Practice">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
              </svg>
            </button>
            <button
              class="piece-del-btn"
              onclick={() => removeImportedPiece(piece.id)}
              title="Delete"
            >
              <svg viewBox="0 0 24 24" width="12" height="12">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="import-empty">{$t('import.empty')}</p>
  {/if}
</div>

<style>
  .import-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .import-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .import-title {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .import-btn {
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
  .import-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  .hidden-input {
    display: none;
  }

  .import-error {
    font-size: 11px;
    color: var(--red);
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
  }

  .piece-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .piece-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    transition: border-color 0.15s;
  }
  .piece-item:hover {
    border-color: var(--text-3);
  }

  .piece-info {
    flex: 1;
    min-width: 0;
  }
  .piece-title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .piece-meta {
    font-size: 10px;
    color: var(--text-3);
    margin-top: 2px;
  }

  .piece-actions {
    display: flex;
    gap: 6px;
    margin-left: 12px;
  }

  .piece-play-btn,
  .piece-del-btn {
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
  .piece-play-btn:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
  }
  .piece-del-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--red);
    border-color: var(--red);
  }

  .import-empty {
    font-size: 12px;
    color: var(--text-3);
    text-align: center;
    padding: 20px 0;
    margin: 0;
  }
</style>
