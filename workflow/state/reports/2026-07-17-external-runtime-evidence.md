# Report: external-runtime-evidence

## Summary

Added and executed real native evidence for Tauri WebView SQLite CRUD, microphone capture, drone lifecycle, deterministic smoke exit, macOS bundling, hardened-runtime entitlements, and development signing. Hosted GitHub delivery remains the next execution stage.

## Current state

- Phase state: in_progress
- Tasks complete: 0/14

## Evidence

- Signed bundled WebView CRUD: create/insert/read/update/delete succeeded.
- Audio: eight devices enumerated; Logitech StreamCam, 48 kHz, 1,024 samples; 440 Hz drone lifecycle transitioned playing to stopped.
- Bundle: one executable, identifier `com.zhmitt.tonetrainer`, microphone usage text, audio-input entitlement, hardened runtime, strict signature verification.
- Distribution blocker: no Developer ID Application certificate or notarization credential is installed; development signing is verified.
- Hosted PR: https://github.com/zhmitt/music-practice/pull/1 materialized all nine expected workflow contexts.
- Branch protection: strict required checks for all nine contexts, PR flow, conversation resolution, linear history, no force pushes/deletions, zero approvals for the sole-collaborator repository, and temporary admin recovery.
- Hosted runner portability: the first OpenSpec run exposed absent ripgrep; the drift checker now has a deterministic grep fallback instead of a silent `set -e` exit.

## Next step

- Complete the final hosted rerun with the now-complete OpenSpec evidence and merge through the protected PR.

## 2026-07-17 23:48:11

- Summary: Started external runtime evidence for real WebView SQLite, hosted GitHub delivery, branch protection, native audio hardware, and macOS packaging.
- Change: external-runtime-evidence
- Phase state: in_progress
- Tasks complete: 0/14
- Completed: Defined evidence boundaries and implementation plan.
- Remaining: Implement and execute native, hosted, hardware, and bundle evidence.
- Next: Build the WebView smoke and audit hosted delivery in parallel.

## 2026-07-18 00:04:36

- Summary: Implemented and executed signed bundled WebView SQLite CRUD, real microphone capture, drone lifecycle, macOS bundle, hardened-runtime entitlement, and development signing evidence.
- Change: external-runtime-evidence
- Phase state: in_progress
- Tasks complete: 6/14
- Completed: Native WebView, audio hardware, bundle structure, entitlement, identifier, and Apple Development signature evidence.
- Remaining: Push hosted PR, observe GitHub checks, configure branch protection, and close external evidence.
- Next: Commit and push the evidence branch for hosted validation.

## 2026-07-18 00:08:25

- Summary: Pushed PR 1 and observed hosted workflow execution; local signed-bundle SQLite and audio evidence remains green after the final smoke and entitlement changes.
- Change: external-runtime-evidence
- Phase state: in_progress
- Tasks complete: 9/14
- Completed: Remote branch push, PR creation, branch-protection audit, local canonical verify, signed bundled SQLite/audio smokes.
- Remaining: Wait for final hosted checks, close their evidence tasks, and configure required checks.
- Next: Resolve hosted gate results and enable main branch protection.

## 2026-07-18 00:09:41

- Summary: Completed native, hosted, branch-protection, audio hardware, signed WebView SQLite, and macOS packaging evidence; all 14 tasks are complete.
- Change: external-runtime-evidence
- Phase state: ready_for_archive
- Tasks complete: 14/14
- Next: Archive the change into openspec/changes/archive/

## 2026-07-18 00:12:44

- Summary: Fixed hosted OpenSpec drift portability by adding a deterministic grep fallback when ripgrep and bundled tool paths are absent.
- Change: external-runtime-evidence
- Phase state: ready_for_archive
- Tasks complete: 14/14
- Completed: Reproduced the hosted failure locally with a restricted PATH and verified the fallback exits zero.
- Remaining: Obtain a fully green hosted rerun and merge through protected main.
- Next: Push the portability fix and monitor all required checks.
