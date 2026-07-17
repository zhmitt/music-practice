# Report: 2026-04-06-bb-horn-practice-pedagogy

## Summary

Introduced shared pedagogical practice profiles with a Bb-horn-focused middle register, aligned the main guided and Tone Lab note pools to those profiles, and improved Tone Lab plus Rhythm wording so the exercises communicate their musical purpose more clearly.

## Current state

- Phase state: in_progress
- Tasks complete: 12/13

## Evidence

- `frontend/src/lib/music/practiceProfiles.ts`
- `frontend/src/lib/exercises/longTones.ts`
- `frontend/src/lib/exercises/scales.ts`
- `frontend/src/lib/exercises/smartSuggestion.ts`
- `frontend/src/lib/stores/targetTraining.ts`
- `frontend/src/lib/stores/intervalTraining.ts`
- `frontend/src/lib/stores/earTraining.ts`
- `frontend/src/routes/tonelab/+page.svelte`
- `frontend/src/routes/rhythm/+page.svelte`
- `frontend/src/lib/i18n/de.json`
- `frontend/src/lib/i18n/en.json`
- `npm run check`
- `npm run test`
- `npm run build`

## Next step

- Retest the Bb-horn register choices and the updated Tone Lab plus Rhythm guidance in a real Tauri session.

## 2026-04-06 19:45:11

- Summary: Aligned Bb-horn practice content to a safer middle register, unified the main guided and Tone Lab note pools via shared pedagogical practice profiles, and clarified Tone Lab plus Rhythm mode intent in learner-facing copy.
- Change: 2026-04-06-bb-horn-practice-pedagogy
- Phase state: in_progress
- Tasks complete: 12/13
- Completed: Shared practice profiles now drive long tones, scales, flexibility work, target notes, drone anchors, interval roots, and ear roots, and Tone Lab target mode now uses canonical app state instead of local storage.
- Remaining: Run one real Tauri retest with a Bb-horn player to validate the new register choices, Tone Lab guidance, and Rhythm framing under live use.
- Evidence: frontend/src/lib/music/practiceProfiles.ts; frontend/src/lib/exercises/longTones.ts; frontend/src/lib/exercises/scales.ts; frontend/src/lib/exercises/smartSuggestion.ts; frontend/src/lib/stores/targetTraining.ts; frontend/src/lib/stores/intervalTraining.ts; frontend/src/lib/stores/earTraining.ts; frontend/src/routes/tonelab/+page.svelte; frontend/src/routes/rhythm/+page.svelte; frontend/src/lib/i18n/de.json; frontend/src/lib/i18n/en.json; npm run check; npm run test; npm run build
- Notes: The deeper distinction between physical horn variant and written horn notation remains explicitly open follow-up work; this pass improved pedagogy and register safety without silently changing the horn-notation model.
- Next: Complete remaining tasks
