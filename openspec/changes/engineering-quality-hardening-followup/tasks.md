# Tasks: engineering-quality-hardening-followup

## Documentation

- [x] document the post-hardening audit and accepted decisions
- [x] update architecture, dependency triage, and verification boundaries

## Frontend correctness

- [x] fix successful ToneLab drone start/stop and add lifecycle tests
- [x] replace boolean audio ownership with idempotent generation-aware lease handles
- [x] release/handoff onboarding audio before the first session
- [x] release late acquisitions after stop and serialize device restart with lease transitions
- [x] generation-track and clear session auto-advance; use monotonic onboarding stability
- [x] add onboarding handoff, stop-during-acquire, stale auto-advance, and concurrent restart tests
- [x] retain independent persistence failures and retries
- [x] report DB initialization and partial-record validation failures
- [x] fully validate versioned session/import record shapes and add migration/rejection tests

## Native persistence and governance

- [x] grant minimum SQL execute capability and add deterministic capability/CRUD smoke evidence
- [x] read PR body safely from event JSON and set minimal workflow permissions
- [x] bind OpenSpec implementation guard to an explicit active change declaration
- [x] add injection and unrelated-change negative tests
- [x] run governance self-tests in full verify and align Make multi-change targets
- [x] extend Tauri contract evidence to argument/result signatures
- [x] triage all current npm advisories with owner, exposure, remediation, and review date

## Rust audio verification

- [x] inject backend factory beneath production capture/drone owner loops
- [x] add build-fail, play-fail, runtime-error, stale-callback, and timeout tests
- [x] generation-scope stream callbacks and clear active metadata on failure
- [x] bound owner acknowledgements and expose typed unavailable/interrupted errors
- [x] correct permission/backend error classification and remove ineffective stop state

## Verification

- [x] run canonical frontend/Rust verification and native app launch
- [x] run SQLite capability/CRUD, PR-injection, guard-bypass, contract-signature, and dependency-policy checks
- [x] refresh workflow evidence and pass `change-done.sh --change engineering-quality-hardening-followup`
