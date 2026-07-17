# Status Log

Append-only project status log for deterministic session handover.

## 2026-03-30 14:59:14
- Summary: Completed the OpenSpec hybrid migration for music-practice and left the repo ready for its first real implementation change.
- Change: none
- State: no_change

## 2026-03-31 10:15:00
- Change: workflow-automation-maintenance
- Status: implemented
- Summary: Completed the post-implementation automation rollout so verification and report artifacts can be scaffolded quickly while session close remains a deliberate manual handover step.
- Evidence: workflow/scripts/post-impl-prepare.sh, workflow/scripts/post-impl-check.sh, workflow/state/reports/2026-03-31-post-impl-automation-rollout.md

## 2026-04-04 12:53:43
- Change: 2026-03-31-app-shell-foundation
- Status: checkpointed
- Summary: Synchronized the app-shell workflow state with the implemented Tauri/Svelte shell, fixed header/settings runtime wiring, and cleared the frontend typecheck plus Svelte accessibility issues blocking npm run check.
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/verification.md, workflow/state/reports/2026-03-31-2026-03-31-app-shell-foundation.md
- Next: Complete remaining tasks

## 2026-04-04 12:53:43
- Change: 2026-03-31-audio-pitch-engine
- Status: checkpointed
- Summary: Synchronized the audio engine workflow state with the implemented Rust capture and pitch pipeline, verified cargo check/test, and fixed the settings-to-audio invoke wiring for tuning, display mode, and instrument profile updates.
- Evidence: openspec/changes/2026-03-31-audio-pitch-engine/verification.md, workflow/state/reports/2026-04-04-2026-03-31-audio-pitch-engine.md
- Next: Complete remaining tasks

## 2026-04-04 13:26:47
- Change: 2026-03-31-app-shell-foundation
- Status: checkpointed
- Summary: Completed the first MVP loop from onboarding into a real starter session, fixed multi-exercise session persistence, made dashboard/progress stats react to saved history, and added direct completion CTAs into progress or dashboard.
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/verification.md, workflow/state/reports/2026-03-31-2026-03-31-app-shell-foundation.md
- Next: Complete remaining tasks

## 2026-04-04 15:47:06
- Change: 2026-03-31-app-shell-foundation
- Status: checkpointed
- Summary: Added explicit microphone selection in onboarding and settings, request browser-backed mic permission before Tauri capture starts, hid teacher-only surfaces from the student app, and fixed the metronome so 'Only Beat 1' really mutes the other beats.
- Completed: Student navigation now stays focused on the learner shell, microphone device selection exists before the onboarding mic test, and the metronome accent modes now behave distinctly.
- Remaining: Retest the real macOS permission prompt and confirm the chosen microphone is the one the pitch engine uses during onboarding and sessions.
- Evidence: openspec/changes/2026-03-31-app-shell-foundation/verification.md, workflow/state/reports/2026-03-31-2026-03-31-app-shell-foundation.md
- Notes: Manual Tauri validation is still required because the original issue only reproduces in the real macOS desktop runtime.
- Next: Run a focused Tauri retest for microphone permission, alternate-device selection, hidden teacher surfaces, and metronome accent behavior.

## 2026-04-04 15:55:59
- Change: add-canonical-milestone-sync
- Status: implemented
- Summary: Completed the repo-local milestone-sync rollout by wiring the canonical scripts into this multi-change repository, preserving NEXT-SESSION carry-over context, and adding the missing verification/report evidence for the workflow change.
- Completed: The milestone sync/check scripts are now present, task-registry drift detection is active, staged post-implementation checks route through milestone freshness enforcement, and the workflow change now has canonical verification/report artifacts.
- Remaining: Archive add-canonical-milestone-sync, then continue the pending app-shell/audio smoke tests without losing the preserved carry-over context.
- Evidence: openspec/changes/add-canonical-milestone-sync/verification.md, workflow/state/reports/2026-04-04-add-canonical-milestone-sync.md
- Notes: This repo keeps multiple active product changes in flight, so the sync flow now preserves an explicit carry-over section in NEXT-SESSION instead of flattening the broader session context.
- Next: Archive add-canonical-milestone-sync once these checks pass, then return to the pending Tauri smoke tests for the app-shell and audio changes.

