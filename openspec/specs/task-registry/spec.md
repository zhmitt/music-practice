# Task Registry

## Requirements

### Requirement: Deterministic task aggregation
The repository SHALL maintain a deterministic task registry derived from active OpenSpec changes.

#### Scenario: Tasks exist in active changes
- **WHEN** one or more active changes contain `tasks.md`
- **THEN** `workflow/scripts/tasks-sync.sh` SHALL aggregate them into `workflow/state/task-registry.md`

### Requirement: Registry reflects execution state
The task registry SHALL summarize backlog, active, and archived or completed work at the workflow layer.

#### Scenario: Registry is regenerated
- **WHEN** `tasks-sync.sh` runs
- **THEN** the generated registry SHALL describe task completion progress per change
- **AND** it SHALL distinguish active work from archived work

### Requirement: Registry drift is detectable
The repository SHALL provide a deterministic way to detect when the generated task registry is stale.

#### Scenario: Task registry differs from generated output
- **WHEN** `workflow/scripts/tasks-sync.sh --check` runs and `workflow/state/task-registry.md` does not match the generated content
- **THEN** the script SHALL exit non-zero
- **AND** report that the task registry needs refresh
