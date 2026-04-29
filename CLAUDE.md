# CLAUDE.md

Claude Code is supported here, but this file is only a thin adapter.

Use these canonical sources first:

1. [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md)
2. [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec)
3. [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow)

Claude-native accelerators are welcome:

- slash commands
- subagents with separate context windows
- hooks

They must operate against the shared repo truth above and must not create new operational state in `.specify/`.

If you encounter template placeholders or initializer-era docs, treat them as legacy seed material rather than as canonical workflow instructions.

## Done-Disziplin und Volume-Falle

Die "Volume-Falle": Viele Changes parallel implementiert, einige fälschlich
als done gemeldet (Util geschrieben, nirgends importiert; Schema verschärft,
nicht aktiviert; re-exports vergessen; Script fehlt komplett). Typecheck +
Test blieben grün, weil sie den ungetesteten Pfad nicht testen.

Die Sections "Definition of Done", "Parallel Work Limit" und "Sub-Agent
Output Format" in AGENTS.md sind verbindlich, nicht optional.

**Vor jedem `done`/`fertig`/`implementiert`/`deployed`-Claim:**
`workflow/scripts/change-done.sh --change <id>` exit 0 prüfen.

**Bei Mass-Sweeps (>3 parallele Changes):** nach jeweils 3 Changes
change-done.sh-Gate, bevor der nächste Batch startet.
