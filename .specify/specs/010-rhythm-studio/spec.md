# Feature Specification: Rhythm Studio

**Feature Branch**: `010-rhythm-studio`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Rhythm practice with 3 modes: Metronome, Pattern training, and Subdivision trainer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Metronome with beat visualization (Priority: P0)

Leo opens the Rhythm Studio and selects Metronome mode. He sets the BPM to 80, picks 4/4 time, and presses Start. Four numbered circles pulse in sequence on every beat while a click sound ticks in the background. He can feel the pulse and practice long tones against a steady reference.

**Why this priority**: The metronome is the simplest, most universally useful component of the feature. It delivers standalone value to every user on day one and serves as the audio timing backbone for Pattern and Subdivision modes. Without a working metronome the other two modes cannot function.

**Independent Test**: Can be fully tested by starting the metronome at 60, 120, and 200 BPM and verifying that the beat circles animate in exact synchrony with the click audio. Delivers value as a standalone practice tool.

**Acceptance Scenarios**:

1. **Given** the Rhythm Studio is open in Metronome mode, **When** the user presses Start at 92 BPM in 4/4, **Then** beat circles 1-2-3-4 flash sequentially at exactly 650 ms intervals and a click sound plays on each flash.
2. **Given** the metronome is running, **When** the user drags the BPM slider from 92 to 120, **Then** the beat interval updates immediately to 500 ms without stopping or restarting the sequence.
3. **Given** the metronome is running in 4/4, **When** the user switches the time signature to 3/4, **Then** only three beat circles are shown and the accent pattern updates to match 3/4 metre.
4. **Given** the metronome is running with Standard accent, **When** the user selects "Nur Eins", **Then** only beat 1 produces an accented (louder/higher) click; all other beats are unaccented.
5. **Given** the metronome is running with subdivision set to "Keine", **When** the user selects "Achtel", **Then** softer subdivision clicks are added between each main beat both audibly and as smaller visual dots.
6. **Given** the metronome is stopped, **When** the user taps the Tap Tempo button at least 3 times, **Then** the BPM field and slider update to the calculated tempo derived from the average inter-tap interval.
7. **Given** Metronome mode is active, **When** the user selects "Holzblock" from the sound selector, **Then** the metronome immediately switches to a wood-block timbre and the button shows active state.
8. **Given** the metronome is running, **When** the user adjusts the volume slider, **Then** the click sound volume changes in real time without restarting the engine.

---

### User Story 2 - Pattern playback with onset-based timing analysis (Priority: P0)

Thomas selects Pattern mode. The app shows a 4/4 pattern on a staff notation view. He presses "Anhören" to hear it once, then plays it back on his horn. After each attempt the app displays a per-beat result row: beat 1 check +8 ms, beat 2 check -3 ms, beat 3 warning +24 ms. He immediately knows which beat was late.

**Why this priority**: Per-beat timing feedback is the core differentiator of ToneTrainer versus a plain metronome. It closes the feedback loop the product spec identifies as the core problem ("practicing blind"). Delivering this as P0 establishes the unique value proposition of the app.

**Independent Test**: Can be fully tested with a single pre-defined pattern, one round of playback, and inspection of the timing result rows. Delivers the core feedback loop independently of the pattern library or multiple rounds.

**Acceptance Scenarios**:

1. **Given** Pattern mode is active with a quarter-note 4/4 pattern loaded, **When** the user presses "Anhören", **Then** the pattern plays back at the configured BPM with the beat dots animating in sync.
2. **Given** the pattern has been heard, **When** the user plays the pattern on their horn (or claps), **Then** the onset detector captures each note attack and records its timestamp relative to the expected beat position.
3. **Given** an attempt is complete, **When** the results area renders, **Then** each beat shows its label ("Schlag 1", "Schlag 2", etc.), a check or warning icon, and the deviation in milliseconds (e.g. "+8 ms", "-24 ms").
4. **Given** a beat deviation is within ±20 ms, **When** the result row renders, **Then** the icon is a green checkmark and the value is styled in green.
5. **Given** a beat deviation exceeds ±20 ms, **When** the result row renders, **Then** the icon is an amber warning and the value is styled in amber.
6. **Given** a beat is completely missed (no onset detected within a tolerance window), **When** the result row renders, **Then** the beat is marked as missed with a red cross icon.
7. **Given** the user presses the "Notation / Blöcke" toggle, **When** in notation view, **Then** the staff SVG with proper note symbols is shown; when in block view, **Then** proportional coloured blocks replace the staff.
8. **Given** rests appear in a pattern, **When** the user plays nothing on that beat, **Then** a rest position in the result row is displayed without a deviation value (rests are not penalised).

