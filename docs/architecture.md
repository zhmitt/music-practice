# Architecture Overview

## Current Repository Reality

`music-practice` is currently a product-definition and prototype repository.

It contains:

- product intent in [docs/product-spec.md](/Users/mschmitt/Documents/Git/music-practice/docs/product-spec.md)
- screen and interaction mockups in [mockup/](/Users/mschmitt/Documents/Git/music-practice/mockup)
- early legacy feature specs in [`.specify/specs/`](/Users/mschmitt/Documents/Git/music-practice/.specify/specs)

It does not yet contain a committed production runtime stack or a complete application implementation.

## Product Architecture

The intended product splits into these capability groups:

- practice companion foundation
- real-time audio analysis
- guided practice experiences
- workflow governance and delivery mechanics

## Delivery Architecture

The repository now follows the portfolio standard:

- governance: [AGENTS.md](/Users/mschmitt/Documents/Git/music-practice/AGENTS.md)
- current specs and changes: [openspec/](/Users/mschmitt/Documents/Git/music-practice/openspec)
- runtime workflow state: [workflow/](/Users/mschmitt/Documents/Git/music-practice/workflow)

Tool-specific layers remain available, but they are adapters only:

- [CLAUDE.md](/Users/mschmitt/Documents/Git/music-practice/CLAUDE.md)
- [CODEX.md](/Users/mschmitt/Documents/Git/music-practice/CODEX.md)
- [GEMINI.md](/Users/mschmitt/Documents/Git/music-practice/GEMINI.md)
- `.claude/`
- `.codex/`
- `.gemini/`

## Next Architecture Decision

The next real implementation change should decide the concrete runtime stack and audio architecture for the first working ToneTrainer build. That decision belongs in a new active OpenSpec change rather than in legacy template files.
