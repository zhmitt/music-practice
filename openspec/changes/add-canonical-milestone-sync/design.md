# Design: add-canonical-milestone-sync

## Context

The repository already distinguishes:

- OpenSpec change intent in `openspec/changes/`
- deterministic workflow state in `workflow/`
- optional native UX in `.claude/`, `.gemini/`, and `.codex/`

What it lacks is a canonical milestone boundary between "implementation is moving" and "the repo state was refreshed to describe that movement."

## Decisions

### Decision 1: Add a dedicated milestone sync command
`workflow/scripts/milestone-sync.sh` becomes the repo-local helper for checkpointing meaningful progress.

It will:

- resolve the active change
- refresh `workflow/state/task-registry.md`
- scaffold `verification.md` and the workflow report if missing
- append a milestone entry to `verification.md`, the report, and `workflow/state/status.md`
- rewrite `workflow/state/NEXT-SESSION.md`

This keeps milestone updates deterministic without collapsing session close and milestone sync into the same command.

The command may still preserve repo-local carry-over guidance in `workflow/state/NEXT-SESSION.md` when that guidance is explicitly marked as preserved context. That allows workflow-infrastructure milestones to land without erasing product-facing follow-up context for other active changes.

### Decision 2: Keep milestone narrative artifacts human-editable
The sync command will scaffold and append reviewable markdown entries, not silently rewrite scope-bearing specs or task intent.

Derived artifacts such as `workflow/state/task-registry.md` can be regenerated automatically. Narrative artifacts remain append-only or explicitly rewritten views.

### Decision 3: Add a lightweight freshness check
`workflow/scripts/milestone-check.sh` will detect code changes without matching milestone updates.

Version 1 supports:

- staged checks for local development
- diff-range checks for push or CI flows
- `warn` and `enforce` modes

The check stays intentionally simple: it verifies that code changes are accompanied by canonical milestone evidence and that the task registry is not stale.

### Decision 4: Keep commit linkage optional in version 1
The implementation will not require commit trailers or post-commit SHA recording yet.

That behavior can be added later, but it is not required to stop the current drift problem.

## Trade-offs

- The check is milestone-aware, not fully commit-aware with exact SHA attribution.
- Multiple active changes still require explicit `--change` selection for precise updates.
- Some logic remains duplicated across shell scripts to keep the first implementation slice smaller and easier to propagate.
