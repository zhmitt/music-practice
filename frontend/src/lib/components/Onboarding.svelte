<script lang="ts">
  import { t } from '$lib/i18n';
  import {
    onboardingVisible,
    onboardingStep,
    selectedInstrument,
    selectedExperience,
    selectedDays,
    selectedMinutes,
    micGranted,
    micDenied,
    toneDetected,
    completeOnboarding,
    type Instrument,
    type ExperienceLevel,
  } from '$lib/stores/onboarding';

  // Pitch detection state for Screen 5
  let pitchNote = $state('--');
  let pitchHz = $state('---');
  let pitchCents = $state(0);
  let pitchConfidence = $state(0);
  let stableTime = $state(0);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const instruments: { id: Instrument; key: string }[] = [
    { id: 'horn_bb', key: 'ob.instrument.horn_bb' },
    { id: 'horn_f', key: 'ob.instrument.horn_f' },
    { id: 'double_horn', key: 'ob.instrument.double_horn' },
    { id: 'trumpet_bb', key: 'ob.instrument.trumpet_bb' },
    { id: 'clarinet_bb', key: 'ob.instrument.clarinet_bb' },
    { id: 'flute', key: 'ob.instrument.flute' },
    { id: 'trombone', key: 'ob.instrument.trombone' },
    { id: 'oboe', key: 'ob.instrument.oboe' },
  ];

  const experiences: { id: ExperienceLevel; key: string; subKey: string }[] = [
    { id: 'beginner_new', key: 'ob.experience.beginner_new', subKey: 'ob.experience.beginner_new_sub' },
    { id: 'beginner', key: 'ob.experience.beginner', subKey: 'ob.experience.beginner_sub' },
    { id: 'intermediate', key: 'ob.experience.intermediate', subKey: 'ob.experience.intermediate_sub' },
    { id: 'experienced', key: 'ob.experience.experienced', subKey: 'ob.experience.experienced_sub' },
  ];

  const dayOptions = [3, 4, 5, 6, 7];
  const minuteOptions = [10, 15, 20, 30];

  function next() {
    onboardingStep.update(s => Math.min(s + 1, 5));
  }

  function back() {
    onboardingStep.update(s => Math.max(s - 1, 1));
  }

  async function requestMicrophone() {
    try {
      // Try Tauri command first, fall back to browser API
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('start_audio', { deviceName: null });
      micGranted.set(true);
      micDenied.set(false);
      startPitchPolling();
    } catch {
      // Fallback: browser getUserMedia (for dev/preview)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        micGranted.set(true);
        micDenied.set(false);
        // No pitch polling in browser-only mode
      } catch {
        micGranted.set(false);
        micDenied.set(true);
      }
    }
  }

  function startPitchPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const pitch = await invoke('get_pitch') as any;
        if (pitch) {
          pitchNote = `${pitch.note_name}${pitch.octave}`;
          pitchHz = `${pitch.frequency_hz.toFixed(1)} Hz`;
          pitchCents = Math.round(pitch.cent_deviation);
          pitchConfidence = pitch.confidence;

          // Track stability: within +/-20 cents
          if (Math.abs(pitch.cent_deviation) <= 20) {
            stableTime += 50; // ~50ms per poll
            if (stableTime >= 1000) {
              toneDetected.set(true);
            }
          } else {
            stableTime = 0;
          }
        } else {
          pitchNote = '--';
          pitchHz = '---';
          pitchCents = 0;
          stableTime = 0;
        }
      } catch {
        // Not in Tauri context
      }
    }, 50);
  }

  function finish() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    completeOnboarding({
      instrument: $selectedInstrument,
      experience: $selectedExperience,
      daysPerWeek: $selectedDays,
      minutesPerSession: $selectedMinutes,
    });
  }

  // Compute pitch dot position (50% = center/in-tune, 0% = sharp top, 100% = flat bottom)
  function dotPosition(cents: number): number {
    // Clamp to +/-50 cents range
    const clamped = Math.max(-50, Math.min(50, cents));
    return 50 - clamped; // invert: sharp = up = lower %
  }

  function centColor(cents: number): string {
    const abs = Math.abs(cents);
    if (abs <= 5) return 'var(--green)';
    if (abs <= 15) return 'var(--amber)';
    return 'var(--red)';
  }
