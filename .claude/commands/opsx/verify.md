---
name: opsx-verify
description: Verify that an active change has enough evidence to be considered complete.
category: workflow
tags: [verification, post-implementation, quality]
---

Read the active change, its `tasks.md`, and related workflow state.

Then:

1. run `workflow/scripts/post-impl-prepare.sh --summary "<what changed>"`
2. review and refine the generated `verification.md` and matching report if they need more detail
3. ensure tasks are complete
4. run `workflow/scripts/post-impl-check.sh`
