---
name: openspec-apply
description: Implement tasks from an active OpenSpec change while preserving canonical workflow state.
---

Read the active change and `workflow/state/task-registry.md`.

Implement from `tasks.md`, keep specs current, refresh the task registry with `workflow/scripts/tasks-sync.sh`, and use `workflow/scripts/milestone-sync.sh --summary "<what changed>"` at meaningful checkpoints.
