# Gemini Subagents

This repository enables Gemini CLI subagents at the workspace level through `.gemini/settings.json`.

Available project agents:

- `opsx-implementer`
- `opsx-reviewer`
- `opsx-verifier`
- `opsx-session-closer`

Use them in one of two ways:

1. let Gemini delegate automatically when the command or prompt suggests it
2. call them explicitly with `@opsx-implementer`, `@opsx-reviewer`, `@opsx-verifier`, or `@opsx-session-closer`

The subagents are accelerators only.

They must still use:

- `AGENTS.md`
- `openspec/`
- `workflow/`

They must not become the only place where process rules live.
