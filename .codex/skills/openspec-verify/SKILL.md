---
name: openspec-verify
description: Verify that a change has enough evidence to be treated as complete.
---

First run:

```bash
workflow/scripts/post-impl-prepare.sh --summary "<what changed>"
```

Then confirm:

- tasks are complete
- `verification.md` exists
- `workflow/state/status.md` contains a matching entry
- `workflow/state/reports/` contains a matching report

Then run `workflow/scripts/post-impl-check.sh`.
