---
name: opsx-archive
description: Archive a fully verified change into OpenSpec history.
category: workflow
tags: [archive, openspec, completion]
---

Before archiving, confirm that:

1. `workflow/scripts/post-impl-check.sh` passes
2. the change has complete specs, tasks, and verification evidence

Prefer `openspec archive <change-id>` when the OpenSpec CLI is available.
After archiving, refresh `workflow/state/task-registry.md`.

