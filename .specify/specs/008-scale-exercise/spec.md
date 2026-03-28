# Feature Specification: Scale Exercise (Tonleiter)

**Feature Branch**: `008-scale-exercise`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Player plays a scale, app tracks each note in real-time showing pitch accuracy on notation."

---

## User Scenarios & Testing

### User Story 1 — Scale Displayed on Staff with Real-Time Note Tracking (Priority: P0)

Leo selects "F major" from the scale exercise screen. The app renders the F major scale on staff lines with a treble clef and one-flat key signature. As he plays each note, the app detects the pitch in real-time, highlights the active note on the staff, and automatically advances to the next note when the correct pitch is recognized within the ±20 cent tolerance window. After completing the scale, Leo can see which notes he hit cleanly and which were problematic.

**Why this priority**: This is the core loop. Without staff rendering and real-time note advance, the feature does not exist. Every other story builds on top of this.

**Independent Test**: Can be tested end-to-end by selecting F major, playing all eight notes on a horn (or injecting simulated pitch data), and verifying that the active note highlight advances correctly and that the post-scale summary shows per-note results.

**Acceptance Scenarios**:

1. **Given** the user opens the scale exercise screen and selects F major ascending, **When** the screen loads, **Then** the staff shows all eight notes of F major (F4 G4 A4 Bb4 C5 D5 E5 F5) with treble clef, one-flat key signature, correct note positions on lines/spaces, and the first note (F4) highlighted as active.

2. **Given** the active note is F4 and the user plays F4 within ±20 cents, **When** the pitch is detected and held for at least 200ms, **Then** the app marks F4 as completed (with its cent deviation), highlights G4 as the new active note, and leaves F4 with a result indicator (checkmark or warning dot).

3. **Given** the active note is A4 and the user plays a wrong note (e.g., G4), **When** the pitch is detected, **Then** the app does not advance — A4 remains highlighted, no result is recorded for it yet, and the pitch indicator reflects the detected pitch without advancing.

4. **Given** the user completes all eight notes, **When** the last note (F5) is accepted, **Then** the app shows a per-note result summary row: each note's name, whether it matched, and the cent deviation recorded (e.g., "F4 +3ct | G4 -8ct | A4 +1ct | Bb4 +22ct ...").

5. **Given** the scale is complete, **When** the user views the summary, **Then** notes within ±10ct are marked clean, notes between ±10–20ct are marked acceptable, and any note that required multiple attempts is flagged.

---

### User Story 2 — Vertical Pitch Indicator Next to Active Note (Priority: P1)

Thomas wants precise intonation feedback while playing through the scale. A small vertical pitch indicator floats beside the currently active note on the staff, moving up and down in real time to show how sharp or flat his current pitch is relative to the target note. This connects the visual staff notation with live intonation feedback in a single glance.

**Why this priority**: Pitch deviation feedback is what separates ToneTrainer from a static sheet music display. It is not required to advance through the scale (the detection logic handles that), but it provides the core intonation training value.

**Independent Test**: Can be tested by holding a note and observing the vertical indicator move smoothly up/down as pitch changes. Test independently of note-advance logic by using a static "held note" mode.

**Acceptance Scenarios**:

1. **Given** the active note is C5 and the user is playing, **When** the detected pitch is 8 cents sharp, **Then** the vertical indicator beside C5 shows a marker positioned above center corresponding to +8ct, updating at least 10 times per second.

2. **Given** the detected pitch crosses ±50 cents from the target, **When** the indicator would go out of bounds, **Then** it clamps at the top or bottom of its range and does not overflow the staff area.

3. **Given** the user stops playing (silence), **When** no pitch is detected for more than 200ms, **Then** the indicator returns to center/neutral and does not hold a stale position.

4. **Given** the user switches to the next note (advance), **When** the new active note is highlighted, **Then** the pitch indicator repositions itself beside the new active note within one render frame.

---

### User Story 3 — "Anhoren" Button: Hear the Scale or Individual Notes (Priority: P1)

