---
name: opsx-close-session
description: Close the current session with deterministic state updates.
category: workflow
tags: [session, handover, workflow]
---

Read current status from canonical files, then run:

```bash
workflow/scripts/session-close.sh --summary "<summary>"
```

Use this command to produce handover context for the next tool or next operator.

This remains a deliberate manual step. Do not auto-run it without a real summary of what changed and what is next.
