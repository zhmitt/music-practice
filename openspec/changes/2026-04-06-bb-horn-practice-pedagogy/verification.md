# Verification: 2026-04-06-bb-horn-practice-pedagogy

## Current status

- State: in_progress
- Tasks complete: 12/13
- Created: 2026-04-06 19:43:47
- Updated: 2026-04-06 19:45:11

## Automated checks

- `npm run check` passes with `0 errors` and `0 warnings`.
- `npm run test` passes with `119` tests across `7` files.
- `npm run build` passes and produces a static production build.

## Manual checks

- A real Tauri retest is still needed for the `horn_bb` register pass with a player on the instrument.
- Tone Lab still needs an interactive learner pass for `free play`, `drone`, `target`, `interval`, and `ear` using the new pedagogical copy and profile-driven note pools.
- Rhythm still needs an interactive learner pass to confirm that the metronome-vs-drill wording feels clearer in practice.
- The remaining manual checks will be tracked in `workflow/state/pending-usertests.md`.

## Notes

- This change introduces a shared instrument practice-profile module so guided sessions, smart suggestions, and Tone Lab no longer pick unrelated note pools.
- `horn_bb` now uses a more readable written middle register for long tones, target notes, scales, flexibility work, drone anchors, and interval/ear roots.
- Tone Lab no longer reads the target-training instrument indirectly from local storage, and both Tone Lab and Rhythm now explain their musical purpose more explicitly in learner-facing language.

## 2026-04-06 19:45:11

- Summary: Aligned Bb-horn practice content to a safer middle register, unified the main guided and Tone Lab note pools via shared pedagogical practice profiles, and clarified Tone Lab plus Rhythm mode intent in learner-facing copy.
- Phase state: in_progress
- Tasks complete: 12/13
- Completed: Shared practice profiles now drive long tones, scales, flexibility work, target notes, drone anchors, interval roots, and ear roots, and Tone Lab target mode now uses canonical app state instead of local storage.
- Remaining: Run one real Tauri retest with a Bb-horn player to validate the new register choices, Tone Lab guidance, and Rhythm framing under live use.
- Evidence: frontend/src/lib/music/practiceProfiles.ts; frontend/src/lib/exercises/longTones.ts; frontend/src/lib/exercises/scales.ts; frontend/src/lib/exercises/smartSuggestion.ts; frontend/src/lib/stores/targetTraining.ts; frontend/src/lib/stores/intervalTraining.ts; frontend/src/lib/stores/earTraining.ts; frontend/src/routes/tonelab/+page.svelte; frontend/src/routes/rhythm/+page.svelte; frontend/src/lib/i18n/de.json; frontend/src/lib/i18n/en.json; npm run check; npm run test; npm run build
- Notes: The deeper distinction between physical horn variant and written horn notation remains explicitly open follow-up work; this pass improved pedagogy and register safety without silently changing the horn-notation model.
- Next: Complete remaining tasks
