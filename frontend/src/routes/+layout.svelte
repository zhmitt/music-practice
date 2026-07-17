<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '$lib/styles/global.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomBar from '$lib/components/BottomBar.svelte';
  import SessionOverlay from '$lib/components/SessionOverlay.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import { initTheme } from '$lib/stores/theme';
  import { sessionActive } from '$lib/stores/navigation';
  import { onboardingVisible, checkOnboardingCompleted, loadProfile } from '$lib/stores/onboarding';
  import {
    sessionPhase,
    stopSession,
    togglePause,
    skipTone,
    nextExercise,
    repeatExercise,
  } from '$lib/stores/session';
  import { initDb, persistenceStatus, retryLastPersistence } from '$lib/db';
  import { loadHistory } from '$lib/stores/history';
  import { loadStudentName } from '$lib/stores/sharing';
  import { loadAssignments } from '$lib/stores/assignments';
  import { loadImportedPieces } from '$lib/stores/imports';
  import { loadLocale, t } from '$lib/i18n';
  import { loadNotePreferences } from '$lib/stores/notePreferences';
  import {
    audioCaptureStatus,
    restartPreferredAudioCapture,
    refreshAudioRuntimeStatus,
  } from '$lib/stores/audioPreferences';
  import { runRuntimeSmokeIfRequested } from '$lib/smoke/sqliteRuntimeSmoke';

  let { children } = $props();

  onMount(async () => {
    const runtimeSmoke = await runRuntimeSmokeIfRequested();
    if (runtimeSmoke) return;
    await initDb();

    // Load all persisted data from SQLite (or localStorage fallback)
    await Promise.all([
      loadProfile(),
      loadHistory(),
      loadStudentName(),
      loadAssignments(),
      loadImportedPieces(),
      loadLocale(),
      loadNotePreferences(),
    ]);

    // initTheme reads from the kv store and sets up the subscriber
    await initTheme();

    if (!checkOnboardingCompleted()) {
      onboardingVisible.set(true);
    }
  });

  onMount(() => {
    const timer = setInterval(() => void refreshAudioRuntimeStatus(), 1000);
    return () => clearInterval(timer);
  });

  function handleKeydown(e: KeyboardEvent) {
    // Suppress shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    let isSession = false;
    const unsub = sessionActive.subscribe((v) => {
      isSession = v;
    });
    unsub();

    if (isSession) {
      let phase = 'running';
      const unsub2 = sessionPhase.subscribe((v) => {
        phase = v;
      });
      unsub2();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (phase === 'between_exercises') {
            nextExercise();
          } else {
            skipTone();
          }
          break;
        case 'Escape':
          e.preventDefault();
          stopSession();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (phase === 'between_exercises') {
            repeatExercise();
          }
          break;
      }
    } else {
      if (e.key === 'Escape') {
        e.preventDefault();
        goto('/');
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app">
  <Sidebar />
  <Header />
  <main class="main">
    {@render children()}
  </main>
</div>

<BottomBar />
<SessionOverlay />
<Onboarding />
<Settings />

{#if $persistenceStatus.degraded}
  <aside class="persistence-warning" role="status" aria-live="polite">
    <span>{$t('persistence.warning')}</span>
    {#if $persistenceStatus.retryAvailable}
      <button type="button" onclick={() => void retryLastPersistence()}>
        {$t('persistence.retry')}
      </button>
    {/if}
  </aside>
{/if}

{#if $audioCaptureStatus.error}
  <aside class="persistence-warning audio-warning" role="alert">
    <span>Audio unavailable: {$audioCaptureStatus.error.message}</span>
    <button type="button" onclick={() => void restartPreferredAudioCapture()}>Retry</button>
  </aside>
{/if}

<style>
  .app {
    display: grid;
    grid-template-columns: 56px 1fr;
    grid-template-rows: 52px 1fr;
    height: 100vh;
  }

  @media (max-width: 1024px) {
    .app {
      grid-template-columns: 1fr;
      padding-bottom: 52px;
    }
  }

  .main {
    overflow-y: auto;
    padding: 24px 28px;
  }

  .persistence-warning {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 10000;
    display: flex;
    max-width: min(420px, calc(100vw - 32px));
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    color: var(--text-primary);
    background: var(--surface-raised);
    border: 1px solid var(--warning, #d99b2b);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
  }

  .persistence-warning button {
    flex: none;
    padding: 6px 10px;
    color: var(--surface-base, #111);
    background: var(--warning, #d99b2b);
    border: 0;
    border-radius: 6px;
    cursor: pointer;
  }

  .audio-warning {
    bottom: 76px;
  }

  @media (max-width: 768px) {
    .main {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    .main {
      padding: 12px 10px;
    }
  }
</style>
