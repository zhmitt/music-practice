---
name: session-close
description: Close the session with deterministic state updates in workflow/state/.
---

Run:

```bash
workflow/scripts/session-close.sh --summary "<what changed and what comes next>"
```

Prefer `@opsx-session-closer` if a separate handover pass will keep the main context cleaner.