## 2026-04-04 20:47:52
- Change: 2026-04-04-student-practice-journeys
- Status: drafted
- Summary: Retroactively mapped the implemented student views into canonical user stories and documented the main UX ambiguities around onboarding, dashboard, guided session controls, Tone Lab, Rhythm, and Progress.
- Evidence: openspec/changes/2026-04-04-student-practice-journeys/proposal.md, openspec/changes/2026-04-04-student-practice-journeys/design.md, openspec/changes/2026-04-04-student-practice-journeys/tasks.md, openspec/changes/2026-04-04-student-practice-journeys/specs/student-practice-journeys/spec.md
- Next: Use the new student-journey contract to prioritize the first UX cleanup pass, starting with onboarding audio-state feedback and session control semantics.

## 2026-04-04 21:13:11
- Change: 2026-04-04-student-practice-journeys
- Status: checkpointed
- Summary: Implemented the first student-practice UX pass by clarifying onboarding audio states, preserving audio context across restarts, and making dashboard, session, Tone Lab, Rhythm, and Progress controls use clearer practice semantics.
- Completed: The student-journey contract is now linked to the active shell and audio changes, the first UX slice is implemented in code, and the manual test queue now follows the shared Setup/Ready/Running/Review model.
- Remaining: Run the revised Tauri smoke test, then re-check Tone Lab and Rhythm start semantics interactively before treating the change as complete.
- Evidence: openspec/changes/2026-04-04-student-practice-journeys/verification.md, workflow/state/reports/2026-04-04-2026-04-04-student-practice-journeys.md
- Notes: The remaining risk is real-user clarity under live microphone conditions, especially when there is signal without stable pitch or when a page-level start and an exercise-level start both exist.
- Next: Run the new Tauri smoke test against the Setup/Ready/Running/Review story model.

## 2026-04-05 20:50:21
- Change: 2026-04-04-student-practice-journeys
- Status: checkpointed
- Summary: Improved the student practice loop with a rolling audio analysis buffer, in-app audio debugging, immediate microphone restarts on device changes, and a global note-rendering preference across the main target-note surfaces.
- Completed: The app now exposes live audio diagnostics in Settings, pitch analysis no longer depends on a single capture batch, running audio can switch devices in place, and the main onboarding/session/Tone Lab target-note surfaces share the new note rendering preference.
- Remaining: Run the updated Tauri smoke test and verify the new debug panel plus note-rendering preference under real microphone conditions before treating the change as complete.
- Evidence: openspec/changes/2026-04-04-student-practice-journeys/verification.md, workflow/state/reports/2026-04-04-2026-04-04-student-practice-journeys.md
- Notes: The remaining risk is no longer mostly hidden wiring; it is whether the detector states, tentative pitch feedback, and shared note rendering still feel clear and correct under real-world brass input and mode transitions.
- Next: Run a real Tauri smoke test for onboarding, Settings audio debug, device switching, and the new note-rendering preference.

## 2026-04-06 19:45:11
- Change: 2026-04-06-bb-horn-practice-pedagogy
- Status: checkpointed
- Summary: Aligned Bb-horn practice content to a safer middle register, unified the main guided and Tone Lab note pools via shared pedagogical practice profiles, and clarified Tone Lab plus Rhythm mode intent in learner-facing copy.
- Completed: Shared practice profiles now drive long tones, scales, flexibility work, target notes, drone anchors, interval roots, and ear roots, and Tone Lab target mode now uses canonical app state instead of local storage.
- Remaining: Run one real Tauri retest with a Bb-horn player to validate the new register choices, Tone Lab guidance, and Rhythm framing under live use.
- Evidence: openspec/changes/2026-04-06-bb-horn-practice-pedagogy/verification.md, workflow/state/reports/2026-04-06-2026-04-06-bb-horn-practice-pedagogy.md
- Notes: The deeper distinction between physical horn variant and written horn notation remains explicitly open follow-up work; this pass improved pedagogy and register safety without silently changing the horn-notation model.
- Next: Complete remaining tasks

