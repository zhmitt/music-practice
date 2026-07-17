# Pending User Tests

## Active Queues

## Recommended Execution Order

### Phase 1: Tauri shell/audio baseline

- Run the desktop smoke path for app launch, microphone permission, device
  switching, persisted settings, live audio level, and live pitch detection.
- Use the `2026-03-31-app-shell-foundation` and
  `2026-03-31-audio-pitch-engine` queues first.

### Phase 2: Student journey UX

- Re-test onboarding, Settings debug, session controls, Tone Lab semantics,
  Rhythm semantics, and Progress guidance using the revised learner story model.
- Use the `2026-04-04-student-practice-journeys` queue second.

### Phase 3: Bb horn pedagogy

- Re-test the `horn_bb` register, drone usefulness, mode-to-mode note-pool
  coherence, and remaining notation-model confusion with a real player.
- Use the `2026-04-06-bb-horn-practice-pedagogy` queue last, after the shell
  and learner-flow baseline is stable.

### 2026-04-06-bb-horn-practice-pedagogy

- Verify that `horn_bb` long tones, target tones, and scale prompts now stay in a believable middle written register instead of dropping too quickly into low ledger-line territory.
- Verify that the updated `horn_bb` drone choices feel musically useful for centering pitch with a real player.
- Verify that Tone Lab now makes the pedagogical purpose of `free play`, `drone`, `target`, `interval`, and `ear` understandable without a developer explanation.
- Verify that the profile-driven note pools feel coherent across guided sessions, Tone Lab target mode, interval mode, and ear-training prompts.
- Verify that Rhythm now reads clearly as `metronome = support tool` versus `patterns/subdivision = drills`.
- Note any remaining confusion around `horn_bb` as a physical instrument choice versus the horn notation system the player expects to read.

### 2026-04-04-student-practice-journeys

- Retest onboarding as a new learner and confirm the step clearly distinguishes `permission`, `signal`, `pitch detected`, and `ready to continue`.
- Verify the onboarding CTA wording changes as the audio state improves and still allows a deliberate continue without falsely claiming success.
- Verify the new Settings audio debug panel reports sensible live states such as `buffering`, `no_signal`, `low_confidence`, and `detected` while you change what you play.
- Verify changing the selected microphone in Settings immediately affects the running capture if live audio is already active.
- Verify Dashboard keeps the daily practice CTA primary while assignments and imports feel secondary.
- Verify guided-session controls now read as distinct actions: `End session`, `Repeat exercise`, `Next exercise`, `Back to Dashboard`, and `View Progress`.
- Verify Tone Lab makes the relationship between page-level listening and exercise-level starts understandable for a first-time user.
- Verify Rhythm makes metronome transport versus exercise-start controls understandable without explanation from a developer.
- Verify Progress now gives a believable next-focus suggestion based on the learner history, not just raw stats.
- Verify the new note-rendering preference (`name`, `notation`, `hybrid`) updates the main target-note surfaces consistently in onboarding, guided sessions, Tone Lab target training, and interval prompts.

### 2026-03-31-app-shell-foundation

- Launch `cargo tauri dev` and confirm the desktop shell opens without layout regressions.
- Verify sidebar/bottom-bar behavior across the `1024px` breakpoint.
- Verify theme and language persistence across restart.
- Verify the onboarding microphone step now asks for permission cleanly and lets the user switch to a non-default microphone before starting.
- Verify the onboarding microphone step transitions cleanly into a real first session using the selected input device.
- Verify a completed multi-exercise session updates Dashboard and Progress as expected.
- Verify the student shell no longer exposes teacher navigation or teacher assignment creation.
- Verify Rhythm `Standard` still clicks every beat while `Only Beat 1` now mutes the offbeats.
- Verify session overlay shortcuts (`Space`, `ArrowRight`, `R`, `Escape`) in a real app session.

### 2026-03-31-audio-pitch-engine

- Grant microphone permission in a real Tauri session and confirm the app recovers cleanly.
- Validate live audio-level and live pitch-detection feedback with a real microphone or instrument.
- Verify that tuning, display mode, instrument, and selected microphone changes in Settings affect the running audio engine.
