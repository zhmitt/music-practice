# Delta: Engineering Quality Follow-up

## ADDED Requirements

### Requirement: Exact audio lease disposal

Every successful audio acquisition SHALL return an idempotent handle that releases the exact acquisition even when the requesting consumer becomes stale before acquisition completes.

#### Scenario: Stop occurs while acquisition is pending
- **WHEN** a consumer stops before its acquisition resolves
- **AND** acquisition later succeeds
- **THEN** the stale consumer SHALL immediately dispose its lease
- **AND** capture SHALL stop when no other lease remains

### Requirement: Idempotent drone lifecycle

ToneLab SHALL record successful void command completion as active and SHALL send one stop command when the drone is active.

#### Scenario: Successful drone session
- **WHEN** start resolves successfully and ToneLab stops
- **THEN** drone state SHALL become active then inactive
- **AND** stop SHALL be invoked exactly once

### Requirement: Generation-bound delayed work

All delayed session and audio callbacks SHALL validate the generation that created them before mutating shared state.

#### Scenario: Session restarts before auto-advance
- **WHEN** an old session schedules auto-advance and a new session starts first
- **THEN** the old callback SHALL NOT change the new session

### Requirement: Independent persistence recovery

Persistence failures SHALL remain observable until that exact failure is recovered or explicitly dismissed.

#### Scenario: Unrelated write succeeds after a failed session save
- **WHEN** session persistence fails and a later preference write succeeds
- **THEN** the session failure and retry SHALL remain available

### Requirement: Authorized native CRUD

The Tauri capability set SHALL explicitly authorize the SQL operations used by the application and a deterministic check SHALL prove the declaration and CRUD behavior.

### Requirement: Safe pull-request content handling

CI SHALL read untrusted pull-request text from the event JSON as data and SHALL NOT interpolate it into executable shell source.

### Requirement: Explicit active-change ownership

Implementation changes SHALL declare one or more active, non-archived OpenSpec change IDs; touching an unrelated historical change file SHALL NOT satisfy the guard.

### Requirement: Production-boundary audio failure evidence

Audio owner-loop tests SHALL exercise injected build, play, runtime, stale-generation, and timeout behavior through the same production protocol used by CPAL streams.

### Requirement: Signature-level IPC parity

The deterministic Tauri contract gate SHALL compare command argument and result signatures in addition to command names.
