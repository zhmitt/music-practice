# Legacy Inventory — 2026-03-30

## Findings

- `.specify/memory/*` is mostly template placeholder content and is not trustworthy as live operational state
- `docs/product-spec.md` is the strongest current source for actual product truth
- `.specify/specs/001-012` is useful as capability support material, not as live feature workflow
- `mockup/` is an important design reference layer
- old `codex/scripts/*` and Claude workflow files still point to the legacy system

## Classification

- `docs/product-spec.md` -> current capability source
- `mockup/` -> current design reference
- `.specify/specs/001-012` -> current capability support material
- `.specify/memory/*` -> archive-only or backlog reference, depending on file
- legacy command and hook surfaces -> compatibility layer input for cutover
