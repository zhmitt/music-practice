---
name: tasks-registry
description: Rebuild and validate the task registry from feature tasks files. Use when tasks change, at session checkpoints, or before prioritization decisions that depend on accurate active/backlog/completed status.
---

# Tasks Registry

Run `codex/scripts/tasks-sync.sh` after task updates.

Use options:

- `codex/scripts/tasks-sync.sh` for full rebuild
- `codex/scripts/tasks-sync.sh --feature 001` for targeted sync
- `codex/scripts/tasks-sync.sh --dry-run` to inspect output

Treat `.specify/memory/task-registry.md` as generated from `tasks.md` files.

