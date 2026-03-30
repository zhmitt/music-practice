# ToneTrainer

ToneTrainer is a practice companion for brass players that combines guided sessions, real-time pitch and rhythm feedback, and long-term progress tracking.

The current repository is still an early product seed:

- product intent lives in [docs/product-spec.md](/Users/mschmitt/Documents/Git/music-practice/docs/product-spec.md)
- interactive direction lives in [mockup/](/Users/mschmitt/Documents/Git/music-practice/mockup)
- canonical workflow truth now lives in [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md), [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec), and [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow)

## What This Repo Contains

- product definition for a desktop-first music practice companion
- legacy feature specs for pitch detection, onboarding, sessions, rhythm, progress, and settings
- static mockups for the main app surfaces
- adapter layers for Claude Code, Codex, and Gemini CLI

## Workflow

This repository no longer uses `.specify` as the live workflow system.

Use these canonical surfaces instead:

1. [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md)
2. [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec)
3. [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow)

Helpful commands:

```bash
workflow/scripts/phase-status.sh
workflow/scripts/tasks-sync.sh
workflow/scripts/post-impl-check.sh
workflow/scripts/session-close.sh --summary "..."
```

Compatibility wrappers remain in `codex/` and `.claude/commands/`, but they route back to the canonical workflow above.

## Product Direction

The near-term product shape is:

- guided daily practice sessions with clear exercise sequencing
- tone and pitch analysis for wind instruments
- rhythm training with actionable timing feedback
- progress visibility across sessions and weeks
- settings that adapt the experience to instrument, tuning, and practice style

## Current Migration Note

This repo was migrated from a template-heavy `.specify` workflow to the OpenSpec hybrid portfolio standard. Historical `.specify` files remain for reference, but new operational state must not be written there.
