# Capability Spec: Guided Practice Experiences

## Purpose

Capture the intended exercise surfaces that turn audio analysis into useful practice workflows.

## Current State

- Legacy specs describe dashboard/session planning, practice-session flow, long tones, scale exercises, tone lab, rhythm studio, progress tracking, and settings.
- Static mockups cover the main surfaces visually.
- The repository is still at product-definition stage for these experiences.

## Requirements

### Requirement: Session-led practice

The product MUST support a structured practice session flow with clear steps and goals.

#### Scenario: starting a guided session

- **WHEN** the user starts today's session
- **THEN** the app shows a sequence of exercises with visible session progress
- **AND** each step explains what the player should do and what the feedback means

### Requirement: Free-form practice modes

The product MUST also support free-form exploration outside guided sessions.

#### Scenario: entering tone or rhythm practice

- **WHEN** the user opens Tone Lab or Rhythm
- **THEN** the app offers focused practice tools with immediate feedback
- **AND** those tools still contribute to broader progress and insight

### Requirement: Progress and settings support the practice loop

The product MUST expose progress trends and configurable preferences that shape practice meaningfully.

#### Scenario: reviewing or adjusting practice

- **WHEN** the user opens Progress or Settings
- **THEN** they can see trends, recurring weak spots, and current goals
- **AND** they can adjust instrument, tuning, audio, and display preferences without breaking continuity
