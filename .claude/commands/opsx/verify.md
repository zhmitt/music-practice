---
name: opsx-verify
description: Verify that an active change has enough evidence to be considered complete.
category: workflow
tags: [verification, post-implementation, quality]
---

Read the active change, its `tasks.md`, and related workflow state.

Then:

1. ensure tasks are complete
2. write or update `verification.md` in the change folder if needed
3. update `workflow/state/status.md` and a matching report in `workflow/state/reports/`
4. run `workflow/scripts/post-impl-check.sh`

