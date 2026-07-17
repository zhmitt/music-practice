---
description: Verify that an active change has enough evidence to be considered complete.
argument-hint: change id
---

Use `workflow/scripts/milestone-sync.sh --summary "<what changed>"` for meaningful checkpoints. When the change is ready for completion, ensure `verification.md`, `workflow/state/status.md`, and a matching report exist, then run `workflow/scripts/post-impl-check.sh`.
