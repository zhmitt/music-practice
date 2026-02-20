---
name: session-closure
description: Persist end-of-session context into memory files and synchronize task state. Use when ending a work session to keep fast resume quality high across branches and features.
---

# Session Closure

Run:

```bash
codex/scripts/session-close.sh --summary "<what was completed and what is next>"
```

This workflow:

1. Syncs task registry
2. Appends session summary to `status.md`
3. Appends resume context to `NEXT-SESSION.md`

Use this before ending each coding session.

