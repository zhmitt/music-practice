# Proposal: engineering-quality-hardening

## Why

The 2026-07-17 engineering quality audit found that the current green build and unit-test baseline does not protect ToneTrainer's most important runtime boundaries. Audio startup can publish an invalid running state, asynchronous polling can overlap and distort practice progress, persistence failures are hidden, and CI intentionally soft-fails lint and Clippy. The OpenSpec CI gate can also pass implementation-only changes without resolving a change.

These are correctness and delivery risks on the core student practice path, not cosmetic cleanup.

## What changes

- make audio startup transactional and move CPAL stream ownership behind an enforced single-thread boundary
- centralize frontend audio ownership so overlapping practice consumers cannot stop one another's capture
- serialize pitch polling and measure hold progress with monotonic elapsed time
- make persistence failures observable and validate persisted records at runtime
- establish a typed IPC command boundary and contract-drift check
- repair the current lint and Clippy baseline, align local and CI verification, and close the OpenSpec implementation-only fail-open path
- add focused failure-path, integration, and runtime-smoke evidence for the affected boundaries
- update architecture and audit documentation to describe the implemented runtime accurately

## Impact

- protects onboarding, guided sessions, ToneLab, PlayAlong, progress history, and the desktop audio lifecycle
- makes CI results match repository quality claims
- reduces cross-language and persisted-data drift during future feature delivery
- does not replace the pending real macOS microphone, permission, and alternate-device user test
