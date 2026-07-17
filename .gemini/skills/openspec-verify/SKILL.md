---
name: openspec-verify
description: Verify evidence before a change is considered complete.
---

Prefer `@opsx-verifier` for isolated verification work.

Use `workflow/scripts/milestone-sync.sh --summary "<what changed>"` for progress checkpoints, then use `workflow/scripts/post-impl-check.sh` for final completion and ensure `verification.md`, status entries, and reports exist.
