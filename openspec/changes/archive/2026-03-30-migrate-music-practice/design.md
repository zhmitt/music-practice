# Design: Migrate music-practice to OpenSpec Hybrid

## Strategy

Treat `music-practice` as a product-definition repository rather than as a fully implemented application. That means the migration should preserve product truth from `docs/product-spec.md` and the legacy feature specs, while avoiding fake claims about shipped code.

## Key Decisions

1. `AGENTS.md`, `openspec/`, and `workflow/` become canonical immediately.
2. `.specify` remains in place as frozen legacy instead of being physically removed.
3. Product capability specs are rewritten from the real product definition and the legacy feature cluster, not copied 1:1 from `.specify/specs/`.
4. No active change is imported at cutover because the repo has no coherent live implementation change in progress.
5. Old Claude and Codex workflow entry points stay available only as compatibility wrappers.

## Repository-Specific Notes

- `docs/product-spec.md` is more trustworthy than `.specify/memory/*` for product direction.
- `mockup/` is an important source of UX intent and should be preserved as design support material.
- The repo still contains user-local edits in `.claude/commands/init-project.md` and the untracked Google audit prompt; these should not be overwritten by migration mechanics.
