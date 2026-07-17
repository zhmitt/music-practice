# Design: engineering-quality-hardening-followup

## Decisions

### Decision 1: Leases are handles, not owner booleans

Audio acquisition SHALL return an idempotent lease handle carrying owner and generation. A stale consumer SHALL dispose the exact acquired handle. Device restart SHALL run through the same transition queue as acquire/release. Onboarding SHALL release before starting the first session rather than relying on component destruction.

### Decision 2: Every delayed action belongs to a generation

Polling, auto-advance, and onboarding stability SHALL derive from monotonic time and validate the active generation before mutating state. Stop/restart SHALL invalidate and clear all delayed actions.

### Decision 3: Persistence failures are independently recoverable

Persistence state SHALL retain failures by operation identity. An unrelated successful write SHALL NOT clear another failed write. Database initialization and rejected/partially corrupt records SHALL create observable failures. Runtime validators SHALL validate complete domain record shapes and explicitly reject unsupported versions.

### Decision 4: Native SQLite permissions are least-privilege and executable

The main window SHALL receive the SQL execute permission required by schema and CRUD operations. A native or capability-level smoke SHALL prove create/read/update/delete behavior and that the permission is explicitly declared.

### Decision 5: CI treats PR content as data

PR text SHALL be read from `GITHUB_EVENT_PATH`, never interpolated into shell source. Workflows SHALL declare minimal permissions. Implementation guards SHALL require an explicitly declared, non-archived active change and reject unrelated historical path-touching.

### Decision 6: Audio tests cross the production owner boundary

Capture and drone owner loops SHALL depend on an injected backend factory that can produce BuildFail, PlayFail, RuntimeError, and stalled acknowledgements. Stream callbacks SHALL carry a generation and may only update matching active state. Owner requests SHALL have bounded acknowledgement timeouts and expose typed unavailable/interrupted state.

### Decision 7: Governance claims match actual evidence

Full local verification SHALL include negative governance self-tests. The Tauri contract gate SHALL compare command signatures through a deterministic manifest or generated bindings, not names alone. Dependency advisories SHALL have owner, exposure decision, remediation, and review date.

## Trade-offs

- Tokenized leases and per-failure persistence state add small state machines, but eliminate ambiguity in concurrent lifecycle paths.
- Owner timeouts cannot safely kill a wedged platform thread; they make the failure bounded and observable instead.
- A signature manifest remains less powerful than full cross-language generation, but materially improves the current name-only evidence at lower adoption cost.
