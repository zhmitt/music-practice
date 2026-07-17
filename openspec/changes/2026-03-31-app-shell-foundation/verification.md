# Verification: 2026-03-31-app-shell-foundation

## Current status

- State: draft
- Tasks complete: 37/55
- Created: 2026-03-31 12:11:56
- Updated: 2026-04-04 15:47:06

## Automated checks

- `npm run check` passes with `0 errors` and `0 warnings`.
- `npm run test` passes with `111` tests across `5` files.
- `npm run build` passes and produces a static production build.
- `cargo check` passes for the Tauri/Rust backend.
- The shell task checklist now reflects implemented layout, navigation, i18n, persistence, and session-overlay work.

## Manual checks

- `cargo tauri dev` launch still needs a fresh macOS smoke pass after the microphone-permission and device-selection changes.
- Responsive sidebar/bottom-bar behavior around the `1024px` breakpoint still needs an interactive pass.
- Theme/language persistence, onboarding microphone flow, and the full session-shortcut behavior still need a real Tauri validation pass.
- The student shell should be rechecked to confirm the teacher route and assignment-creation entry points are no longer exposed.
- The metronome should be rechecked to confirm `Standard` still clicks through the bar while `Only Beat 1` now mutes the offbeats.

## Notes

- Header date formatting now follows the active locale, and the instrument chip now follows the saved profile state.
- Onboarding now starts a real first session, session completion now summarizes the full multi-exercise run, and the completion flow can jump directly into Progress or back to Dashboard.
- Settings and onboarding now expose microphone selection, and the macOS bundle now declares microphone usage text via `src-tauri/Info.plist`.
- Teacher-only surfaces are gated off in the student variant for now, but the broader shell change is not archive-ready yet.
- `2026-04-04-student-practice-journeys` is now the canonical UX contract for interpreting the remaining shell smoke-test findings and student-facing wording decisions.
- `npm run lint` still reports a larger pre-existing ESLint backlog outside this focused repair pass.

## 2026-04-04 12:53:43

- Summary: Synchronized the app-shell workflow state with the implemented Tauri/Svelte shell, fixed header/settings runtime wiring, and cleared the frontend typecheck plus Svelte accessibility issues blocking npm run check.
- Phase state: in_progress
- Tasks complete: 36/55
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/tasks.md, frontend/src/lib/components/Header.svelte, frontend/src/lib/components/Settings.svelte, npm run check, npm run test
- Notes: npm run lint still reports a broader pre-existing ESLint backlog outside this focused repair pass.

## 2026-04-04 13:26:47

- Summary: Completed the first MVP loop from onboarding into a real starter session, fixed multi-exercise session persistence, made dashboard/progress stats react to saved history, and added direct completion CTAs into progress or dashboard.
- Phase state: in_progress
- Tasks complete: 37/55
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/tasks.md, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/stores/session.ts, frontend/src/lib/components/SessionOverlay.svelte, npm run check, npm run test, npm run build
- Notes: Manual Tauri smoke tests are still pending for the microphone-backed desktop flow.

## 2026-04-04 15:47:06

- Summary: Added explicit microphone selection in onboarding and settings, request browser-backed mic permission before Tauri capture starts, hid teacher-only surfaces from the student app, and fixed the metronome so 'Only Beat 1' really mutes the other beats.
- Phase state: draft
- Tasks complete: 37/55
- Completed: Student navigation now stays focused on the learner shell, microphone device selection exists before the onboarding mic test, and the metronome accent modes now behave distinctly.
- Remaining: Retest the real macOS permission prompt and confirm the chosen microphone is the one the pitch engine uses during onboarding and sessions.
- Evidence: frontend/src/lib/stores/audioPreferences.ts, frontend/src/lib/components/Onboarding.svelte, frontend/src/lib/components/Settings.svelte, frontend/src/lib/stores/metronome.ts, frontend/src/routes/teacher/+page.ts, frontend/src-tauri/Info.plist, npm run check, npm run test, npm run build, cargo check
- Notes: Manual Tauri validation is still required because the original issue only reproduces in the real macOS desktop runtime.
- Next: Run a focused Tauri retest for microphone permission, alternate-device selection, hidden teacher surfaces, and metronome accent behavior.
