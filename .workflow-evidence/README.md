# .workflow-evidence/

Runtime-Telemetrie für Claude-Code-Hooks. Wird NICHT committed (außer
diesem README + `.gitignore`).

Dateien:

- `agents.jsonl` — eine Zeile pro Sub-Agent-Spawn (Plan, Explore,
  test-runner, code-review, security-scanner, …). Geschrieben vom
  PostToolUse-Hook auf `Agent`-Calls.
- `overrides.jsonl` — eine Zeile pro Hook-Bypass-Event
  (`CLAUDE_HOOKS_OFF=1`). Sichtbar im nächsten pre-commit-Run.

Schema `agents.jsonl`:
```json
{"ts":"2026-05-16T10:30:00Z","agent":"Plan","description":"…","agent_id":"…","session":"<pid>"}
```

Gates die diese Datei lesen:

- `.claude/hooks/gate-edit.sh` — blockt `Edit|Write|MultiEdit` auf Code,
  wenn kein `Plan`- oder `Explore`-Agent in den letzten 4 h gelaufen ist.
- `workflow/scripts/agent-evidence-check.sh` — pre-commit-Warning wenn
  kein `test-runner` in den letzten 30 min lief.

Notfall-Override: `CLAUDE_HOOKS_OFF=1`. Wird hier geloggt und beim
nächsten Commit sichtbar gemacht.
