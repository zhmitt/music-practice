# Capability Spec: Real-Time Audio Analysis

## Purpose

Define the intended audio-analysis foundation for pitch, onset, and stability feedback.

## Current State

- Legacy feature specs cover pitch detection and audio capture as separate capabilities.
- The canonical product direction requires real-time microphone capture, onset detection, and pitch/stability analysis for wind-instrument practice.
- No committed runtime implementation exists yet.

## Requirements

### Requirement: Pitch and onset pipeline

The product MUST eventually provide a microphone-to-feedback pipeline suitable for practice guidance.

#### Scenario: analyzing a played note

- **WHEN** the user plays a note
- **THEN** the system can derive pitch, note identity, and cent deviation quickly enough for live feedback
- **AND** the same audio pipeline can support onset-aware rhythm and session features

### Requirement: Instrument-aware feedback

The analysis layer MUST remain compatible with brass-practice context.

#### Scenario: configuring the instrument

- **WHEN** the user chooses instrument and tuning settings
- **THEN** pitch display and feedback use that context
- **AND** the system keeps concert versus transposed display concerns explicit
