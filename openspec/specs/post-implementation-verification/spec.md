# Capability Spec: Post-Implementation Verification

## Purpose

Ensure code and behavior changes leave canonical evidence before commit.

## Current State

- `workflow/scripts/post-impl-check.sh` is the canonical gate.
- `.git-hooks/pre-commit` enforces the staged evidence check.
- Verification evidence belongs in `openspec/`, `workflow/state/`, or `docs/`.

## Requirements

### Requirement: Evidence before commit

Code changes MUST be accompanied by canonical verification evidence.

#### Scenario: staging implementation files

- **WHEN** staged code files exist
- **THEN** `workflow/scripts/post-impl-check.sh --staged` requires staged evidence in canonical documentation files
- **AND** the commit is blocked if that evidence is missing

### Requirement: Completed change verification

Finished changes MUST carry verification artifacts before archival.

#### Scenario: archiving a change

- **WHEN** all tasks in a change are complete
- **THEN** `verification.md`, a status entry, and a workflow report exist
- **AND** the change is only ready for archive after that evidence exists
