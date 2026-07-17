# Engineering Quality Delta

## ADDED Requirements

### Requirement: Remote CI is schema-valid and runs for pull requests

The repository SHALL validate GitHub workflow syntax and SHALL run the canonical quality jobs for pushes to `main` and pull requests.

#### Scenario: Pull-request workflow trigger

- **WHEN** the CI workflow is parsed
- **THEN** `pull_request` is a workflow event under `on`
- **AND** every declared permission key is supported by GitHub Actions

### Requirement: Audio ownership recovers transactionally

Frontend audio ownership SHALL remain consistent with confirmed native capture state across start, restart, stop, and cleanup failures.

#### Scenario: Restart start fails

- **WHEN** capture stops during restart and the replacement start fails
- **THEN** subsequent acquisition can retry native start
- **AND** no lease is presented as proof that capture is running

#### Scenario: Final stop fails

- **WHEN** the final owner releases and native stop fails
- **THEN** a retryable recovery owner remains attributable
- **AND** callers receive actionable failure state

### Requirement: ToneLab cleanup completes across partial failure

ToneLab SHALL attempt all owned-resource cleanup even when drone stop fails, and stale asynchronous starts SHALL NOT reactivate a superseded mode.

### Requirement: Native audio failure is bounded and observable

Known command timeouts SHALL NOT force an unconditional synchronous owner join. Runtime interruption SHALL be exposed as typed status, and samples from inactive generations SHALL NOT update analysis.

### Requirement: Exported Tauri commands are exhaustively contracted

Every handler in `generate_handler!` SHALL have one parseable Rust signature and one matching frontend declaration. Unsupported or missing signatures SHALL fail verification.

### Requirement: Workflow lifecycle tests are deterministic

Governance self-tests SHALL use isolated fixtures and SHALL validate both active implementation and completed archive transitions without depending on mutable live changes.

### Requirement: Persistence recovery clears stale health failures

A successful read or validation of the same persistence identity SHALL clear its prior read/validation failure. Persisted records SHALL satisfy documented calendar and count invariants.

### Requirement: Evidence types remain explicit

Host SQLite, mocked plugin tests, hosted CI, packaged WebView CRUD, and physical audio tests SHALL be reported as distinct evidence and SHALL NOT substitute for one another.
