# Delta: Milestone Sync

## ADDED Requirements

### Requirement: Canonical milestone sync command
The repository SHALL provide a deterministic command to refresh canonical milestone state for an active change.

#### Scenario: Milestone sync runs with a summary
- **WHEN** `workflow/scripts/milestone-sync.sh --summary "..."` runs for an active change
- **THEN** it SHALL refresh `workflow/state/task-registry.md`
- **AND** ensure `openspec/changes/<change-id>/verification.md` exists
- **AND** ensure a matching report exists in `workflow/state/reports/`
- **AND** append a milestone entry to canonical workflow state
- **AND** rewrite `workflow/state/NEXT-SESSION.md`

### Requirement: Canonical freshness check
The repository SHALL detect implementation changes that are not reflected in canonical milestone artifacts.

#### Scenario: Staged code changes have no milestone updates
- **WHEN** `workflow/scripts/milestone-check.sh --staged --mode enforce` runs and staged code changes exist
- **AND** no matching canonical milestone updates are present
- **THEN** the check SHALL exit non-zero
- **AND** print a helper command for refreshing milestone state

#### Scenario: Range check runs in warning mode
- **WHEN** `workflow/scripts/milestone-check.sh --range "<git-range>" --mode warn` runs and code changes exist without milestone updates
- **THEN** the check SHALL print a warning
- **AND** exit zero
