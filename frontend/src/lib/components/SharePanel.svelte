<script lang="ts">
  import { t } from '$lib/i18n';
  import { studentName, saveStudentName } from '$lib/stores/sharing';
  import { generateProgressReport, exportAsJSON } from '$lib/export/progressReport';

  let name = $state($studentName);
  let period = $state(30);
  let exported = $state(false);

  function handleExport() {
    saveStudentName(name);
    const report = generateProgressReport(name, period);
    exportAsJSON(report);
    exported = true;
    setTimeout(() => { exported = false; }, 2000);
  }

  function handleNameChange(e: Event) {
    name = (e.target as HTMLInputElement).value;
    saveStudentName(name);
  }
</script>

<div class="share-panel">
  <div class="share-label">{$t('share.title')}</div>

  <div class="share-field">
    <label class="field-label">{$t('share.student_name')}</label>
    <input
      type="text"
      class="share-input"
      value={name}
      oninput={handleNameChange}
      placeholder={$t('share.name_placeholder')}
    />
  </div>

  <div class="share-field">
    <label class="field-label">{$t('share.period')}</label>
    <div class="period-pills">
      <button class="pill" class:active={period === 7} onclick={() => period = 7}>7 {$t('progress.days')}</button>
      <button class="pill" class:active={period === 30} onclick={() => period = 30}>30 {$t('progress.days')}</button>
      <button class="pill" class:active={period === 90} onclick={() => period = 90}>90 {$t('progress.days')}</button>
    </div>
  </div>

  <p class="share-desc">{$t('share.desc')}</p>

  <button class="export-btn" onclick={handleExport}>
    <svg viewBox="0 0 24 24" width="14" height="14">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
    {$t('share.export_report')}
  </button>

  {#if exported}
    <div class="export-flash">{$t('share.exported')}</div>
  {/if}
</div>

<style>
  .share-panel { display: flex; flex-direction: column; gap: 12px; }

  .share-label {
    font-size: 10px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 1px;
  }

  .share-field { display: flex; flex-direction: column; gap: 4px; }

  .field-label { font-size: 11px; color: var(--text-2); }

  .share-input {
    padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-family: inherit;
    font-size: 13px; outline: none; transition: border-color 0.15s;
  }
  .share-input:focus { border-color: var(--accent); }
  .share-input::placeholder { color: var(--text-3); }

  .period-pills { display: flex; gap: 6px; }

  .pill {
    padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-2); font-family: inherit;
    font-size: 11px; cursor: pointer; transition: all 0.15s;
  }
  .pill:hover { background: var(--surface-hover); }
  .pill.active {
    background: var(--accent-soft); color: var(--accent);
    border-color: var(--accent); font-weight: 600;
  }

  .share-desc { font-size: 11px; color: var(--text-3); line-height: 1.4; margin: 0; }

  .export-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; border-radius: 10px; border: 1px solid var(--accent);
    background: var(--accent-soft); color: var(--text); font-family: inherit;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    width: fit-content;
  }
  .export-btn:hover { background: var(--accent); color: white; }

  .export-flash {
    font-size: 11px; color: var(--green); font-weight: 600;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
