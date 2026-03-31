---
name: session-close
description: Close the current session with deterministic workflow updates.
---

Run:

```bash
workflow/scripts/session-close.sh --summary "<what was done and what is next>"
```

This keeps handover data in `workflow/state/`.
It is intentionally manual because the quality of the summary matters.
