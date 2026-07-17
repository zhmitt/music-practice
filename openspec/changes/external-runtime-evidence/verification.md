# Verification: external-runtime-evidence

## Current status

- State: in_progress
- Tasks complete: 0/14
- Created: 2026-07-17 23:48:12

## Automated checks

- Native development WebView SQLite CRUD emitted `TONETRAINER_RUNTIME_SMOKE` success for create, insert, read, update, and delete.
- Signed `.app` WebView SQLite CRUD emitted the same successful five-stage result.
- Native audio hardware smoke enumerated eight input devices, captured 1,024 samples from Logitech StreamCam at 48 kHz, started a 440 Hz drone, observed `playing`, stopped it, and observed `stopped`.
- macOS `.app` bundle built with one executable only and passed strict deep code-signature verification using the installed Apple Development identity.
- Bundle identifier is `com.zhmitt.tonetrainer`; hardened runtime and `com.apple.security.device.audio-input` are present.
- Frontend tests: 17 files / 158 tests. Rust tests: 48 tests. Tauri contract: 17 commands / 6 DTOs.
- GitHub PR #1 materialized all nine declared CI/OpenSpec check contexts; the first run proved CI execution and correctly rejected incomplete OpenSpec tasks.
- `main` branch protection now requires those nine exact observed contexts with strict up-to-date checks, PR flow, conversation resolution, linear history, and force-push/deletion disabled.

## Manual checks

- Confirmed `NSMicrophoneUsageDescription` in the generated bundle.
- Confirmed the hardware smoke is a Cargo example and is not included in `Contents/MacOS`.
- Confirmed no local notarization credential or Developer ID Application certificate is available; Apple Development signing is valid for development evidence but not Gatekeeper distribution.
- Confirmed repository ADMIN access and retained `enforce_admins: false` as an initial recovery path for the sole collaborator; required approvals are zero to avoid an impossible self-approval rule.

## Notes

- Acoustic frequency accuracy, loudness, distortion, and speaker routing are not inferred from the successful CPAL output lifecycle.
- Hosted evidence is recorded at https://github.com/zhmitt/music-practice/pull/1.

## 2026-07-17 23:48:11

- Summary: Started external runtime evidence for real WebView SQLite, hosted GitHub delivery, branch protection, native audio hardware, and macOS packaging.
- Phase state: in_progress
- Tasks complete: 0/14
- Completed: Defined evidence boundaries and implementation plan.
- Remaining: Implement and execute native, hosted, hardware, and bundle evidence.
- Next: Build the WebView smoke and audit hosted delivery in parallel.

## 2026-07-18 00:04:36

- Summary: Implemented and executed signed bundled WebView SQLite CRUD, real microphone capture, drone lifecycle, macOS bundle, hardened-runtime entitlement, and development signing evidence.
- Phase state: in_progress
- Tasks complete: 6/14
- Completed: Native WebView, audio hardware, bundle structure, entitlement, identifier, and Apple Development signature evidence.
- Remaining: Push hosted PR, observe GitHub checks, configure branch protection, and close external evidence.
- Next: Commit and push the evidence branch for hosted validation.

## 2026-07-18 00:08:25

- Summary: Pushed PR 1 and observed hosted workflow execution; local signed-bundle SQLite and audio evidence remains green after the final smoke and entitlement changes.
- Phase state: in_progress
- Tasks complete: 9/14
- Completed: Remote branch push, PR creation, branch-protection audit, local canonical verify, signed bundled SQLite/audio smokes.
- Remaining: Wait for final hosted checks, close their evidence tasks, and configure required checks.
- Next: Resolve hosted gate results and enable main branch protection.

## 2026-07-18 00:09:41

- Summary: Completed native, hosted, branch-protection, audio hardware, signed WebView SQLite, and macOS packaging evidence; all 14 tasks are complete.
- Phase state: ready_for_archive
- Tasks complete: 14/14
