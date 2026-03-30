# Migration Report: music-practice to OpenSpec Hybrid

## Why This Migration Exists

`music-practice` was still shaped like a generalized `.specify` template even though the meaningful repo truth lived elsewhere:

- the product definition lived in `docs/product-spec.md`
- the UX direction lived in `mockup/`
- the legacy memory files were mostly placeholders

That made the repo look operationally mature while actually hiding that the live project truth was fragmented across template remnants and early product design documents.

## What Changed

- added [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md) as the canonical workflow contract
- added [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec) as the canonical spec and change layer
- added [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow) as the canonical runtime state and deterministic script layer
- froze [`.specify/`](/Users/mschmitt/Documents/Git/music-practice/.specify) as legacy reference
- converted Claude, Codex, and Gemini layers into adapters
- replaced the old codex runtime with compatibility wrappers over canonical scripts

## Why The Old System Was Not Migrated 1:1

The old tree mixed at least four concerns:

- template bootstrap instructions
- product discovery and feature ideation
- working-memory style operational state
- tool-specific workflow instructions

Copying that structure mechanically would have preserved drift instead of removing it.

## What Was Preserved

- the ToneTrainer product vision
- the early feature decomposition for pitch, sessions, rhythm, progress, and settings
- mockup artifacts that still help implementation planning
- the tech-lead plus worker-agent operating model

## Known Limits

- the repository still needs its first true implementation change to pick the runtime stack
- some old Claude agents and commands still exist as legacy convenience material
- `.claude/commands/init-project.md` remains a local template-era helper and was left untouched deliberately
- the untracked Google audit prompt was intentionally not pulled into canonical workflow state
