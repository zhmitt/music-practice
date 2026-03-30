# Capability Spec: Practice Companion Foundation

## Purpose

Describe the core product promise for ToneTrainer as a guided practice companion.

## Current State

- The product intent lives in `docs/product-spec.md`.
- Static mockups demonstrate the dashboard, practice session, tone lab, rhythm, progress, and settings surfaces.
- The repo does not yet contain the full runtime implementation, so this capability currently defines the canonical product scope rather than shipped application behavior.

## Requirements

### Requirement: Guided practice framing

The product MUST position itself as a calm, structured practice companion rather than a gamified lesson app.

#### Scenario: planning the daily experience

- **WHEN** the user opens the home view
- **THEN** the product centers on today's practice session, recent progress, and targeted weak spots
- **AND** the UX avoids punitive scoring as the main motivational device

### Requirement: Multi-persona support

The product MUST support young learners and adult returners from the same core interaction model.

#### Scenario: presenting feedback

- **WHEN** the app presents pitch, rhythm, or progress feedback
- **THEN** the feedback is concrete enough for analytical adults
- **AND** simple enough for teacher-guided younger players
