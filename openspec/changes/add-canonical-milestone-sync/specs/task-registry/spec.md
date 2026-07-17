# Delta: Task Registry

## ADDED Requirements

### Requirement: Task registry drift detection
The repository SHALL provide a deterministic way to detect when the generated task registry is stale.

#### Scenario: Task registry differs from generated output
- **WHEN** `workflow/scripts/tasks-sync.sh --check` runs and `workflow/state/task-registry.md` does not match the generated content
- **THEN** the script SHALL exit non-zero
- **AND** report that the task registry needs refresh