---

### User Story 3 - Subdivision Trainer (Priority: P1)

Leo wants to practise playing even eighth notes. He switches to Subdivision Trainer, selects "Achtel", sets the BPM to 80, and presses Start. He hears only the main clicks on beats 1-2-3-4 but no subdivision clicks. He plays eight notes per bar. After each bar the deviation chart shows per-subdivision dots on a small track centred at zero, along with an average ms deviation and an evenness score.

**Why this priority**: This mode teaches internal pulse subdivision — a higher-order skill than simply following a metronome. Prioritised at P1 because it requires a working metronome engine (P0) as its timing source, but delivers meaningful standalone training once the audio infrastructure exists.

**Independent Test**: Can be fully tested by running the trainer for a single bar with synthetic onset input, verifying that each subdivision slot shows a dot at the correct position on the deviation track and that the average ms figure is arithmetically correct.

**Acceptance Scenarios**:

1. **Given** Subdivision Trainer mode is active and "Achtel" is selected, **When** the user presses Start, **Then** main-beat clicks play but no subdivision clicks are heard.
2. **Given** the trainer is running in eighth-note mode, **When** the beat visualizer renders, **Then** large numbered circles appear for each main beat and a smaller dot appears between each pair of main beats.
3. **Given** the user plays an onset, **When** the onset timestamp is within the acceptance window for a subdivision slot, **Then** the corresponding small dot lights up as "hit".
4. **Given** a bar of playing is complete, **When** the deviation chart renders, **Then** each subdivision row ("Und 1", "Und 2", etc.) shows a dot positioned left or right of centre proportional to the timing deviation in ms, and a numeric label ("+ 8 ms", "−5 ms").
5. **Given** deviation is within ±15 ms for a subdivision, **When** the dot and label render, **Then** both are styled green.
6. **Given** deviation exceeds ±15 ms for a subdivision, **When** the dot and label render, **Then** both are styled amber.
7. **Given** the right panel shows the evenness score, **When** a bar completes, **Then** the "Gleichmäßigkeit" badge shows the RMS timing deviation in ms and updates each bar.
8. **Given** the user switches subdivision type from "Achtel" to "Triolen", **When** the visualizer re-renders, **Then** the number of subdivision slots changes to three per beat (e.g. "1-und-a", "2-und-a") and the deviation chart rows update accordingly.

---

### User Story 4 - Pattern library with progressive difficulty and multiple rounds (Priority: P1)

Thomas selects Pattern mode and sees the Level panel on the right. He picks "Fortgeschritten" and the app loads the next unmastered pattern from that level. He completes four rounds. In each subsequent round the per-beat timing results are shown alongside the previous round's results so he can see whether beat 3 is improving.

**Why this priority**: A single hardcoded pattern is only a proof of concept. A curated library with difficulty levels turns the feature into a sustained training tool. Multiple rounds with intra-pattern improvement tracking address the product's core goal of visible progress.

**Independent Test**: Can be tested by navigating the level selector, confirming that different patterns load for each level, completing four rounds of one pattern, and verifying that the round counter increments and the score history is retained.

**Acceptance Scenarios**:

1. **Given** the Pattern panel shows the level selector, **When** the user selects "Anfänger", **Then** only patterns containing quarter notes, simple rests, and dotted notes are available.
2. **Given** the user selects "Fortgeschritten", **When** a pattern loads, **Then** the pattern contains at least one eighth-note group or syncopated figure.
3. **Given** the user selects "Schwer", **When** a pattern loads, **Then** the pattern contains sixteenth-note combinations or tied notes.
4. **Given** the user completes round 1 of 4, **When** the round counter updates, **Then** the first dot in the round indicator is filled and the current dot pulses to indicate round 2.
5. **Given** round 2 is complete, **When** the score panel updates, **Then** the percentage timing score reflects the current round and the historical trend (e.g. "Runde 1: 65% → Runde 2: 78%") is visible.
6. **Given** four rounds are complete, **When** the user presses "Weiter", **Then** the next pattern from the selected level loads and the round counter resets to round 1.
7. **Given** the user presses "Nochmal" after any round, **When** the view resets, **Then** the same pattern reloads and the round counter does not increment.

---

### User Story 5 - Metronome sound and volume configuration (Priority: P1)

Leo finds the default click too sharp for his headphones. He taps "Holzblock" in the sound selector, adjusts the volume slider down to 50%, and the metronome immediately sounds warmer and quieter without restarting.

**Why this priority**: The product spec explicitly states that different speakers sound different and that users must be able to choose. This is not cosmetic — a badly suited click sound leads users to stop using the metronome.

