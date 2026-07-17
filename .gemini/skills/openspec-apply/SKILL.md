---
name: openspec-apply
description: Implement active OpenSpec tasks while keeping canonical state current.
---

Read the active change and `workflow/state/task-registry.md` first.

Keep the main agent in an orchestration role.
For bounded coding work, prefer `@opsx-implementer`.

Implement from `tasks.md`, refresh state with `workflow/scripts/tasks-sync.sh`, and use `workflow/scripts/milestone-sync.sh --summary "<what changed>"` at meaningful checkpoints.
