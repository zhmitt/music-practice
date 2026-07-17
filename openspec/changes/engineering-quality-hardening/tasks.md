# Tasks: engineering-quality-hardening

## Audit and contracts

- [x] document the full quality audit and accepted engineering decisions
- [x] update the runtime architecture documentation
- [x] introduce a typed frontend Tauri command map and deterministic Rust/frontend contract check
- [x] add versioned runtime validation for persisted browser records

## Audio correctness

- [x] make capture and drone startup transactional with failure-path regression tests
- [x] remove unsafe CPAL stream `Send`/`Sync` implementations through single-thread ownership
- [x] introduce frontend audio leases and migrate all direct capture consumers
- [x] serialize session and ToneLab polling, invalidate stale generations, and use monotonic hold time
- [x] add delayed-IPC, double-start, stop-during-request, and overlapping-owner tests

## Persistence correctness

- [x] return typed persistence results instead of swallowing write failures
- [x] expose degraded persistence state and retry behavior in domain stores/UI
- [x] add quota, malformed-record, rejected-SQLite-write, and reload regression tests

## Delivery and governance

- [x] repair the existing ESLint and Clippy baseline
- [x] add one canonical local/CI verify entrypoint and retire or repair legacy Makefile routes
- [x] remove lint and Clippy soft-fails from CI
- [x] fail OpenSpec CI when implementation changes have no changed change artifact
- [x] add focused browser integration and desktop/audio smoke tiers
- [x] add report-only dependency audit with reviewed exceptions

## Verification

- [x] run frontend check, lint, format check, build, unit, and integration tests
- [x] run Rust fmt, check, test, and strict Clippy
- [x] run negative tests for OpenSpec code-only changes and contract drift
- [x] record macOS desktop/audio smoke evidence or explicitly retain it as hardware-blocked evidence
- [x] refresh canonical workflow artifacts and pass `workflow/scripts/change-done.sh --change engineering-quality-hardening`
