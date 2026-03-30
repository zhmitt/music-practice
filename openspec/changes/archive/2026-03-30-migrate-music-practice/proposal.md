# Proposal: Migrate music-practice to OpenSpec Hybrid

## Why

`music-practice` still operated as a template-heavy `.specify` repository even though the real product signal lived in the product spec, mockups, and early feature specs. That created three problems:

- canonical workflow truth was still tool- and template-centric
- legacy memory files were mostly placeholders rather than trustworthy operational state
- the repo could not participate cleanly in the portfolio-wide OpenSpec hybrid standard

## What Changes

- introduce canonical governance in `AGENTS.md`
- introduce canonical spec and change storage in `openspec/`
- introduce canonical runtime state and deterministic scripts in `workflow/`
- freeze `.specify` as legacy reference
- convert Claude, Codex, and Gemini layers into adapters

## Impact

- no product runtime behavior changes
- improved portability across Claude Code, Codex, and Gemini CLI
- clearer separation between product intent, active implementation work, and legacy template history
