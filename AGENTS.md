# AGENTS.md - Codex Workflow (v1)

This repository supports two orchestration styles:

- Claude Code setup in `.claude/`
- Codex-native setup in `codex/`

Use the Codex setup below when working in the Codex app.

## Core Rules

1. Spec-driven development stays mandatory for non-trivial work.
2. Use deterministic scripts for state checks and registry updates.
3. Do not commit code changes without post-implementation evidence.

## Skills

### Available skills

- `specify-core`  
  file: `codex/skills/specify-core/SKILL.md`  
  use when: start/resume session, ask for next step in lifecycle, phase validation

- `tasks-registry`  
  file: `codex/skills/tasks-registry/SKILL.md`  
  use when: tasks changed, registry seems stale, prioritization depends on current task state

- `post-implementation`  
  file: `codex/skills/post-implementation/SKILL.md`  
  use when: before commit/merge after code changes, post-impl quality gate checks

- `session-closure`  
  file: `codex/skills/session-closure/SKILL.md`  
  use when: ending a work session, writing next-session context

### Trigger rules

- If user asks for next lifecycle step: use `specify-core`.
- If user asks about task status/progress sync: use `tasks-registry`.
- If user asks to finalize/prepare commit after coding: use `post-implementation`.
- If user asks to wrap up the session: use `session-closure`.

## Codex Runtime Commands

Use these scripts as the canonical workflow surface:

```bash
codex/scripts/phase-detect.sh
codex/scripts/tasks-sync.sh
codex/scripts/post-impl-check.sh
codex/scripts/session-close.sh --summary "..."
```

## Suggested sequence

1. `specify-core`
2. `tasks-registry`
3. `post-implementation`
4. `session-closure`
