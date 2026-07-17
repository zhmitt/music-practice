<script lang="ts">
  import SingleNoteStaff from './SingleNoteStaff.svelte';
  import {
    convertToneForDisplay,
    formatToneLabel,
    type StoredPitchMode,
  } from '$lib/music/noteUtils';
  import { selectedInstrument } from '$lib/stores/onboarding';
  import { noteVisualMode, pitchDisplayMode } from '$lib/stores/notePreferences';

  interface Props {
    note: string;
    octave: number;
    sourceMode?: StoredPitchMode;
    size?: 'sm' | 'md' | 'lg';
    accent?: boolean;
    muted?: boolean;
    showOctave?: boolean;
  }

  let {
    note,
    octave,
    sourceMode = 'written',
    size = 'md',
    accent = false,
    muted = false,
    showOctave = true,
  }: Props = $props();

  let displayedTone = $derived.by(() => {
    const targetMode = $pitchDisplayMode === 'concert' ? 'concert' : 'written';
    return convertToneForDisplay({ note, octave }, $selectedInstrument, sourceMode, targetMode);
  });

  let label = $derived(formatToneLabel(displayedTone.note, displayedTone.octave, showOctave));
</script>

<div
  class="practice-note"
  class:note-only={$noteVisualMode === 'note'}
  class:notation-only={$noteVisualMode === 'notation'}
  class:hybrid={$noteVisualMode === 'hybrid'}
  class:small={size === 'sm'}
  class:medium={size === 'md'}
  class:large={size === 'lg'}
  class:accent
  class:muted
>
  {#if $noteVisualMode !== 'notation'}
    <span class="note-text">
      {displayedTone.note}
      {#if showOctave}
        <sup>{displayedTone.octave}</sup>
      {/if}
    </span>
  {/if}

  {#if $noteVisualMode !== 'note'}
    <span class="notation-wrap" aria-label={label}>
      <SingleNoteStaff
        note={displayedTone.note}
        octave={displayedTone.octave}
        {size}
        {accent}
        {muted}
      />
    </span>
  {/if}
</div>

<style>
  .practice-note {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .practice-note.hybrid {
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  .practice-note.notation-only {
    gap: 0;
  }

  .practice-note.small.hybrid {
    gap: 2px;
  }

  .note-text {
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    color: inherit;
    white-space: nowrap;
  }

  .small .note-text {
    font-size: 15px;
  }

  .medium .note-text {
    font-size: 24px;
  }

  .large .note-text {
    font-size: 42px;
  }

  .note-text sup {
    font-size: 0.48em;
    font-weight: 600;
    margin-left: 1px;
  }

  .accent {
    color: var(--accent);
  }

  .muted {
    color: var(--text-3);
  }

  .notation-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
