# Capability Spec: Student Practice Journeys

## Purpose

Define the intended student-facing journeys across the main ToneTrainer views so the product has a coherent practice loop, not just a collection of screens.

## Current State

- The repository now contains an implemented student shell with onboarding, dashboard, session overlay, Tone Lab, Rhythm, Progress, and Settings.
- The current capability specs describe the broad product promise, but they do not yet formalize the learner stories and interaction boundaries per view.
- Recent desktop smoke testing surfaced ambiguity around start semantics, microphone validation, and the wording of student-facing controls.

## Requirements

### Requirement: Student-first app framing

The default product experience MUST stay focused on the student practice loop before teacher workflows re-enter the main shell.

#### Scenario: opening the default app

- **WHEN** a learner uses the standard app variant
- **THEN** the visible navigation and settings focus on student practice
- **AND** teacher-only workflows remain hidden unless an explicit teacher variant is active

### Requirement: Onboarding confirms setup and listening state clearly

Onboarding MUST make it clear whether the app is asking for permission, hearing a signal, detecting pitch, or ready to begin practice.

#### Scenario: validating the microphone during onboarding

- **WHEN** the learner reaches the microphone step
- **THEN** the UI distinguishes permission, device, signal, and pitch-detection states
- **AND** the learner can tell whether the app hears noise, hears a usable note, or has enough confidence to proceed

### Requirement: Settings expose in-app audio diagnostics for live debugging

The student app MUST provide a product-visible audio debug surface so real Tauri smoke tests can distinguish capture, buffering, confidence, and filtering problems without relying only on terminal logs.

#### Scenario: debugging a live microphone problem

- **WHEN** the learner or tester opens the audio debug view in Settings during a live session
- **THEN** the app shows the active input device, the current detector state, and whether enough audio is buffered for pitch analysis
- **AND** the app exposes tentative and final pitch states separately when the detector hears signal but does not yet accept the pitch as final

### Requirement: Dashboard answers the daily next-step question

The dashboard MUST present one primary practice action and keep supporting tools secondary.

#### Scenario: opening the dashboard

- **WHEN** the learner lands on the home view
- **THEN** the page makes the recommended next practice step obvious
- **AND** imports, assignments, and other utilities do not compete with the primary daily CTA

### Requirement: Guided sessions explain the current target and control meaning

Guided session UX MUST make it obvious what to play now, what counts as success, and what each control will do.

#### Scenario: moving through a guided session

- **WHEN** the learner is in an active session
- **THEN** the UI shows the current target, the success condition, and session progress
- **AND** advancing, skipping, pausing, exiting early, and finishing successfully are labeled as distinct actions

### Requirement: Practice modes make setup versus exercise start explicit

Tone Lab and Rhythm MUST explain whether the learner is configuring a tool, starting live listening or playback, or starting a scored exercise.

#### Scenario: starting a practice mode

- **WHEN** the learner enters Tone Lab or Rhythm
- **THEN** the UI makes the current mode and its start model explicit
- **AND** the learner does not have to guess why a page-level control and a mode-level control both exist

### Requirement: Progress turns history into next-step guidance

Progress MUST help the learner decide what to do next, not only what happened already.

#### Scenario: reviewing recent practice

- **WHEN** the learner opens Progress
- **THEN** the app shows trends, weak spots, and recent sessions in a supportive way
- **AND** the view helps the learner infer a next practice focus from that history

### Requirement: Student-facing wording stays supportive and concrete

The student version MUST use terminology that matches practice intent and avoids ambiguous or overloaded verbs.

#### Scenario: showing controls and feedback

- **WHEN** the app labels actions or results
- **THEN** the wording reflects whether the learner is starting, continuing, stopping, skipping, or finishing
- **AND** supportive practice language is preferred over vague or internally technical wording

### Requirement: Student note targets honor visual representation preferences

The student version MUST let learners choose whether target notes are rendered as note names, staff notation, or a hybrid of both, while still respecting the chosen pitch naming mode.

#### Scenario: switching note presentation in Settings

- **WHEN** the learner changes the note representation preference
- **THEN** target-note surfaces across onboarding, guided sessions, and Tone Lab update to that representation
- **AND** the note naming remains consistent with the active `notated` versus `concert` pitch mode
