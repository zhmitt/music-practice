---
name: post-implementation
description: Enforce post-implementation completion checks for code changes. Use before commit or merge to verify documentation/memory updates and ensure the implementation is formally closed.
---

# Post-Implementation

Run `codex/scripts/post-impl-check.sh` before commit.

Use:

- `codex/scripts/post-impl-check.sh` for staged-change validation
- `codex/scripts/post-impl-check.sh --working-tree` for unstaged validation
- `codex/scripts/post-impl-check.sh --run-tests` to include automated tests

Block commit if checks fail.

