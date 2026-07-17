# Proposal: engineering-quality-hardening-v3

## Why

The verified post-hardening audit found that local success-path coverage is strong, but remote CI, failure recovery, audio teardown, contract completeness, archive governance, and native persistence evidence still have fail-open or unverified boundaries. These gaps can make valid-looking frontend ownership diverge from the native runtime and can allow changes to bypass the intended delivery gates.

## What changes

- repair and schema-validate pull-request CI
- make audio lease restart/release failures recoverable and owner-consistent
- make ToneLab cleanup failure-tolerant and invalidate stale drone starts on mode changes
- bound or quarantine wedged audio-owner teardown; expose runtime failure state and suppress stale samples
- derive the Tauri contract from every exported handler and fail on unsupported signatures
- replace live OpenSpec self-test fixtures and support archive changes explicitly
- reconcile recovered persistence reads and strengthen semantic validation
- prove packaged Tauri SQLite CRUD where the environment permits, while keeping external evidence explicit
- normalize dependency-audit parity and preserve current advisory ownership/deadlines

## Impact

- restores PR verification as an enforceable delivery boundary
- prevents capture/drone ownership leaks and misleading post-failure UI state
- prevents a blocked native audio owner from indefinitely blocking normal shutdown paths
- makes contract, archive, and dependency governance fail closed
- separates deterministic repository evidence from hardware, GitHub-hosted, and packaged-app evidence
