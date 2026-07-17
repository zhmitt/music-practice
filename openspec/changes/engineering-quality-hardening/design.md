# Design: engineering-quality-hardening

## Context

ToneTrainer is a SvelteKit/Tauri desktop application. Frontend stores currently share one Rust audio engine through stringly typed commands, poll it on independent timers, and persist state through a dual SQLite/localStorage adapter. The codebase has useful domain tests but limited boundary and failure-path evidence.

## Decisions

### Decision 1: One thread owns each CPAL stream

Capture and drone streams SHALL be created, played, and dropped on their owning audio thread. Other threads communicate through channels and receive explicit lifecycle results. Production code SHALL NOT use unsafe `Send` or `Sync` implementations for CPAL stream holders.

Audio startup is transactional: the public running state changes only after the backend has built and started the stream successfully. Failed start and failed restart leave the engine stopped and retryable.

### Decision 2: Frontend consumers acquire audio leases

A single frontend audio coordinator SHALL own start/stop calls. Session, ToneLab, PlayAlong, onboarding, and settings diagnostics acquire named leases. Capture stops only after the last lease is released. Device changes trigger a coordinated restart without invalidating active owners.

### Decision 3: Polling is single-flight and time is monotonic

Pitch polling SHALL never overlap within one consumer generation. Practice hold duration derives from monotonic elapsed time between accepted samples, with a bounded delta after pauses or stalls. Start and stop invalidate old generations so late IPC responses cannot mutate a newer session.

### Decision 4: Persistence reports durable outcome

Persistence writes SHALL return a typed success or failure result. Stores may use optimistic in-memory updates, but failures SHALL set an observable degraded state and retain retry information. Persisted browser records SHALL be validated and versioned before entering domain state; corrupt records are reported and isolated rather than silently coerced.

### Decision 5: Contracts have one typed frontend boundary

All Tauri command names and argument/result types SHALL be declared in one TypeScript command map and invoked through one typed helper. A deterministic contract check SHALL compare the exposed Rust command set with the frontend map. Runtime schemas remain necessary for untrusted persisted JSON.

### Decision 6: Quality gates fail closed after baseline repair

The repository SHALL expose one canonical verification entrypoint used by CI. ESLint and Clippy SHALL block after the current baseline is green. An implementation diff without a changed OpenSpec change path SHALL fail the OpenSpec gate with an actionable message.

Dependency advisories start report-only with an explicit reviewed allowlist because advisory severity alone does not prove desktop exploitability. Coverage remains report-only until the critical boundary tests exist.

### Decision 7: Hardware evidence remains explicit

Automated tests SHALL use injected/fake audio backends for deterministic failure paths. A macOS Tauri smoke script/checklist SHALL record permission, selected device, sample receipt, stop, and restart. Hardware-dependent evidence is not replaced by unit tests and remains a completion prerequisite for the existing audio/app-shell changes.

## Trade-offs

- Dedicated audio ownership and leases add lifecycle code, but remove unsafe and ambiguous ownership from a business-critical boundary.
- A typed command map does not provide full cross-language code generation, but gives an incremental deterministic drift gate without introducing a large generator toolchain.
- Persistence may remain optimistic for responsive UI, but failures become explicit and retryable.