**Independent Test**: Can be tested by cycling through all four sound options while the metronome is running, confirming a distinct timbre for each, and verifying that the volume slider maps linearly to perceived output level.

**Acceptance Scenarios**:

1. **Given** the sound selector shows four options (Klick, Holzblock, Rimshot, Leise), **When** the user selects each in turn, **Then** each produces an audibly distinct timbre on the next beat.
2. **Given** a sound option is selected, **When** it is active, **Then** the chip renders in the active visual state (accent colour, bold weight).
3. **Given** the volume slider is at 100%, **When** the user drags it to 0%, **Then** the click becomes inaudible without stopping the metronome animation.
4. **Given** the volume slider is mid-range, **When** the metronome sound changes, **Then** the new sound plays at the same volume level — the slider value is preserved across sound changes.

---

### User Story 6 - Multiple rounds with intra-pattern improvement tracking (Priority: P2)

After completing all four rounds of a pattern, Leo can see a small sparkline for each beat showing its deviation across rounds 1-4. Beat 3 started at +45 ms and is now at +12 ms. He knows his improvement is real.

**Why this priority**: Intra-pattern improvement visibility closes the motivational feedback loop described in the product spec. It is P2 because the core value (single-round timing feedback) is already delivered at P0. This layer makes the data meaningful over time.

**Independent Test**: Can be tested by completing four rounds with controlled timing input and verifying that each beat's round-by-round deviation values are stored and displayed correctly.

**Acceptance Scenarios**:

1. **Given** four rounds of a pattern are complete, **When** the improvement view renders, **Then** each beat row shows its deviation for each round in sequence (e.g. round 1: +45 ms, round 2: +28 ms, round 3: +18 ms, round 4: +12 ms).
2. **Given** a beat shows a decreasing deviation trend across rounds, **When** the trend indicator renders, **Then** a green downward arrow or positive trend marker is shown.
3. **Given** a beat's deviation worsened between two rounds, **When** the indicator renders, **Then** no false-positive "improved" marker is shown.

---

### User Story 7 - Custom pattern creation (Priority: P2)

Thomas wants to practise a specific bar from a piece he is working on. He opens the pattern editor, taps four beat positions, assigns note lengths, and saves the pattern as "Bar 12 Mozart". The pattern appears in his personal library alongside the built-in patterns.

**Why this priority**: Custom patterns unlock the app for teacher-assigned material and self-directed practice beyond the curated library. Deprioritised to P2 because the built-in library must first be validated with real users before the complexity of a pattern editor is justified.

**Independent Test**: Can be tested by creating a two-beat pattern with one quarter note and one rest, saving it, navigating away and back, and confirming the pattern is still available and playable.

**Acceptance Scenarios**:

1. **Given** the user opens the pattern editor, **When** they tap on a beat grid cell, **Then** a note is added at that position with a default duration of a quarter note.
2. **Given** a note is placed, **When** the user long-presses it, **Then** a duration picker appears showing half, quarter, eighth, and sixteenth options.
3. **Given** the pattern is complete, **When** the user presses Save, **Then** the pattern appears in the "Eigene" section of the pattern library.
4. **Given** a saved custom pattern is selected, **When** it loads in Pattern mode, **Then** it behaves identically to a built-in pattern including onset detection and scoring.

---

### User Story N - Rhythm Dictation Placeholder (Priority: P2)

The Rhythm Studio displays a fourth mode tab "Rhythmus-Diktat" that is visually present but disabled with a "Phase 2" badge, consistent with the Intervall-Check placeholder in spec 009. The tab is not interactive in Phase 1.

**Why this priority**: The product spec wireframe shows this mode, but implementation is deferred to Phase 2. The placeholder maintains UI consistency and signals the feature roadmap to users.

**Acceptance Scenarios**:
1. **Given** the user is in the Rhythm Studio, **When** they see the mode tabs, **Then** "Rhythmus-Diktat" appears as a fourth tab with a "Phase 2" badge and is not clickable.

---

### Edge Cases

- What happens when the user taps Tap Tempo only once? The BPM field must not update — a minimum of two taps is required to compute an interval.
- What happens if no onset is detected within the timing window for any beat during a pattern attempt? The attempt should still produce a results screen with all beats marked as missed rather than crashing or hanging.
- What happens when the onset detector captures a spurious noise (e.g. background tap) that falls outside any beat window? The onset must be silently discarded; spurious hits must not be assigned to wrong beats.
- What happens when the user rapidly switches between modes while the metronome is running? The audio engine must stop cleanly when leaving Metronome mode; no ghost ticks should continue.
- What happens when the user sets BPM to 40 (minimum) and selects Sechzehntel subdivision? Each beat interval is 1500 ms and each sixteenth slot is 375 ms — the deviation chart still needs to render without layout overflow.
- What happens when the BPM slider is adjusted by keyboard arrow keys? Increment by 1 BPM per key press; the beat engine must restart within one beat.
- What happens when the app window loses focus mid-session? The metronome timer must be paused or remain accurate using a high-resolution clock to avoid drift on resume.