## 2026-04-29 00:00:00
- Change: openspec-verification-toolchain
- Status: complete
- Summary: Installed the OpenSpec Verification Toolchain. Three new scripts (spec-drift-check.sh, claim-evidence-check.sh, change-done.sh), three diffs to post-impl-check.sh, pre-commit hook extended with Check A/B, CI gate added, AGENTS.md and CLAUDE.md extended with Done-Disziplin sections.
- Evidence: workflow/scripts/spec-drift-check.sh, workflow/scripts/claim-evidence-check.sh, workflow/scripts/change-done.sh, .git-hooks/pre-commit, .github/workflows/openspec-gate.yml, AGENTS.md, CLAUDE.md, workflow/state/reports/2026-04-29-openspec-verification-toolchain.md

## 2026-04-29 20:29:26
- Change: openspec-verification-toolchain
- Status: implemented
- Summary: Installed openspec verification toolchain.
- Evidence: openspec/changes/openspec-verification-toolchain/verification.md, workflow/state/reports/2026-04-29-openspec-verification-toolchain.md
- Next: Complete proposal and delta specs

## 2026-07-17 20:00:00
- Change: none
- State: no_change
- Summary: Refreshed the canonical workflow picture against the current repository, confirmed that the main remaining work is a real Tauri retest cycle, and re-established a concrete retest order for the current architecture.
- Evidence: workflow/state/reports/2026-07-17-workflow-refresh-and-retest-map.md, workflow/state/NEXT-SESSION.md, workflow/state/pending-usertests.md

## 2026-07-17 20:15:23
- Change: none
- State: no_change
- Summary: Restored the local frontend toolchain, confirmed fresh Rust and frontend validation in this workspace, and narrowed the remaining work to the real Tauri baseline plus the queued UX and pedagogy retests.
- Evidence: workflow/state/reports/2026-07-17-workflow-refresh-and-retest-map.md, workflow/state/NEXT-SESSION.md, workflow/state/pending-usertests.md, workflow/state/task-registry.md

## 2026-07-17 21:59:51
- Change: engineering-quality-hardening
- Status: checkpointed
- Summary: Documented the engineering quality audit, accepted the core architecture decisions, and started disjoint Rust audio, frontend correctness, and governance implementation tracks.
- Remaining: Complete the remaining tracked tasks.
- Evidence: openspec/changes/engineering-quality-hardening/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening.md
- Next: Complete remaining tasks

## 2026-07-17 22:11:01
- Change: engineering-quality-hardening
- Status: checkpointed
- Summary: Hardened audio ownership and startup, serialized practice polling, made persistence failures observable and validated, closed CI/OpenSpec gates, aligned typed Tauri contracts, and added deterministic route and failure-path evidence.
- Evidence: openspec/changes/engineering-quality-hardening/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening.md
- Next: Complete remaining tasks

## 2026-07-17 22:11:06
- Change: engineering-quality-hardening
- Status: checkpointed
- Summary: Integrated all audit remediations; full canonical verification, negative governance tests, and native macOS launch evidence are green, with physical microphone interaction explicitly retained for the existing hardware test queue.
- Remaining: Complete the remaining tracked tasks.
- Evidence: openspec/changes/engineering-quality-hardening/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening.md
- Next: Complete remaining tasks

## 2026-07-17 22:48:10
- Change: engineering-quality-hardening-followup
- Status: checkpointed
- Summary: Documented the post-hardening audit, accepted lifecycle/security/persistence decisions, and started disjoint frontend, Rust audio, and governance remediation tracks.
- Remaining: Complete the remaining tracked tasks.
- Evidence: openspec/changes/engineering-quality-hardening-followup/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-followup.md
- Next: Complete remaining tasks

