<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '$lib/styles/global.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomBar from '$lib/components/BottomBar.svelte';
  import SessionOverlay from '$lib/components/SessionOverlay.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import { initTheme } from '$lib/stores/theme';
  import { sessionActive, sessionPaused } from '$lib/stores/navigation';
  import { onboardingVisible, checkOnboardingCompleted } from '$lib/stores/onboarding';
  import { sessionPhase, stopSession, togglePause, skipTone, nextExercise, repeatExercise } from '$lib/stores/session';

  let { children } = $props();

  onMount(() => {
    initTheme();
    if (!checkOnboardingCompleted()) {
      onboardingVisible.set(true);
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    // Suppress shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    let isSession = false;
    const unsub = sessionActive.subscribe(v => { isSession = v; });
    unsub();

    if (isSession) {
      let phase = 'running';
      const unsub2 = sessionPhase.subscribe(v => { phase = v; });
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
</style>
