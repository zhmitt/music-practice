# Git Hooks

This directory contains compatibility hooks for the canonical OpenSpec hybrid workflow.

## Install

```bash
cd .git-hooks
./install.sh
```

## Hook: pre-commit

Checks:

1. New writes into frozen legacy `.specify/` are blocked.
2. Stale `workflow/state/task-registry.md` is blocked when tasks changed.
3. Code commits require canonical evidence in `openspec/`, `workflow/state/`, or `docs/`.
4. New inline `TODO`/`FIXME`/`XXX` comments are blocked.

If blocked, address the message and retry commit.