## 2026-07-17 22:58:01
- Change: engineering-quality-hardening-followup
- Status: checkpointed
- Summary: Fixed residual drone, lease, timer, persistence, native SQLite, CI security, OpenSpec ownership, signature-contract, dependency-triage, and production audio owner-protocol findings.
- Evidence: openspec/changes/engineering-quality-hardening-followup/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-followup.md
- Next: Complete remaining tasks

## 2026-07-17 22:58:05
- Change: engineering-quality-hardening-followup
- Status: checkpointed
- Summary: Integrated all post-hardening remediations; canonical verification, production-protocol failure tests, governance negatives, SQLite CRUD evidence, and native macOS launch are green.
- Remaining: Complete the remaining tracked tasks.
- Evidence: openspec/changes/engineering-quality-hardening-followup/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-followup.md
- Next: Complete remaining tasks

## 2026-07-17 23:13:36
- Change: engineering-quality-hardening-v3
- Status: checkpointed
- Summary: Created the V3 hardening change from the post-commit audit and started implementation across frontend, Rust audio, and governance.
- Completed: Proposal, design, requirements, task plan, and audit prioritization.
- Remaining: Implement and verify every tracked remediation.
- Evidence: openspec/changes/engineering-quality-hardening-v3/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-v3.md
- Next: Complete bounded implementation work and run canonical verification.

## 2026-07-17 23:23:44
- Change: engineering-quality-hardening-v3
- Status: checkpointed
- Summary: Implemented all V3 audit remediations across CI, governance, frontend lifecycle recovery, persistence validation, Rust audio teardown/status, contract completeness, and native package evidence; canonical verification is green.
- Evidence: openspec/changes/engineering-quality-hardening-v3/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-v3.md
- Next: Complete remaining tasks

## 2026-07-17 23:24:39
- Change: engineering-quality-hardening-v3
- Status: implemented
- Summary: All 23 V3 hardening tasks are implemented with canonical, negative-path, contract, dependency, and native-build evidence.
- Evidence: openspec/changes/engineering-quality-hardening-v3/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-v3.md
- Next: Archive the change into openspec/changes/archive/

## 2026-07-17 23:24:52
- Summary: Completed engineering-quality-hardening-v3: all audit findings were documented and remediated; canonical verify and change-done are green. External residual evidence remains hosted GitHub/branch protection, physical audio hardware, and GUI WebView SQLite CRUD.
- Change: 2026-03-31-app-shell-foundation
- State: draft
- Next: Complete proposal and delta specs
- Change: 2026-03-31-audio-pitch-engine
- State: draft
- Next: Complete proposal and delta specs
- Change: 2026-04-04-student-practice-journeys
- State: in_progress
- Next: Complete remaining tasks
- Change: 2026-04-06-bb-horn-practice-pedagogy
- State: in_progress
- Next: Complete remaining tasks
- Change: add-canonical-milestone-sync
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening-followup
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening-v3
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: openspec-verification-toolchain
- State: draft
- Next: Complete proposal and delta specs

## 2026-07-17 23:34:21
- Change: engineering-quality-hardening-v4
- Status: checkpointed
- Summary: Created V4 from the fresh post-V3 audit with reproduced frontend, Rust audio, persistence, and governance findings.
- Completed: Read-only audit, negative probes, proposal, design, requirements, and task plan.
- Remaining: Implement all reproduced findings and pass canonical completion evidence.
- Evidence: openspec/changes/engineering-quality-hardening-v4/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-v4.md
- Next: Complete bounded V4 implementation and verification.

## 2026-07-17 23:42:35
- Change: engineering-quality-hardening-v4
- Status: implemented
- Summary: Implemented all V4 post-audit remediations across runtime ownership, audio concurrency and teardown, persistence recovery, independent workflow validation, archive evidence, DTO shapes, and advisory identity parity.
- Evidence: openspec/changes/engineering-quality-hardening-v4/verification.md, workflow/state/reports/2026-07-17-engineering-quality-hardening-v4.md
- Next: Archive the change into openspec/changes/archive/

