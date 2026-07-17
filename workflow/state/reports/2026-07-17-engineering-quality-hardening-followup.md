# Report: engineering-quality-hardening-followup

## Summary

Resolved the post-hardening audit findings across frontend lifecycle, persistence recovery, native SQLite authorization, CI security, OpenSpec ownership, signature-level IPC contracts, dependency triage, and the production Rust audio owner protocol.

## Current state

- Checklist: 26 of 26 items checked in `openspec/changes/engineering-quality-hardening-followup/tasks.md`

## Evidence

- `workflow/scripts/verify.sh` exit 0: Svelte check, blocking lint, format, signature-level 14-command contract, build, five route smokes, 141 frontend tests, Rust fmt/check, 36 Rust tests, strict Clippy, and governance self-tests.
- Frontend regressions pass for successful drone stop, onboarding lease handoff, stop-during-acquire disposal, stale auto-advance rejection, serialized concurrent restart, independent persistence retry, DB initialization failure, partial corruption, legacy migration, and unsupported versions.
- Rust production-owner tests pass for capture/drone BuildFail, PlayFail, RuntimeError, stale callback after restart, and bounded acknowledgement timeout.
- `workflow/scripts/sqlite-capability-check.sh` exit 0: explicit execute capability and create/insert/update/select/delete/count evidence.
- Governance negative tests prove PR heredoc payloads remain data, unrelated/Draft changes are rejected, ready-for-archive changes remain admissible, and Rust/TypeScript signature drift fails closed.
- `cargo run` reached `Running target/debug/tonetrainer` on macOS with the updated capability and stayed active until deliberate interruption.
- All seven current npm advisory package entries have owner, exposure assessment, remediation and review deadline in `docs/dependency-audit.md`.

## Residual hardware boundary

Physical microphone permission, actual device removal, audible drone output, a truly wedged CoreAudio thread, and packaged-webview SQLite CRUD remain environment-dependent. The deterministic code paths now fail boundedly and expose typed state; these physical behaviors remain in the existing hardware test queue and are not claimed here.
