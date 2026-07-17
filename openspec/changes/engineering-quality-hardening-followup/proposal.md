# Proposal: engineering-quality-hardening-followup

## Why

The post-hardening audit proved that the repository baseline is green but found residual correctness and governance defects at the exact boundaries the first hardening pass introduced: ToneLab cannot reliably stop a successful drone, audio leases can be orphaned during lifecycle races, native SQLite writes are not explicitly permitted, and untrusted PR text is interpolated into shell source. The current audio tests also stop above the production owner/build/play boundary.

## What changes

- fix ToneLab drone state and make start/stop idempotent
- make audio leases tokenized, generation-safe, restart-serialized, and explicit across onboarding/session handoff
- generation-track all delayed session actions and monotonic onboarding stability
- retain concurrent persistence failures until their own retry succeeds; report initialization and partial-validation failures
- grant and smoke-test the minimum native SQLite execute capability
- remove PR-body shell interpolation, constrain workflow permissions, and bind implementation guards to explicit active changes
- include governance self-tests in the full local verify path and repair multi-change Make targets
- expand Tauri contract evidence beyond command names
- inject the production audio owner boundary for build/play/runtime failure tests, add stream generations, typed runtime errors, and bounded acknowledgements
- triage each current dependency advisory instead of leaving an empty report-only policy

## Impact

- prevents audible drone leaks, capture leaks, stale session transitions, hidden persistence loss, and native SQLite permission failures
- closes a CI command-injection path and weak OpenSpec ownership check
- upgrades audio verification from wrapper behavior to the production owner protocol
- preserves real macOS microphone/device testing as explicit hardware evidence
