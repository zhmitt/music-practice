# OpenSpec Cutover — 2026-03-30

## Cutover Decisions

- `AGENTS.md`, `openspec/`, and `workflow/` are now canonical
- `.specify/` is frozen and must not receive new operational updates
- legacy Claude and Codex command names remain as wrappers only
- no active implementation change was imported because the repo had no coherent live implementation stream

## Product Truth Decisions

- `docs/product-spec.md` remains the primary product-definition source
- capability specs were rewritten around the current product shape rather than copied 1:1 from legacy feature folders
- the next real product delivery step should be a new implementation change that chooses the concrete stack