</script>

{#if $onboardingVisible}
  <div class="onboarding-overlay" role="dialog" aria-label="Onboarding">
    <div class="onboarding-container">

      {#if $onboardingStep > 1}
        <button class="ob-back" onclick={back} aria-label={$t('ob.back')}>
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      {/if}

      <!-- Screen 1: Welcome -->
      {#if $onboardingStep === 1}
        <div class="ob-screen">
          <div class="ob-logo">
            <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>
          </div>
          <div class="ob-headline">{$t('ob.headline')}</div>
          <div class="ob-subtitle">{$t('ob.subtitle')}</div>
          <button class="ob-cta" onclick={next}>
            {$t('ob.start')}
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      {/if}

      <!-- Screen 2: Instrument -->
      {#if $onboardingStep === 2}
        <div class="ob-screen">
          <div class="ob-heading">{$t('ob.instrument.title')}</div>
          <div class="ob-subheading">{$t('ob.instrument.subtitle')}</div>
          <div class="instrument-grid">
            {#each instruments as inst}
              <button
                class="instrument-card"
                class:selected={$selectedInstrument === inst.id}
                onclick={() => selectedInstrument.set(inst.id)}
              >
                <div class="instrument-icon">
                  <svg viewBox="0 0 28 28"><path d="M4 14c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10"/><circle cx="14" cy="14" r="3"/><path d="M14 4v4M14 18v2M4 14h4M20 14h4"/></svg>
                </div>
                <span class="instrument-name">{$t(inst.key)}</span>
              </button>
            {/each}
          </div>
          <button class="ob-cta" onclick={next}>
            {$t('ob.next')}
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      {/if}

      <!-- Screen 3: Experience -->
      {#if $onboardingStep === 3}
        <div class="ob-screen">
          <div class="ob-heading">{$t('ob.experience.title')}</div>
          <div class="ob-subheading">{$t('ob.experience.subtitle')}</div>
          <div class="experience-list">
            {#each experiences as exp}
              <button
                class="experience-option"
                class:selected={$selectedExperience === exp.id}
                onclick={() => selectedExperience.set(exp.id)}
              >
                <div class="exp-radio"></div>
                <div class="exp-text">
                  <div class="exp-label">{$t(exp.key)}</div>
                  <div class="exp-sublabel">{$t(exp.subKey)}</div>
                </div>
              </button>
            {/each}
          </div>
          <button class="ob-cta" onclick={next}>
            {$t('ob.next')}
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      {/if}

      <!-- Screen 4: Goals -->
      {#if $onboardingStep === 4}
        <div class="ob-screen">
          <div class="ob-heading">{$t('ob.goals.title')}</div>
          <div class="ob-subheading">{$t('ob.goals.subtitle')}</div>

          <div class="ob-goal-section">
            <div class="ob-goal-label">{$t('ob.goals.days_label')}</div>
            <div class="ob-pill-group">
              {#each dayOptions as d}
                <button
                  class="ob-pill"
                  class:active={$selectedDays === d}
                  onclick={() => selectedDays.set(d)}
                >{d}</button>
              {/each}
            </div>
          </div>

          <div class="ob-goal-section" style="margin-top:8px">
            <div class="ob-goal-label">{$t('ob.goals.minutes_label')}</div>
            <div class="ob-pill-group">
              {#each minuteOptions as m}
                <button
                  class="ob-pill"
                  class:active={$selectedMinutes === m}
                  onclick={() => selectedMinutes.set(m)}
                >{m}</button>
              {/each}
            </div>
          </div>

          <div class="ob-hint">{$t('ob.goals.hint')}</div>

          <button class="ob-cta" onclick={next}>
            {$t('ob.next')}
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      {/if}

      <!-- Screen 5: Microphone + First Tone -->
      {#if $onboardingStep === 5}
        <div class="ob-screen">
          <div class="ob-heading" style="align-self:flex-start">{$t('ob.mic.title')}</div>

          <div class="ob-mic-section">
            {#if !$micGranted}
              <div class="ob-mic-text">{$t('ob.mic.text')}</div>
              <button class="ob-mic-btn" onclick={requestMicrophone}>
                <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
                {$t('ob.mic.allow')}
              </button>
              {#if $micDenied}
                <div class="ob-mic-error">{$t('ob.mic.denied')}</div>
              {/if}
            {:else}
              <div class="ob-divider"></div>
              <div class="ob-tone-section">
                <div class="ob-tone-label">{$t('ob.mic.play_note')}</div>
                <div class="ob-tone-result">
                  <div class="ob-note-display">
                    <div class="ob-note-big">{pitchNote}</div>
                    <div class="ob-hz">{pitchHz}</div>
                  </div>
                  <div class="ob-pitch-meter">
                    <div class="ob-pitch-track"></div>
                    <div class="ob-pitch-center"></div>
                    <div class="ob-pitch-dot" style="top: {dotPosition(pitchCents)}%"></div>
                  </div>
                  <div class="ob-cent-display">
                    <div class="ob-cent-num" style="color: {centColor(pitchCents)}">
                      {pitchCents > 0 ? '+' : ''}{pitchCents}
                    </div>
                    <div class="ob-cent-unit">ct</div>
                  </div>
                </div>

                {#if $toneDetected}
                  <div class="ob-success">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {$t('ob.mic.success')}
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <button
            class="ob-cta"
            class:disabled={!$toneDetected && !$micGranted}
            onclick={finish}
            disabled={!$toneDetected && !$micGranted}
          >
            {$t('ob.mic.start_session')}
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>
      {/if}

      <!-- Step dots -->
      <div class="ob-dots">
        {#each [1, 2, 3, 4, 5] as step}
          <div class="ob-dot" class:active={$onboardingStep === step}></div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed; inset: 0;
    background: var(--bg);
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    transition: background 0.3s;
    overflow-y: auto;
  }

  .onboarding-container {
    width: 100%; max-width: 480px;
    display: flex; flex-direction: column;
    align-items: center;
    gap: 0;
    flex: 1;
    justify-content: center;
    position: relative;
  }

  .ob-back {
    position: absolute; top: -20px; left: 0;
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .ob-back:hover { background: var(--surface-hover); color: var(--text); }
  .ob-back svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  .ob-screen { display: flex; flex-direction: column; align-items: center; width: 100%; }

  .ob-logo {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, var(--accent), #818cf8);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(99,102,241,0.2);
  }
  .ob-logo svg { width: 28px; height: 28px; stroke: white; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }

  .ob-headline { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; margin-bottom: 12px; text-align: center; }
  .ob-subtitle { font-size: 15px; color: var(--text-2); text-align: center; line-height: 1.5; margin-bottom: 48px; letter-spacing: -0.2px; }

  .ob-heading { font-size: 24px; font-weight: 800; letter-spacing: -0.8px; margin-bottom: 8px; align-self: flex-start; }
  .ob-subheading { font-size: 13px; color: var(--text-2); margin-bottom: 28px; align-self: flex-start; line-height: 1.5; }

  /* Instrument grid */
  .instrument-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-bottom: 40px; }
  .instrument-card {
    padding: 16px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--bg-solid);
    cursor: pointer; transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center;
    gap: 8px; text-align: center; box-shadow: var(--shadow-sm);
    font-family: inherit;
  }
  .instrument-card:hover { border-color: rgba(99,102,241,0.25); background: var(--surface-hover); }
  .instrument-card.selected { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 1px var(--accent); }
  .instrument-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
  .instrument-icon svg { width: 28px; height: 28px; stroke: var(--text-2); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .instrument-card.selected .instrument-icon svg { stroke: var(--accent-2); }
  .instrument-name { font-size: 12px; font-weight: 600; letter-spacing: -0.2px; }
  .instrument-card.selected .instrument-name { color: var(--accent-2); }

  /* Experience */
  .experience-list { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-bottom: 40px; }
  .experience-option {
    padding: 14px 16px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--bg-solid);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 14px;
    box-shadow: var(--shadow-sm); font-family: inherit; text-align: left; width: 100%;
  }
  .experience-option:hover { border-color: rgba(99,102,241,0.2); }
  .experience-option.selected { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 1px var(--accent); }
  .exp-radio {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .experience-option.selected .exp-radio { border-color: var(--accent); }
  .experience-option.selected .exp-radio::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
  .exp-text { flex: 1; }
  .exp-label { font-size: 13px; font-weight: 600; letter-spacing: -0.2px; color: var(--text); }
  .exp-sublabel { font-size: 11px; color: var(--text-3); margin-top: 1px; }
  .experience-option.selected .exp-label { color: var(--accent-2); }

  /* Goals */
  .ob-goal-section { width: 100%; margin-bottom: 20px; }
  .ob-goal-label { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  .ob-pill-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .ob-pill {
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--bg-solid);
    color: var(--text-3); font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm);
  }
  .ob-pill:hover { color: var(--text-2); }
  .ob-pill.active { background: var(--accent-soft); color: var(--accent-2); border-color: rgba(99,102,241,0.3); }
  .ob-hint { font-size: 11px; color: var(--text-3); text-align: center; margin-top: 24px; margin-bottom: 40px; }

  /* Mic section */
  .ob-mic-section {
    width: 100%; padding: 20px; border-radius: 14px;
    border: 1px solid var(--border); background: var(--bg-solid);
    box-shadow: var(--shadow-sm); margin-bottom: 16px;
  }
  .ob-mic-text { font-size: 13px; color: var(--text-2); line-height: 1.5; margin-bottom: 16px; }
  .ob-mic-btn {
    width: 100%; padding: 11px; border-radius: 10px;
    border: 1px solid var(--accent); background: var(--accent-soft);
    color: var(--accent-2); font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .ob-mic-btn:hover { background: var(--accent); color: white; }
  .ob-mic-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .ob-mic-error { font-size: 12px; color: var(--red); margin-top: 12px; line-height: 1.5; }
  .ob-divider { width: 100%; height: 1px; background: var(--border); margin: 16px 0; }

  /* Tone detection */
  .ob-tone-section { width: 100%; }
  .ob-tone-label { font-size: 12px; color: var(--text-2); text-align: center; margin-bottom: 20px; }
  .ob-tone-result {
    display: flex; align-items: center; justify-content: center; gap: 28px;
    padding: 20px; border-radius: 12px;
    background: var(--surface); border: 1px solid var(--border); margin-bottom: 12px;
  }
  .ob-note-display { text-align: center; }
  .ob-note-big { font-size: 52px; font-weight: 900; letter-spacing: -2px; line-height: 0.9; }
  .ob-hz { font-size: 11px; color: var(--text-3); margin-top: 4px; letter-spacing: 0.3px; }
  .ob-pitch-meter { width: 24px; height: 120px; position: relative; }
  .ob-pitch-track { position: absolute; left: 50%; transform: translateX(-50%); width: 4px; height: 100%; border-radius: 2px; background: var(--track-gradient); }
  .ob-pitch-center { position: absolute; left: -3px; right: -3px; top: 50%; height: 1px; background: var(--stab-line); }
  .ob-pitch-dot {
    position: absolute; left: 50%; transform: translate(-50%,-50%);
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--green-2); box-shadow: var(--dot-shadow);
    transition: top 0.12s ease-out;
  }
  .ob-cent-display { text-align: center; }
  .ob-cent-num { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .ob-cent-unit { font-size: 10px; color: var(--text-3); }

  .ob-success {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border-radius: 10px;
    background: var(--green-soft); border: 1px solid rgba(52,211,153,0.15);
    font-size: 12px; font-weight: 600; color: var(--green); margin-bottom: 28px;
  }
  .ob-success svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

  /* CTA */
  .ob-cta {
    width: 100%; padding: 14px; border: none; border-radius: 12px;
    background: var(--accent); color: white; font-family: inherit;
    font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: -0.3px;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .ob-cta:hover { filter: brightness(1.1); box-shadow: 0 6px 24px rgba(99,102,241,0.35); transform: translateY(-1px); }
  .ob-cta svg { width: 14px; height: 14px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ob-cta.disabled { opacity: 0.4; cursor: not-allowed; }
  .ob-cta.disabled:hover { filter: none; box-shadow: none; transform: none; }

  /* Step dots */
  .ob-dots {
    display: flex; gap: 7px; align-items: center;
    position: absolute; bottom: -24px;
    left: 50%; transform: translateX(-50%);
  }
  .ob-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: all 0.2s; }
  .ob-dot.active { background: var(--accent); width: 20px; border-radius: 3px; }
</style>
