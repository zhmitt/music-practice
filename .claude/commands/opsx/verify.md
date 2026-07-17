---
name: opsx-verify
description: Verify that an active change has enough evidence to be considered complete.
category: workflow
tags: [verification, post-implementation, quality]
---

Read the active change, its `tasks.md`, and related workflow state.

Then:

1. use `workflow/scripts/milestone-sync.sh --summary "<what changed>"` for meaningful checkpoints during implementation
2. run `workflow/scripts/post-impl-prepare.sh --summary "<what changed>"` when preparing final completion evidence
3. review and refine the generated `verification.md` and matching report if they need more detail
4. ensure tasks are complete
5. run `workflow/scripts/post-impl-check.sh`
