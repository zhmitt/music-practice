# Design: Bb Horn Practice Pedagogy

## Context

The app now has working student flows, audio diagnostics, and configurable note presentation, but the practice content still uses several generic note pools. For `horn_bb`, that causes two problems:

1. Some written-note defaults fall too quickly into low ledger-line territory.
2. Tone Lab and Rhythm expose technical capability before pedagogical intent is always obvious.

## Design Decisions

### 1. Add a central pedagogical practice profile per instrument

We will introduce a shared profile object that defines:

- long-tone note sequence
- scale note sets
- flexibility note pool
- Tone Lab target-note pool
- Tone Lab drone-note options
- interval root-note pool
- ear-training root-note pool

This makes register choices explicit and keeps guided sessions, Tone Lab, and smart suggestions aligned.

### 2. Prioritize `horn_bb` as a physical-instrument profile

`horn_bb` remains a first-class instrument option and becomes the main reference profile for this pass.

Its pedagogical defaults should:

- start in a stable middle register
- avoid very low written targets in the first-line experience
- keep target/drone/ear material within a range that is easier to hear, center, and read

### 3. Keep a visible distinction between pedagogy and notation-system modeling

This pass does **not** attempt to fully solve the deeper horn-notation question of whether a physical `Bb horn` should always imply a `Bb-transposed written system`, an `F-based horn notation system`, or a user-selectable notation convention.

Instead:

- the existing physical-instrument behavior remains intact
- the practice material is moved into safer registers
- the unresolved notation-model question is documented as follow-up work

### 4. Treat Tone Lab as layered practice, not a single mode switch

Tone Lab should communicate:

- `Free Play`: explore and stabilize tone production
- `Drone`: match and center pitch against a reference
- `Target`: hit and hold one shown note
- `Interval`: hear a root, then build above it
- `Ear`: hear first, answer second

The UI copy should reflect that progression.

### 5. Keep Rhythm honest about tool vs drill

Rhythm has two pedagogically different jobs:

- Metronome: external pulse support
- Pattern/Subdivision: actual performance drills

The wording should make that explicit. Unsupported or weakly modeled compound-meter behavior should not be presented as equally mature pedagogy.

## Implementation Notes

- Create a shared `practiceProfiles` module used by session builders and Tone Lab stores.
- Replace local-storage parsing inside Tone Lab target mode with canonical store-driven instrument selection.
- Update supportive copy where the current wording is technically correct but pedagogically thin.
- Keep the recent note-rendering and audio-debug improvements intact.

## Open Follow-Up

- Decide whether horn notation should be modeled as:
  - physical instrument only
  - notation system only
  - or a paired model with separate instrument and notation preferences
- Revisit compound-meter metronome semantics, especially `6/8`, under a dedicated rhythm-pedagogy slice.