## 2026-07-17 23:43:31
- Summary: Completed engineering-quality-hardening-v4 after a fresh post-V3 audit: all reproduced residuals are fixed, canonical verify and change-done are green; hosted GitHub, physical audio, and GUI WebView SQLite remain external evidence.
- Change: 2026-03-31-app-shell-foundation
- State: draft
- Next: Complete proposal and delta specs
- Change: 2026-03-31-audio-pitch-engine
- State: draft
- Next: Complete proposal and delta specs
- Change: 2026-04-04-student-practice-journeys
- State: in_progress
- Next: Complete remaining tasks
- Change: 2026-04-06-bb-horn-practice-pedagogy
- State: in_progress
- Next: Complete remaining tasks
- Change: add-canonical-milestone-sync
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening-followup
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening-v3
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: engineering-quality-hardening-v4
- State: ready_for_archive
- Next: Archive the change into openspec/changes/archive/
- Change: openspec-verification-toolchain
- State: draft
- Next: Complete proposal and delta specs

## 2026-07-17 23:48:11
- Change: external-runtime-evidence
- Status: checkpointed
- Summary: Started external runtime evidence for real WebView SQLite, hosted GitHub delivery, branch protection, native audio hardware, and macOS packaging.
- Completed: Defined evidence boundaries and implementation plan.
- Remaining: Implement and execute native, hosted, hardware, and bundle evidence.
- Evidence: openspec/changes/external-runtime-evidence/verification.md, workflow/state/reports/2026-07-17-external-runtime-evidence.md
- Next: Build the WebView smoke and audit hosted delivery in parallel.

## 2026-07-18 00:04:36
- Change: external-runtime-evidence
- Status: checkpointed
- Summary: Implemented and executed signed bundled WebView SQLite CRUD, real microphone capture, drone lifecycle, macOS bundle, hardened-runtime entitlement, and development signing evidence.
- Completed: Native WebView, audio hardware, bundle structure, entitlement, identifier, and Apple Development signature evidence.
- Remaining: Push hosted PR, observe GitHub checks, configure branch protection, and close external evidence.
- Evidence: openspec/changes/external-runtime-evidence/verification.md, workflow/state/reports/2026-07-17-external-runtime-evidence.md
- Next: Commit and push the evidence branch for hosted validation.

## 2026-07-18 00:08:25
- Change: external-runtime-evidence
- Status: checkpointed
- Summary: Pushed PR 1 and observed hosted workflow execution; local signed-bundle SQLite and audio evidence remains green after the final smoke and entitlement changes.
- Completed: Remote branch push, PR creation, branch-protection audit, local canonical verify, signed bundled SQLite/audio smokes.
- Remaining: Wait for final hosted checks, close their evidence tasks, and configure required checks.
- Evidence: openspec/changes/external-runtime-evidence/verification.md, workflow/state/reports/2026-07-17-external-runtime-evidence.md
- Next: Resolve hosted gate results and enable main branch protection.

## 2026-07-18 00:09:41
- Change: external-runtime-evidence
- Status: implemented
- Summary: Completed native, hosted, branch-protection, audio hardware, signed WebView SQLite, and macOS packaging evidence; all 14 tasks are complete.
- Evidence: openspec/changes/external-runtime-evidence/verification.md, workflow/state/reports/2026-07-17-external-runtime-evidence.md
- Next: Archive the change into openspec/changes/archive/

## 2026-07-18 00:12:44
- Change: external-runtime-evidence
- Status: implemented
- Summary: Fixed hosted OpenSpec drift portability by adding a deterministic grep fallback when ripgrep and bundled tool paths are absent.
- Completed: Reproduced the hosted failure locally with a restricted PATH and verified the fallback exits zero.
- Remaining: Obtain a fully green hosted rerun and merge through protected main.
- Evidence: openspec/changes/external-runtime-evidence/verification.md, workflow/state/reports/2026-07-17-external-runtime-evidence.md
- Next: Push the portability fix and monitor all required checks.
