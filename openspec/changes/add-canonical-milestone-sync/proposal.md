# Proposal: add-canonical-milestone-sync

## Why

The repository already stores canonical change state in `openspec/changes/` and `workflow/state/`, but the current workflow only refreshes that state reliably at session close or near final verification.

That leaves a drift window where implementation moves forward through normal commits while `verification.md`, `status.md`, `task-registry.md`, and `NEXT-SESSION.md` still describe an older milestone.

## What changes

- add a repo-local milestone sync command for meaningful implementation checkpoints
- add a deterministic milestone freshness check with `warn` and `enforce` modes
- extend task registry support with a drift check mode
- document the new canonical workflow surface and update thin tool adapters to point at it

## Impact

- improves discoverability of the current implementation state from canonical artifacts alone
- keeps derived files deterministic while leaving narrative artifacts human-reviewable
- enables optional pre-commit, pre-push, and CI enforcement without moving governance into adapters
