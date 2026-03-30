# AGENTS.md - OpenSpec Hybrid Workflow

This repository uses an OpenSpec-first hybrid workflow.

## Canonical Truth

The only canonical workflow surfaces are:

- [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md)
- [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec)
- [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow)

These layers are adapters or legacy reference only:

- [CLAUDE.md](/Users/mschmitt/Documents/Git/music-practice/CLAUDE.md)
- [CODEX.md](/Users/mschmitt/Documents/Git/music-practice/CODEX.md)
- [GEMINI.md](/Users/mschmitt/Documents/Git/music-practice/GEMINI.md)
- [codex/](/Users/mschmitt/Documents/Git/music-practice/codex)
- [`.specify/`](/Users/mschmitt/Documents/Git/music-practice/.specify)

## Core Rules

1. Non-trivial work stays spec-first.
2. Active work belongs in `openspec/changes/<change-id>/`.
3. Session state, roadmap, pending user tests, reports, and carry-over live in `workflow/state/`.
4. Do not create new operational truth in `codex/` or `.specify/`.
5. Do not commit implementation changes without canonical post-implementation evidence.

## Team Pattern

The preferred operating model remains:

- main agent as tech lead and orchestrator
- delegated worker agents or subagents for implementation, review, and verification
- report-back into canonical artifacts

Claude native subagents, Gemini native subagents, and Codex app multi-agent flows are valid accelerators here.

## Product-Specific Constraints

- ToneTrainer is a practice companion, not a teacher replacement.
- Feedback should stay descriptive and confidence-oriented, not punitive or gamified.
- Pitch, rhythm, and progress features must work for young learners and returning adults, not only advanced musicians.
- Because the repository currently contains product specs and mockups rather than a full runtime, changes must distinguish clearly between product intent, prototype UI, and implemented behavior.

## Workflow

### Start / Resume

1. Read [workflow/state/NEXT-SESSION.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/NEXT-SESSION.md)
2. Read [workflow/state/task-registry.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/task-registry.md)
3. Check canonical state with:

```bash
workflow/scripts/phase-status.sh
```

### During Work

- Update or create the active change in `openspec/changes/`
- Keep `tasks.md` current
- Refresh registry state with:

```bash
workflow/scripts/tasks-sync.sh
```

### Before Commit

Run:

```bash
workflow/scripts/post-impl-check.sh
```

If behavior, docs, or session state changed, also update:

- [workflow/state/status.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/status.md)
- [workflow/state/NEXT-SESSION.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/NEXT-SESSION.md)
- [workflow/state/pending-usertests.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/pending-usertests.md)

### Close Session

```bash
workflow/scripts/session-close.sh --summary "..."
```

## Legacy Handling

- `.specify` is frozen legacy product and workflow history.
- `codex/` is a compatibility layer, not the canonical workflow source.
- Read legacy files only when you need historical context.
- Do not append new status, plans, tasks, or reports there.
