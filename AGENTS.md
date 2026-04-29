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

- main agent as tech lead / orchestrator
- delegated worker agents or subagents for implementation, review, verification, testing, and bounded diagnosis
- in Codex, prefer `explorer` for read-only investigation and `worker` for bounded execution with explicit ownership and disjoint write sets
- run parallel agents when scopes are cleanly separated and the next local step is not blocked
- report-back into canonical artifacts or concise summaries

Claude native subagents, Gemini native subagents, and Codex app multi-agent flows are valid accelerators here.

## Product-Specific Constraints

- ToneTrainer is a practice companion, not a teacher replacement.
- Feedback should stay descriptive and confidence-oriented, not punitive or gamified.
- Pitch, rhythm, and progress features must work for young learners and returning adults, not only advanced musicians.
- Because the repository currently contains product specs and mockups rather than a full runtime, changes must distinguish clearly between product intent, prototype UI, and implemented behavior.

## Workspace ownership and branch handoff

Every active line of work must use one explicit workspace mode at a time:

- `tool-managed workspace`
  - The chat or app owns the branch/worktree lifecycle.
  - Hidden tool worktrees or detached thread state may exist.
  - Prefer this mode when an existing chat should continue.
- `manual git worktree`
  - A human or script owns `git worktree add` and the branch checkout.
  - Open a new chat in that exact folder instead of rebinding an older chat that still points somewhere else.
- `primary workspace`
  - The top-level checkout is the default stable repo entrypoint.
  - Do not treat it as a surprise branch-rebind target when other workspace modes are active.

Rules:

1. One branch, one ownership mode at a time.
2. If an existing chat should continue, let the tool manage that branch and do not create a parallel manual worktree for it.
3. If a manual git worktree is created, continue the work in a new chat opened in that exact workspace path.
4. Before freeing a branch from a manual worktree back to a tool-managed workspace, create a checkpoint commit or an explicit stash first. Prefer a pushed checkpoint when the work is important or the app behavior is uncertain.
5. Handoffs between tools or workspaces must record the change id when present, branch name, commit hash or stash reference, current workspace mode, and intended target workspace or tool.
6. Run `workflow/scripts/workspace-status.sh` before branch/worktree handoffs when there is any doubt about current ownership.

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
workflow/scripts/tasks-sync.sh --check
workflow/scripts/milestone-sync.sh --summary "..."
workflow/scripts/post-impl-prepare.sh --summary "..."
```

### Before Commit

Run:

```bash
workflow/scripts/milestone-check.sh --staged --mode warn
workflow/scripts/post-impl-check.sh
```

If behavior, docs, or session state changed, also update:

- [workflow/state/status.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/status.md)
- [workflow/state/NEXT-SESSION.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/NEXT-SESSION.md)
- [workflow/state/pending-usertests.md](/Users/mschmitt/Documents/Git/music-practice/workflow/state/pending-usertests.md)

### Close Session

```bash
workflow/scripts/session-close.sh --summary "..."
workflow/scripts/worktree-doctor.sh
workflow/scripts/worktree-doctor.sh --branch <branch>
workflow/scripts/worktree-close.sh --summary "..."
workflow/scripts/worktree-close.sh --summary "..." --remove --change <change-id>
```

## Legacy Handling

- `.specify` is frozen legacy product and workflow history.
- `codex/` is a compatibility layer, not the canonical workflow source.
- Read legacy files only when you need historical context.
- Do not append new status, plans, tasks, or reports there.

## Definition of Done

**Done = `workflow/scripts/change-done.sh --change <id>` exit 0. Nichts anderes
zaehlt als Done.**

`pnpm typecheck` + `pnpm test` ist ausschliesslich Beweis fuer "kompiliert +
bestehende Tests gruen" -- kein Beweis fuer "Spec erfuellt" oder
"Implementation korrekt".

### Beweis-Typen pro Change-Typ

| Change-Typ | Pflicht-Beweis |
|---|---|
| **Bug-Fix** | Failing-Test (vor Fix) -> Passing-Test (nach Fix). Test-Name muss in Commit-Message oder Report stehen. |
| **Feature** | Smoke-Test (CLI ausfuehren, Browser oeffnen, Test-Output zeigen) + Test-Datei oder Recording. |
| **Refactor** | Vor/Nach-Inventur identisch. Function-Signaturen + Public-API gleich. Test-Snapshot-Diff = leer. |
| **Migration** | Sample-Vergleich alt vs neu (1% der Records oder repraesentativer Sample). Beweis: Diff-Output. |
| **Security-Hardening** | Penetrations-Versuch (curl/script) muss failen. Beweis: failing-Output protokolliert. |
| **Performance-Optimierung** | Vor/Nach-Messung mit definiertem Threshold. Beweis: Zahlen vor/nach. |
| **Doc-Update** | Cross-Reference-Check (Doc claimt X exists -> grep findet X). Beweis: grep-Output. |
| **Spec/Workflow-Change** | Selbst-Anwendbarkeit (das neue Workflow auf einen Sample-Change angewendet -> gruen). |

Verification-Pipeline: `workflow/scripts/change-done.sh`

### Historischer Cutoff

Die change-done.sh-Pflicht gilt **ab Change openspec-verification-toolchain** (eingefuehrt 2026-04-29).
Aeltere Changes koennen als historischer Audit-Snapshot abgehakt werden.

Fuer jeden neuen Change (>= openspec-verification-toolchain): kein `done`-Claim ohne
`change-done.sh --change <id>` exit 0.

## Parallel Work Limit

**Max 3 unverifizierte Claims gleichzeitig in Flight.**

"Unverifiziert" bedeutet: noch kein `workflow/scripts/change-done.sh --change
<id>` exit 0.

Vor dem 4. parallelen Claim muessen fuer die ersten 3 change-done.sh-Gates
abgeschlossen sein.

**Dokumentierter Failure-Mode:** Audit-Sweep mit vielen parallelen Changes
ohne Pro-Change-Gate fuehrt zu falsch-als-done gemeldeten Implementations.
Drift wird erst spaeter entdeckt. Beispiele: Util geschrieben aber nicht
importiert; Schema verschaerft aber nicht aktiviert; Script fehlt komplett;
re-exports vergessen. Typecheck + Tests blieben durchgehend gruen.

Diese Regel gilt unabhaengig vom Tool-Author -- Claude, Codex, Gemini. Die
Volume-Falle ist tool-unabhaengig.

## Sub-Agent Output Format

Jede Sub-Agent-Antwort, die Claim-Verben nutzt ("implemented", "fixed",
"done", "complete", "tested", "deployed", "verified", "ready"), **muss** einen
Evidence-Block am Ende der Antwort enthalten:

```
Implemented:
- <file:lines> -- <was konkret>
Skipped/Out-of-Scope:
- <reason>
Verified:
- <command> exit <code>
- <test-name>: result
NOT verified:
- <was wurde NICHT geprueft, woran koennte gelogen worden sein>
Drift-risk:
- <Util geschrieben aber nicht importiert? Test geschrieben aber nicht
   ausgefuehrt? Refactor angekuendigt aber Caller nicht migriert?>
```

Tech-Lead-Regel: Sub-Agent-Antwort ohne diesen Block = nicht akzeptiert.