Before playing, Leo wants to hear what the scale should sound like. He taps "Anhoren" (listen) and the app plays back the full scale at the suggested tempo using a warm synthesized brass tone. He can also tap a specific note on the staff to hear just that note in isolation.

**Why this priority**: Audio reference is essential for beginners who are not yet sure what the target pitch sounds like. It also supports the established product principle that the app plays the reference at least once automatically on first encounter.

**Independent Test**: Can be tested without any microphone input — simply tap the button and verify the audio output plays the correct pitches in sequence at the configured tempo.

**Acceptance Scenarios**:

1. **Given** the scale exercise screen loads for the first time, **When** the screen is ready, **Then** the app automatically plays the scale once through at the suggested tempo before the player begins (first-time-only auto-play per the product UI decision).

2. **Given** the user taps "Anhoren" while not actively playing, **When** playback begins, **Then** the app plays all notes of the scale sequentially at the suggested BPM tempo, highlighting each note on the staff as it sounds, using the warm synthesized tone (not a sine wave).

3. **Given** the user taps a specific note on the staff (e.g., Bb4), **When** the tap is registered, **Then** the app plays that single note in isolation for approximately one beat duration.

4. **Given** the user taps "Anhoren" while playback is already in progress, **When** the button is tapped, **Then** playback stops immediately.

---

### User Story 4 — Scale Selection and Difficulty Levels (Priority: P1)

Thomas selects the scale exercise from the session plan. The app offers scale choices appropriate to his level. A beginner sees only horn-friendly keys (F, Bb, Eb major). An advanced user sees all major and natural minor scales. An experienced player additionally sees chromatic, harmonic minor, and melodic minor.

**Why this priority**: Offering wrong-level content immediately defeats the pedagogical purpose. Without appropriate scale selection, the feature cannot be integrated into the structured session flow.

**Independent Test**: Can be tested statically by setting the user level to each of the three tiers (Anfanger, Fortgeschritten, Erfahren) and verifying the available scale list matches the spec without any pitch detection running.

**Acceptance Scenarios**:

1. **Given** the user's level is set to Anfanger (beginner), **When** the scale selection screen opens, **Then** the available scales are exactly: F major, Bb major, Eb major (ascending direction only).

2. **Given** the user's level is set to Fortgeschritten (intermediate), **When** the scale selection screen opens, **Then** all 12 major scales and all 12 natural minor scales are available; ascending direction only.

3. **Given** the user's level is set to Erfahren (advanced), **When** the scale selection screen opens, **Then** chromatic scale, harmonic minor (all keys), and melodic minor (all keys) are additionally available; ascending, descending, and both directions are selectable.

4. **Given** the user selects a scale and direction, **When** the exercise loads, **Then** the staff displays the correct notes for that scale, key, and direction, with the appropriate key signature and accidentals.

---

### User Story 5 — Per-Note Result Summary After Completion (Priority: P1)

After finishing the F major scale, Leo sees a summary row at the bottom: each note labeled with its result. He can immediately see which notes were clean and which to revisit. The summary persists on screen until he navigates away or taps "Try again."

**Why this priority**: Without a summary, the exercise ends with no actionable information. The summary transforms a passive playthrough into a focused practice signal.

**Independent Test**: Can be tested by simulating a complete scale run with known cent deviations injected and verifying the summary row labels and indicators match the recorded data.

**Acceptance Scenarios**:

1. **Given** the user completes a scale, **When** the final note is accepted, **Then** a summary row appears showing all note names in order, each with a result symbol (checkmark for clean, warning dot for marginal, X for failed/skipped) and the recorded cent deviation.

2. **Given** the summary is visible, **When** the user taps a specific note in the summary, **Then** the staff scrolls/highlights that note and displays its recorded deviation prominently.

3. **Given** the user taps "Try again," **When** the action is confirmed, **Then** the exercise resets to the beginning with all notes cleared, summary hidden, and the first note highlighted.

---

### User Story 6 — Descending and Bidirectional Scales (Priority: P2)