---

## Requirements *(mandatory)*

### Functional Requirements

**Metronome**

- **FR-001**: The system MUST produce a metronome click at the configured BPM using a Web Audio API (or native audio API) scheduling loop with timing jitter not exceeding ±2 ms at steady state.
- **FR-002**: The BPM range MUST be 40–208. The slider MUST map linearly across this range. The +/- buttons MUST increment/decrement by 1 BPM; holding MUST repeat.
- **FR-003**: The beat visualizer MUST show numbered circles matching the selected time signature (2, 3, 4, or 6 beats). The active beat MUST flash with a scale animation lasting ≤150 ms. Done beats MUST render in a distinct "done" colour.
- **FR-004**: The system MUST support time signatures 2/4, 3/4, 4/4, and 6/8. Switching time signature while running MUST apply on the next bar boundary.
- **FR-005**: The system MUST support three accent modes: Standard (beat 1 louder and higher pitch), Nur Eins (beat 1 accented, all others silent except visual), and Ohne Betonung (all beats identical).
- **FR-006**: The system MUST support four subdivision types: Keine, Achtel, Triolen, Sechzehntel. Subdivisions MUST be played as softer clicks between main beats and shown as smaller dots between the main beat circles.
- **FR-007**: The Tap Tempo function MUST record tap timestamps, compute the mean inter-tap interval from the last 8 taps, and update the BPM display and slider. A minimum of 2 taps is required before updating.
- **FR-008**: The metronome MUST offer four sounds: Klick (sharp transient), Holzblock (wooden mid transient), Rimshot (snare-like), and Leise (soft low click). The active sound MUST change without restarting the engine.
- **FR-009**: A volume slider (0–100%) MUST control metronome output level independently of system volume.

**Pattern Mode**

- **FR-010**: The system MUST display patterns in standard staff notation rendered as SVG, showing note heads, stems, flags, beams, rests, dots, and a time signature glyph.
- **FR-011**: The system MUST provide a toggle to switch between notation view and block view. In block view, each beat is shown as a proportional coloured rectangle; rests are shown as empty outlined rectangles. The toggle state MUST persist within a session.
- **FR-012**: The system MUST play a reference audio rendering of the pattern at the configured BPM when the user presses "Anhören". Beat dots MUST animate during playback.
- **FR-013**: The onset detector MUST capture the timing of each note attack from microphone input (horn sound or clapping/tapping) with a latency compensation such that the final deviation measurement is accurate to ±10 ms.
- **FR-014**: For each beat in a pattern, the system MUST compute the deviation as `actual_onset_ms − expected_beat_ms` and store it in the PatternAttempt record.
- **FR-015**: After each attempt, the system MUST render a per-beat result row with: beat label, status icon (check ≤±20 ms, warning >±20 ms, cross = missed), and deviation value in ms.
- **FR-016**: Rests defined in the pattern MUST be excluded from timing scoring. No miss penalty is applied to rest positions.
- **FR-017**: Each pattern MUST run for 4 rounds. The round counter MUST increment after each completed attempt. "Nochmal" MUST replay the same pattern without incrementing.
- **FR-018**: The timing score for each round MUST be computed as the percentage of beats (excluding rests) with deviation ≤±20 ms. The score MUST be displayed after each round.
- **FR-019**: The pattern library MUST contain at minimum 12 patterns grouped into three difficulty levels: Anfänger (≥4 patterns), Fortgeschritten (≥4 patterns), Schwer (≥4 patterns). The level MUST be selectable from the right panel.

**Subdivision Trainer**

- **FR-020**: The Subdivision Trainer MUST play only main-beat clicks (no subdivision clicks) while the user provides subdivisions via onset detection.
- **FR-021**: The visualizer MUST show large numbered circles for main beats and smaller dots for expected subdivision positions.
- **FR-022**: When an onset is captured within an acceptance window around a subdivision slot, the corresponding dot MUST light up as "hit".
- **FR-023**: After each bar, the system MUST render a deviation chart showing one row per subdivision slot, each with: slot label ("Und 1" etc.), a horizontal track with a centred zero line, a coloured dot at the measured deviation position, and a numeric deviation value.
- **FR-024**: Green styling MUST be applied to slots with deviation ≤±15 ms; amber for deviation >±15 ms.
- **FR-025**: The right panel MUST display an evenness (Gleichmäßigkeit) score calculated as the RMS of all subdivision deviations in ms, updating after each bar.
- **FR-026**: The Subdivision Trainer MUST support three subdivision types: Achtel (1 subdivision per beat), Triolen (2 subdivisions per beat), Sechzehntel (3 subdivisions per beat). The type is selectable from the right panel.
- **FR-027**: BPM for the Subdivision Trainer MUST be independently configurable via a slider in the right panel (range 40–160).

