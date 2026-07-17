# Report: 2026-03-31-app-shell-foundation

## Summary

The repository now has a usable first MVP loop on top of the existing app shell: onboarding can hand off directly into a real starter session, session results persist across multiple exercises, and completion can lead straight into Progress. This sits on top of the earlier workflow-sync/typecheck repair and moves the product closer to a coherent end-to-end practice flow.

## Current state

- Phase state: in_progress
- Tasks complete: 37/55

## Evidence

- `workflow/state/task-registry.md` now records `37/55` completed tasks for this change.
- `frontend/src/lib/components/Onboarding.svelte` now hands directly into a generated starter session.
- `frontend/src/lib/stores/session.ts` now persists multi-exercise sessions as one history record.
- `frontend/src/lib/components/SessionOverlay.svelte` now summarizes the full session and offers direct completion CTAs.
- `frontend/src/routes/+page.svelte` and `frontend/src/routes/progress/+page.svelte` now react to saved history updates.
- `npm run check` passes with `0 errors` and `0 warnings`.
- `npm run test` passes with `107` tests.
- `npm run build` passes.

## Next step

- Run the pending desktop/Tauri smoke tests for the new onboarding-to-progress loop, then tighten remaining shell polish items.

## 2026-04-04 12:53:43

- Summary: Synchronized the app-shell workflow state with the implemented Tauri/Svelte shell, fixed header/settings runtime wiring, and cleared the frontend typecheck plus Svelte accessibility issues blocking npm run check.
- Change: 2026-03-31-app-shell-foundation
- Phase state: in_progress
- Tasks complete: 36/55
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/tasks.md, frontend/src/lib/components/Header.svelte, frontend/src/lib/components/Settings.svelte, npm run check, npm run test
- Notes: npm run lint still reports a broader pre-existing ESLint backlog outside this focused repair pass.
- Next: Complete remaining tasks

## 2026-04-04 13:26:47

- Summary: Completed the first MVP loop from onboarding into a real starter session, fixed multi-exercise session persistence, made dashboard/progress stats react to saved history, and added direct completion CTAs into progress or dashboard.
- Change: 2026-03-31-app-shell-foundation
- Phase state: in_progress
- Tasks complete: 37/55
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/tasks.md, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/stores/session.ts, frontend/src/lib/components/SessionOverlay.svelte, npm run check, npm run test, npm run build
- Notes: Manual Tauri smoke tests are still pending for the microphone-backed desktop flow.
- Next: Complete remaining tasks

## 2026-04-04 15:47:06

- Summary: Added explicit microphone selection in onboarding and settings, request browser-backed mic permission before Tauri capture starts, hid teacher-only surfaces from the student app, and fixed the metronome so 'Only Beat 1' really mutes the other beats.
- Change: 2026-03-31-app-shell-foundation
- Phase state: draft
- Tasks complete: 37/55
- Completed: Student navigation now stays focused on the learner shell, microphone device selection exists before the onboarding mic test, and the metronome accent modes now behave distinctly.
- Remaining: Retest the real macOS permission prompt and confirm the chosen microphone is the one the pitch engine uses during onboarding and sessions.
- Evidence: frontend/src/lib/stores/audioPreferences.ts, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/components/Settings.svelte, frontend/src/lib/stores/metronome.ts, frontend/src/routes/teacher/+page.ts, frontend/src-tauri/Info.plist, npm run check, npm run test, npm run build, cargo check
- Notes: Manual Tauri validation is still required because the original issue only reproduces in the real macOS desktop runtime.
- Next: Run a focused Tauri retest for microphone permission, alternate-device selection, hidden teacher surfaces, and metronome accent behavior.
