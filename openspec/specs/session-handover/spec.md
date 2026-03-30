# Capability Spec: Session Handover

## Purpose

Preserve short, accurate context for the next work session without using legacy memory files as the live source.

## Current State

- `workflow/state/status.md` is the append-only status log.
- `workflow/state/NEXT-SESSION.md` is the canonical resume surface.
- `workflow/scripts/session-close.sh` updates both files.

## Requirements

### Requirement: Canonical handover files

Session handover MUST live in `workflow/state/`.

#### Scenario: closing a session

- **WHEN** `workflow/scripts/session-close.sh --summary "..."` runs
- **THEN** it updates `workflow/state/status.md`
- **AND** it rewrites `workflow/state/NEXT-SESSION.md`
- **AND** it does not append to `.specify/memory/NEXT-SESSION.md`

### Requirement: Resume clarity

The next session file MUST describe the current active changes or say that none are active.

#### Scenario: no active change exists

- **WHEN** no change is active in `openspec/changes/`
- **THEN** `workflow/state/NEXT-SESSION.md` points to creating or activating the next change
