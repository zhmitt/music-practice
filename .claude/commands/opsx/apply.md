---
name: opsx-apply
description: Implement work from an active OpenSpec change using canonical workflow artifacts.
category: workflow
tags: [openspec, implementation, tasks]
---

Read `AGENTS.md`, the active change under `openspec/changes/`, and `workflow/state/task-registry.md` first.

Then:

1. implement tasks from `tasks.md`
2. update canonical artifacts as understanding changes
3. keep the main agent in an orchestration role when subagents can do scoped work
4. refresh operational state with `workflow/scripts/tasks-sync.sh`