An experienced player practicing Bb major wants to run it descending and then both directions in a single exercise pass.

**Why this priority**: Descending scales expose different technical challenges than ascending. This is a natural extension of the core feature but not required for the initial release.

**Independent Test**: Can be tested by selecting a scale with descending direction and verifying the staff displays the notes in reverse order, and that bidirectional mode chains ascending then descending in one pass.

**Acceptance Scenarios**:

1. **Given** the user selects Bb major descending, **When** the exercise loads, **Then** the staff displays Bb5 through Bb4 in descending order, with the highest note highlighted first.

2. **Given** the user selects "both directions," **When** the ascending pass is complete, **Then** the exercise immediately continues into the descending pass without requiring user input, and the per-note summary at the end covers all 15 notes (8 ascending + 7 descending, shared tonic).

---

### User Story 7 — Progressive Scale Unlocking Over Time (Priority: P2)

After two weeks of consistent practice with F major, the app surfaces a suggestion that Bb major is now available to try based on the player's practice history.

**Why this priority**: Progressive unlocking supports long-term engagement and guides beginners to expand their repertoire at an appropriate pace. It depends on the progress tracking system and is not required for initial feature launch.

**Independent Test**: Can be tested by mocking a practice history with sufficient F major sessions and verifying that the scale selection screen surfaces the Bb major suggestion.

**Acceptance Scenarios**:

1. **Given** the user has completed at least 5 sessions of F major with an average cent deviation under ±15ct, **When** the scale selection screen opens, **Then** Bb major appears as a highlighted suggestion ("Ready to try next").

2. **Given** a scale is not yet unlocked, **When** the user views it in the list, **Then** it is visible but visually dimmed, with a note showing what is needed to unlock it.

---

### Edge Cases

