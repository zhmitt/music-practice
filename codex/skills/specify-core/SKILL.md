---
name: specify-core
description: Detect and enforce the current spec-driven phase for this repository. Use when starting or resuming work, deciding the next action in the feature lifecycle, or validating whether a branch is ready for planning, tasks, implementation, or post-implementation.
---

# Specify Core

Run `codex/scripts/phase-detect.sh --json`.

Use returned phase gates:

1. `0`: create spec
2. `1`: create plan
3. `2`: run spec review and generate tasks
4. `3`: implement open tasks
5. `4`: run post-implementation

Never skip forward if required artifacts are missing.