**General**

- **FR-028**: Switching between modes MUST immediately stop the current audio engine and reset the beat visualizer.
- **FR-029**: All three mode panels (right side) MUST include a sound selector (Klick, Holzblock, Rimshot, Leise) and a volume slider that control the same underlying audio settings.
- **FR-030**: The Rhythm Studio layout MUST follow the two-column design from the mockup: a left card area for main interaction and a right panel for configuration, consistent with the app's frosted-glass bento grid style.
- **FR-031**: The light/dark theme MUST be respected by all Rhythm Studio components using the CSS custom property token system established in the mockup.

### Key Entities

- **MetronomeConfig**: Runtime configuration for the click engine — bpm (integer, 40–208), time_signature ("2/4" | "3/4" | "4/4" | "6/8"), betonung ("standard" | "nur_eins" | "ohne"), subdivision ("keine" | "achtel" | "triolen" | "sechzehntel"), sound ("klick" | "holzblock" | "rimshot" | "leise"), volume (0.0–1.0). Does not persist to storage by default; persists as last-used defaults in user settings.

- **RhythmPattern**: A curated or user-created pattern — id (string), name (string), level ("anfaenger" | "fortgeschritten" | "schwer" | "custom"), time_signature (string), bpm (integer, suggested tempo), beats (PatternBeat[]). Stored in the pattern library asset bundle; custom patterns stored in local app data.

- **PatternBeat**: One beat slot within a pattern — position (beat index, 0-based), duration ("quarter" | "eighth" | "dotted_quarter" | "half" | "sixteenth" | "tied"), is_rest (boolean). Rests are displayed but not scored.

- **PatternAttempt**: The result of one round of pattern playback — pattern_id (string), round (integer, 1–4), beat_timings (BeatTiming[]), score_pct (float 0–100), created_at (timestamp). Stored per session for intra-pattern improvement tracking.

- **BeatTiming**: A single beat result — expected_ms (absolute expected onset time within the bar in ms), actual_ms (actual captured onset time in ms, or null if missed), deviation_ms (actual_ms − expected_ms, or null), hit (boolean: true if within ±20 ms window).

- **SubdivisionAttempt**: One bar result from the Subdivision Trainer — subdivision_type ("achtel" | "triolen" | "sechzehntel"), bpm (integer), slot_timings (SlotTiming[]), rms_deviation_ms (float), created_at (timestamp).

- **SlotTiming**: One subdivision slot — slot_label (string, e.g. "Und 2"), expected_ms (float), actual_ms (float or null), deviation_ms (float or null).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The metronome click fires within ±2 ms of the scheduled beat time at all BPMs from 40 to 208, measured by comparing scheduled timestamps against AudioContext currentTime on a mid-range device.
- **SC-002**: The onset detector accurately captures note attacks from horn sound and clapping within ±10 ms of their true onset time, validated against a reference click track in a quiet environment.
- **SC-003**: Users can start the metronome, configure time signature, accent, and sound, in under 30 seconds from first opening the Rhythm Studio screen.
- **SC-004**: Per-beat timing results render within 300 ms of the final beat window closing after a pattern attempt, so feedback feels immediate.
- **SC-005**: The pattern library covers three difficulty levels with at least 4 patterns each (12 total) such that a beginner can practise for at least 10 minutes before repeating patterns.
- **SC-006**: The notation view renders all patterns correctly at viewport widths from 900 px to 1920 px without horizontal overflow or overlapping note symbols.
- **SC-007**: The Subdivision Trainer evenness score (RMS deviation) correlates meaningfully with subjective evenness: users who tap a perfectly even subdivision receive a score of ±0 ms; users who tap with consistent 30 ms early bias receive a score of approximately ±30 ms.
- **SC-008**: Switching between Metronome, Pattern, and Subdivision modes takes ≤100 ms UI transition time with no audible click artefacts from the previous mode.
- **SC-009**: The light and dark themes both render the Rhythm Studio UI without contrast violations (WCAG AA, minimum 4.5:1 for text against background).