- **Out-of-order notes**: Player plays G4 when F4 is expected — app does not advance, no result is recorded for G4. The expected note (F4) remains active. There is no penalty indicator, just no progress.
- **Skipped note**: Player jumps to C5 when A4 is expected — same as out-of-order. App waits for A4.
- **Note not in the scale**: Player plays a pitch that maps to no note in the scale (e.g., C# when playing F major) — treated as wrong note, no advance, no spurious detection.
- **Very short notes (< 200ms)**: Notes held for fewer than 200ms are ignored; they do not count as detected. This prevents accidental advances from brief articulations or valve noise.
- **Enharmonic equivalents**: F# and Gb are treated as the same pitch class. When F# is the expected note (e.g., in a G major scale) and the player plays Gb at the correct frequency, the detection counts it as a match.
- **No input / silence**: If the player does not play for 10 seconds on any note, the exercise pauses with a "Waiting..." indicator. It does not time out or auto-advance.
- **Pitch detected at edge of tolerance (exactly ±20ct)**: Counts as a match. The boundary is inclusive.
- **Player plays above/below the staff range**: Notes outside the expected scale range are mapped to the nearest note in the scale by frequency proximity, then evaluated against the expected note.

---

## Requirements

### Functional Requirements

- **FR-001**: The app MUST render the selected scale on a standard treble clef staff with correct note positions, key signature, and accidentals for the chosen key.
- **FR-002**: The app MUST detect the player's pitch in real-time (latency target: < 80ms from sound to UI response) and compare it against the expected note in the scale sequence.
- **FR-003**: The app MUST advance to the next note automatically when the detected pitch is within ±20 cents of the expected note and has been held for at least 200ms. Note: The ±20ct tolerance for scale note acceptance is intentionally wider than the global pitch tolerance setting (±3/±5/±10ct) because scale notes are played in quick succession without time for sustained correction. The global pitch tolerance setting (spec 012) controls the visual color coding of the deviation display (green/amber/red), not the scale acceptance threshold.
- **FR-004**: The app MUST NOT advance when the detected note does not match the expected note, regardless of how long the wrong note is held.
- **FR-005**: The app MUST record the cent deviation at the moment of acceptance for each successfully detected note.
- **FR-006**: The app MUST display a vertical pitch indicator beside the currently active note, updating in real-time at a minimum rate of 10 Hz.
- **FR-007**: The app MUST show a per-note result summary after all notes in the scale have been completed.
- **FR-008**: The app MUST provide an "Anhoren" button that plays back the scale using a warm synthesized brass tone (not a sine wave).
- **FR-009**: The app MUST auto-play the scale once on first load (per session) before the player starts; subsequent loads within the same session do not auto-play.
- **FR-010**: The app MUST support at minimum: F major, Bb major, Eb major for beginner level; all 12 major and 12 natural minor scales for intermediate; chromatic, harmonic minor, and melodic minor for advanced.
- **FR-011**: The app MUST display a suggested tempo (e.g., quarter note = 72 BPM) as an informational indicator. The suggested tempo governs playback speed of the "Anhoren" audio but does NOT enforce a time limit on the player.
- **FR-012**: The app MUST handle enharmonic equivalents correctly — F# and Gb at the same frequency MUST both match whichever spelling the scale requires.
- **FR-013**: Notes played for fewer than 200ms MUST be ignored and MUST NOT trigger an advance or a result record.
- **FR-014**: The app MUST allow the user to tap "Try again" to restart the scale exercise from the beginning.
- **FR-015**: The staff display MUST visually distinguish three note states: active (current target, filled note head), upcoming (unfilled/outline note head), and completed (grayed or annotated with result indicator + cent value).
- **FR-016**: The app MUST support ascending direction for all scale types at launch. Descending and bidirectional directions are P2 and may be deferred.

### Key Entities

- **ScaleDefinition**: Defines a scale type and key. Contains: scale type (major, natural minor, harmonic minor, melodic minor, chromatic), root note, direction (ascending / descending / both), the ordered sequence of notes with their MIDI pitch numbers and display spellings (F# vs Gb), and the key signature (number of sharps or flats). Does not contain tempo or user-specific data.

- **ScaleExercise**: A runtime instance of a scale being practiced. References a ScaleDefinition, holds the current note index (pointer into the note sequence), the suggested tempo in BPM, and the list of ScaleNoteResults accumulated so far. Owned by the current practice session.

- **ScaleNoteResult**: The outcome for a single note attempt within a ScaleExercise. Contains: expected note (MIDI pitch + display name), whether the note was matched, the cent deviation at the moment of acceptance (null if not matched), and a timestamp. One result per note position in the scale.

- **ScaleProgress** (derived / aggregate): Summary data computed from a list of ScaleNoteResults at exercise completion. Includes: count of clean notes (±10ct), count of marginal notes (±10–20ct), count of missed notes, and per-note details for display in the summary row and for persistence to the progress tracking system.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can complete a full 8-note major scale (ascending) from first tap to post-exercise summary in under 3 minutes of total interaction time (excluding actual playing time).
- **SC-002**: Note advance latency from the moment correct pitch is held for 200ms to the moment the UI advances is under 150ms on the target hardware (MacOS desktop / Tauri 2.0).
- **SC-003**: The pitch indicator updates position at a minimum of 10 times per second with no visible lag or jitter under normal playing conditions.
- **SC-004**: Detection accuracy: in a controlled test where a known pitch within ±20ct of the target is played, the app correctly identifies it as a match at least 98% of the time; a pitch outside ±25ct is rejected at least 98% of the time.
- **SC-005**: Staff notation renders correctly (correct note positions, key signature, accidentals) for all supported scales, verifiable by visual inspection against standard music theory references.
- **SC-006**: The "Anhoren" playback produces the correct pitches in the correct order with no audible artifacts, verified for all supported scales.
- **SC-007**: Per-note cent deviations recorded in ScaleNoteResult match the actual deviation at time of acceptance within ±2ct (measurement accuracy tolerance).
- **SC-008**: Leo (persona: beginner, age 10) can understand what the screen is asking him to do within 30 seconds of first opening the scale exercise screen, without reading any help text — validated by direct observation or usability testing.
