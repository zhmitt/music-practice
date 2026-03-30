---
name: openspec-verify
description: Verify that a change has enough evidence to be treated as complete.
---

Confirm:

- tasks are complete
- `verification.md` exists
- `workflow/state/status.md` contains a matching entry
- `workflow/state/reports/` contains a matching report

Then run `workflow/scripts/post-impl-check.sh`.

