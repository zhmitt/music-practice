# Capability Spec: Practice Pedagogy

## Purpose

Define how ToneTrainer chooses and explains practice material so learner-facing exercises feel instrument-aware, musically sensible, and pedagogically supportive.

## Requirements

### Requirement: Bb horn defaults stay in a readable and playable middle register

The student app MUST avoid seeding `horn_bb` practice with unnecessarily low written targets when easier middle-register alternatives satisfy the same training goal.

#### Scenario: starting a first Bb horn session

- **WHEN** a learner with `horn_bb` begins long tones or other note-target exercises
- **THEN** the initial written targets stay in a comfortable middle register
- **AND** the app does not default immediately to ledger-line-heavy low notation unless the exercise explicitly requires it

### Requirement: Guided and exploratory modes share the same pedagogical note pools

The app MUST align guided sessions, Tone Lab target work, drone work, and related ear/interval roots to explicit instrument practice profiles.

#### Scenario: practicing Bb horn across multiple views

- **WHEN** a Bb horn learner moves between the dashboard session flow and Tone Lab
- **THEN** the suggested notes, targets, and reference pitches feel like one coherent practice register
- **AND** the learner does not experience unrelated note pools per view

### Requirement: Tone Lab explains the purpose of each mode

Tone Lab MUST tell the learner whether a mode is for exploration, matching, building, or recalling pitch.

#### Scenario: choosing a Tone Lab mode

- **WHEN** the learner switches between `free play`, `drone`, `target`, `interval`, and `ear`
- **THEN** the UI explains the musical purpose of the selected mode in supportive language
- **AND** the learner can tell whether they should listen first, play immediately, or hold a target steadily

### Requirement: Rhythm distinguishes support tools from drills

Rhythm MUST frame the metronome as a support tool and pattern/subdivision modes as active drills.

#### Scenario: opening Rhythm

- **WHEN** the learner enters Rhythm
- **THEN** the view makes it clear which modes provide pulse support and which modes score execution
- **AND** the wording does not blur setup controls with exercise controls

### Requirement: Notation-system follow-up remains explicit

The app MUST not silently conflate `physical horn variant` and `written horn notation system` once the product starts offering multiple horn types.

#### Scenario: offering multiple horn variants

- **WHEN** the product offers `horn_bb`, `horn_f`, and `double_horn`
- **THEN** the current physical-instrument behavior remains explicit
- **AND** any unresolved notation-system distinction is documented as follow-up product work rather than hidden in ad hoc defaults
