# Engineering Quality V4 Delta

## ADDED Requirements

### Requirement: Runtime ownership remains recoverable

Failed capture/drone transitions and component destruction SHALL preserve attributable cleanup or reconcile against native status. Existing active owners SHALL receive actionable recovery rather than waiting for an unrelated future owner.

### Requirement: Audio batches and runtime status are generation-safe

Samples invalidated during a read SHALL NOT update analysis. Runtime failures SHALL use a stable tagged boundary DTO consumed by the product UI. Background processing SHALL support deterministic cancellation and teardown.

### Requirement: Persistence reads preserve valid visible state

Native read failure SHALL be distinguishable from an empty result and SHALL NOT overwrite valid in-memory history. Browser and SQLite records SHALL share semantic validation, and a valid missing key SHALL acknowledge prior corruption failures.

### Requirement: Delivery governance is independently fail-closed

Workflow validation SHALL run independently of the workflow under test and SHALL include exhaustive schema validation. Archive validation SHALL require exact, structured completion evidence and local staged gates SHALL derive archived change identities correctly.

### Requirement: Boundary inventory is structurally complete

Tauri DTO field shapes and dependency advisory identities/paths SHALL be validated, not only command type names or aggregate package severity.
