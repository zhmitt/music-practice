# Tasks: engineering-quality-hardening-v4

## Frontend and persistence

- [x] recover or explicitly fail active owners after device restart failure
- [x] retain and reconcile drone ownership after failed stop using runtime status
- [x] make PlayAlong and onboarding teardown cleanup durable across unmount/release failure
- [x] preserve visible history on transient native read failure
- [x] apply semantic session validation to SQLite rows
- [x] clear browser history failures when the corrupt key is removed
- [x] add failure-path regression tests for every frontend finding

## Rust audio

- [x] close callback-between-check-and-pop sample invalidation race
- [x] replace derived runtime error serialization with a stable tagged DTO
- [x] consume typed runtime failure in normal frontend status/recovery UI
- [x] add explicit processing-loop cancellation and deterministic teardown
- [x] add interleaving, payload-shape, and app-like loop shutdown tests

## CI and governance

- [x] run workflow validation independently of the CI workflow being validated
- [x] add pinned exhaustive GitHub Actions schema validation
- [x] require structured exact archive completion evidence
- [x] make staged archive change-ID derivation and hooks archive-aware
- [x] validate Tauri DTO field shapes across Rust, manifest, and TypeScript
- [x] validate dependency advisory identities and affected paths
- [x] rename native package evidence to native build evidence
- [x] add negative probes for each governance finding

## Verification

- [x] document deterministic and external evidence boundaries
- [x] run canonical verification and focused negative tests
- [x] refresh canonical workflow state and reports
- [x] pass `workflow/scripts/change-done.sh --change engineering-quality-hardening-v4`
