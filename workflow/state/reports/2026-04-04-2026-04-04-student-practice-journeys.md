# Report: 2026-04-04-student-practice-journeys

## Summary

Add a concise implementation summary here.

## Current state

- Phase state: in_progress
- Tasks complete: 10/12

## Evidence

- Add concrete evidence items here.

## Next step

- Complete remaining tasks

## 2026-04-04 21:13:11

- Summary: Implemented the first student-practice UX pass by clarifying onboarding audio states, preserving audio context across restarts, and making dashboard, session, Tone Lab, Rhythm, and Progress controls use clearer practice semantics.
- Change: 2026-04-04-student-practice-journeys
- Phase state: in_progress
- Tasks complete: 10/12
- Completed: The student-journey contract is now linked to the active shell and audio changes, the first UX slice is implemented in code, and the manual test queue now follows the shared Setup/Ready/Running/Review model.
- Remaining: Run the revised Tauri smoke test, then re-check Tone Lab and Rhythm start semantics interactively before treating the change as complete.
- Evidence: openspec/changes/2026-04-04-student-practice-journeys/tasks.md, openspec/changes/2026-04-04-student-practice-journeys/verification.md, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/components/SessionOverlay.svelte, frontend/src/routes/+page.svelte, frontend/src/routes/tonelab/+page.svelte, frontend/src/routes/rhythm/+page.svelte, frontend/src/routes/progress/+page.svelte, frontend/src/lib/stores/audioPreferences.ts, frontend/src-tauri/src/audio/mod.rs, frontend/src-tauri/src/audio/pitch.rs, npm run check, npm run test, npm run build, cargo check, cargo test
- Notes: The remaining risk is real-user clarity under live microphone conditions, especially when there is signal without stable pitch or when a page-level start and an exercise-level start both exist.
- Next: Run the new Tauri smoke test against the Setup/Ready/Running/Review story model.

## 2026-04-05 20:50:21

- Summary: Improved the student practice loop with a rolling audio analysis buffer, in-app audio debugging, immediate microphone restarts on device changes, and a global note-rendering preference across the main target-note surfaces.
- Change: 2026-04-04-student-practice-journeys
- Phase state: in_progress
- Tasks complete: 12/14
- Completed: The app now exposes live audio diagnostics in Settings, pitch analysis no longer depends on a single capture batch, running audio can switch devices in place, and the main onboarding/session/Tone Lab target-note surfaces share the new note rendering preference.
- Remaining: Run the updated Tauri smoke test and verify the new debug panel plus note-rendering preference under real microphone conditions before treating the change as complete.
- Evidence: openspec/changes/2026-04-04-student-practice-journeys/tasks.md, openspec/changes/2026-04-04-student-practice-journeys/verification.md, frontend/src-tauri/src/audio/mod.rs, frontend/src-tauri/src/audio/pitch.rs, frontend/src-tauri/src/audio/capture.rs, frontend/src/lib/components/Settings.svelte, frontend/src/lib/components/PracticeNote.svelte, frontend/src/lib/stores/audioPreferences.ts, frontend/src/lib/stores/notePreferences.ts, frontend/src/lib/music/noteUtils.ts, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/components/SessionOverlay.svelte, frontend/src/routes/tonelab/+page.svelte, npm run check, npm run test, npm run build, cargo check, cargo test
- Notes: The remaining risk is no longer mostly hidden wiring; it is whether the detector states, tentative pitch feedback, and shared note rendering still feel clear and correct under real-world brass input and mode transitions.
- Next: Run a real Tauri smoke test for onboarding, Settings audio debug, device switching, and the new note-rendering preference.
