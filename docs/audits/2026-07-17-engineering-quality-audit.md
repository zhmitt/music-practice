# Engineering Quality Audit — 2026-07-17

## Scope

ToneTrainer's SvelteKit/Tauri runtime, Rust audio engine, frontend state and persistence, tests, CI, OpenSpec governance, architecture documentation, and representative web runtime routes were audited. Real macOS microphone, permission, alternate-device, bundle, and GitHub branch-protection behavior were not directly verifiable in the audit environment.

## Baseline

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | pass | install completed; dependency advisories reported |
| `npm run check` | pass | 0 errors and 0 warnings |
| `npm run lint` | fail | 118 errors and 7 warnings |
| `npm run format:check` | fail | 76 files reported |
| `npm run build` | pass | static adapter build completed |
| `npm run test` | pass | 7 files, 119 tests |
| `cargo check` | pass | Rust crate compiled |
| `cargo test` | pass | 26 tests |
| strict Clippy | fail | `derivable_impls` warning promoted to error |
| web route smoke | pass | `/`, `/progress`, `/rhythm`, `/teacher`, `/tonelab` returned HTTP 200 |
| macOS Tauri audio smoke | not verified | real GUI/device path required |

## Findings

1. **Audio lifecycle — high/critical:** Capture and drone can publish running state before backend startup succeeds. CPAL stream holders use unsafe `Send`/`Sync` despite documented thread affinity.
2. **Quality gates — high:** ESLint and Clippy are soft-failed. OpenSpec detection skips implementation-only changes without a changed OpenSpec path.
3. **Practice timing — high:** Async 20 Hz polling is reentrant and fixed timer increments are used as elapsed time.
4. **Persistence — high:** Several write and load failures are swallowed, allowing in-memory success followed by loss after restart.
5. **Contracts — medium/high:** Rust/TypeScript IPC types, command names, and stored DTOs are manually synchronized and incompletely runtime-validated.
6. **Test boundaries — high:** Domain unit tests are useful, but audio lifecycle, IPC, persistence failure, component integration, and real desktop flows lack direct evidence.
7. **Architecture truth — medium:** `docs/architecture.md` still describes the runtime stack as undecided although SvelteKit, Tauri, SQLite, and CPAL are implemented.
8. **Dependencies — unverified exposure:** npm reported high and moderate advisories; desktop exploitability was not established and requires review rather than blind automated upgrade.

## Accepted decisions

- Treat real macOS microphone evidence as mandatory for the existing audio/app-shell changes, but not as a substitute for deterministic failure tests.
- Use a dedicated audio owner thread and frontend leases.
- Use monotonic, single-flight polling.
- Make persistence failure observable and persisted JSON versioned/validated.
- Begin IPC consolidation with a typed command map and deterministic drift check.
- Make existing lint/Clippy/OpenSpec checks blocking once the baseline is repaired.
- Start dependency and coverage governance report-only.

The implementation contract and verification scenarios live in `openspec/changes/engineering-quality-hardening/`.
