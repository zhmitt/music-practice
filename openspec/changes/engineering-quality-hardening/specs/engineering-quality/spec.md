# Delta: Engineering Quality

## ADDED Requirements

### Requirement: Transactional audio lifecycle

The application SHALL publish audio capture or drone playback as running only after the selected backend stream has been built and started successfully.

#### Scenario: Audio backend start fails
- **WHEN** stream construction or playback fails
- **THEN** the operation SHALL return a typed error
- **AND** running state SHALL remain false
- **AND** a later retry SHALL be allowed without an explicit cleanup call

### Requirement: Enforced stream thread ownership

The application SHALL create, operate, and drop each CPAL stream on one owning thread without unsafe `Send` or `Sync` implementations for stream holders.

#### Scenario: Another subsystem requests audio lifecycle work
- **WHEN** a frontend command or analysis worker requests start, stop, or restart
- **THEN** the request SHALL be sent to the owning audio thread
- **AND** the caller SHALL receive an explicit result

### Requirement: Shared audio leases

Frontend features SHALL acquire named leases for shared audio capture, and capture SHALL stop only after the final active lease is released.

#### Scenario: Two practice features overlap
- **WHEN** two features hold capture leases and one feature exits
- **THEN** capture SHALL remain active for the remaining owner

### Requirement: Deterministic practice timing

Pitch polling SHALL be single-flight per active generation, and practice hold progress SHALL use monotonic elapsed time rather than fixed timer increments.

#### Scenario: IPC response exceeds the polling interval
- **WHEN** a pitch request completes after the nominal next interval
- **THEN** no overlapping request SHALL be started for that generation
- **AND** one sample SHALL contribute at most one bounded elapsed-time increment

### Requirement: Observable durable persistence

Persistence writes SHALL expose success or failure to callers, and persisted JSON SHALL be versioned and runtime-validated before it enters domain state.

#### Scenario: A session write fails
- **WHEN** SQLite or localStorage rejects the write
- **THEN** the store SHALL expose degraded persistence state
- **AND** retain enough information to retry or clearly report the unsaved record

#### Scenario: A persisted record is malformed
- **WHEN** a stored record fails runtime validation
- **THEN** the record SHALL be isolated from domain state
- **AND** the failure SHALL be observable without silently replacing invalid fields with defaults

### Requirement: Closed quality gates

CI SHALL run the repository's canonical verification entrypoint and SHALL fail for lint, strict Clippy, contract drift, or implementation changes without a matching OpenSpec change artifact.

#### Scenario: Implementation-only pull request
- **WHEN** a pull request changes implementation files but no path under `openspec/changes/<change-id>/`
- **THEN** the OpenSpec gate SHALL fail with an actionable message

### Requirement: Layered runtime evidence

Core student flows SHALL have deterministic boundary tests, while hardware-dependent microphone behavior SHALL retain an explicit macOS desktop smoke requirement.

#### Scenario: Automated verification runs without audio hardware
- **WHEN** CI runs on a host without the supported microphone environment
- **THEN** injected backend failure and lifecycle tests SHALL still run
- **AND** CI SHALL not claim that real permission, device selection, or sample capture was verified
