# Feature Specification: Tone Lab

**Feature Branch**: `009-tone-lab`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Free-form pitch training — no guided session, open-ended. 4 modes: Freies Spielen, Drone-Ubung, Zielton-Training, Intervall-Check (Phase 2)."

---

## User Scenarios & Testing

### User Story 1 — Free Play with Real-Time Pitch Feedback and Vertical Meter (Priority: P0)

Leo opens Tone Lab and lands on Freies Spielen by default. As he plays his horn, the center of the left panel shows the detected note name in large type, its frequency in Hz below, and a vertical pitch meter with a glowing dot that moves up (sharp) or down (flat) in real time. A cent deviation number updates continuously beneath the meter. Leo gets immediate, honest feedback on every note — exactly like a high-quality tuner, but embedded inside the full ToneTrainer context.

**Why this priority**: Freies Spielen is the entry point for every Tone Lab visit. If real-time pitch display is broken or missing, the entire feature is unusable. All other modes depend on the same pitch-detection and meter subsystem proven here first.

**Independent Test**: Open Tone Lab in Freies Spielen mode, play any note on a horn (or inject a synthetic 466 Hz signal), and verify that the note name (Bb), Hz value, vertical dot position, and cent readout all update within 100ms and match the injected pitch.

**Acceptance Scenarios**:

1. **Given** the user opens Tone Lab for the first time, **When** the screen loads, **Then** the Freies Spielen tab is selected by default, the left panel shows an idle state (listening bars animating, no stale note from a previous session), and the right panel shows mode selector, session stats (all zeroed), and an empty tendency list.

2. **Given** the user plays a note within the horn's range, **When** a stable pitch is detected (>150ms consistent), **Then** the note name appears in the large display (e.g., "Bb"), the Hz value is shown beneath it (e.g., "466.16 Hz"), the vertical pitch dot moves to the correct position on the meter, and the cent deviation readout shows the signed value (e.g., "+8ct").

3. **Given** the user is playing a note at +8 cents sharp, **When** the pitch meter is observed, **Then** the dot is positioned above center by a distance proportional to the deviation — +50ct maps to the top of the track, 0ct maps to center, -50ct maps to the bottom — and the dot transitions smoothly as pitch changes, updating at minimum 20 times per second.

4. **Given** the user stops playing (silence), **When** no pitch is detected for more than 250ms, **Then** the note display clears (or dims), the vertical dot returns to the center neutral position, and the Hz label shows dashes or blanks — the display does not hold stale data.

5. **Given** the user's pitch exceeds ±50 cents from the nearest semitone, **When** the meter would overflow, **Then** the dot clamps at the edge of the track and the cent readout continues showing the true value (e.g., "-62ct") without crashing or wrapping.

---

### User Story 2 — 60-Second Rolling Stability Graph (Priority: P0)

Thomas wants to see not just the current moment but how steady his tone has been over the last minute. Below the pitch meter, a rolling line graph fills from right to left, plotting cent deviation over time across a 60-second window. He can see immediately whether his tone is drifting, how stable his long tones are, and whether he corrected a tendency mid-phrase.

**Why this priority**: This is the core differentiator from a plain tuner. It surfaces stability — a dimension invisible in any single-moment reading — and makes Tone Lab useful for deliberate practice rather than casual checking.

**Independent Test**: Hold a note at a fixed pitch for 10 seconds, then gradually slide sharp over 5 seconds, then return to center. Verify the graph accurately plots the path in real time, that the window scrolls smoothly as time passes, and that data older than 60 seconds is discarded from the display.

**Acceptance Scenarios**:

1. **Given** the user has been playing for under 60 seconds, **When** the graph is observed, **Then** it shows all detected pitch data from the start of the session, plotted as a continuous line from the left edge onward — the right portion of the canvas is empty.

2. **Given** the user has been playing for more than 60 seconds, **When** new pitch data arrives, **Then** the oldest data scrolls off the left edge and the graph always shows exactly the most recent 60 seconds of data, smoothly without visual jumps.

3. **Given** the user stops playing for 5 seconds (silence), **When** the graph renders those 5 seconds, **Then** there is a visible gap (no line) in the graph for the silence period — silence is not plotted as 0ct.

4. **Given** the user is playing consistently at +15ct (consistently sharp), **When** the graph is observed, **Then** the line runs above the center reference line, and the visual offset above center corresponds correctly to the +15ct deviation.

5. **Given** the session starts fresh, **When** the graph first receives data, **Then** the plot begins at the right edge and fills leftward over time — it does not pre-fill with placeholder data.

---

### User Story 3 — Drone Exercise with Beating Visualization (Priority: P0)

Thomas switches to Drone-Ubung. The app synthesizes a warm brass drone on C4 (suggested for his level). He plays a perfect fifth (G4) above it. The left panel shows the drone note and his detected note, the interval name "Quinte", and his cent deviation from the pure fifth. Below, a sine wave with amplitude modulation visualizes Schwebung (acoustic beating): when he is far off, the wave pulses rapidly; as he tunes in, the pulses slow; when perfectly in tune, the wave is steady. This gives him a visual and ultimately auditory guide to pure intonation.

**Why this priority**: Drone exercise is the most pedagogically powerful mode in Tone Lab. Intonation against a reference is a fundamental brass skill, and the beating visualization is a unique, physics-grounded feedback mechanism that no standard tuner provides. It is P0 alongside Freies Spielen because it is the feature that will differentiate ToneTrainer in the market.

**Independent Test**: Set the drone to C4, inject a pitch of G4 +20ct (impure fifth). Verify the interval badge shows "Quinte +20ct", the beating visualization pulses at approximately 7.8 Hz (corresponding to 20ct deviation at the G4 frequency), and slows noticeably as the injected pitch approaches 0ct deviation.

**Acceptance Scenarios**:

1. **Given** the user selects Drone-Ubung, **When** the mode loads, **Then** the drone starts playing immediately at the suggested Grundton for the configured instrument and level, the left panel shows the drone note name and Hz, and the interval panel shows "— waiting —" until a user pitch is detected.

2. **Given** the drone is playing C4 and the user plays G4 within ±40 cents of a pure fifth (702 cents above C4), **When** the pitch is detected, **Then** the interval badge shows "Quinte" with the cent deviation (e.g., "Quinte +12ct"), and the user's note name and Hz are displayed above the interval badge.

3. **Given** the user's pitch is 20 cents above the pure fifth, **When** the beating visualization is rendered, **Then** the amplitude modulation rate of the sine wave corresponds to the acoustic beat frequency derived from the frequency difference between the user's pitch and the target fifth — a larger deviation produces a faster modulation rate, a smaller deviation produces a slower rate.

4. **Given** the user tunes to within ±3 cents of the pure fifth, **When** the beating visualization renders, **Then** the beat rate is very slow (< 1 Hz equivalent), the waveform appears nearly steady, and a "fast in tune" indicator or color change is shown.

5. **Given** the user stops playing, **When** no pitch is detected for more than 250ms, **Then** the interval badge clears, the user note display clears, and the beating visualization resets to a neutral steady-state sine wave — the drone continues playing.

6. **Given** the user wants to change the drone Grundton, **When** they interact with the Grundton selector in the right panel, **Then** a dropdown lists all chromatic pitches in the instrument's practical range, the current suggestion is pre-selected and labeled "(suggested)", and selecting a different note immediately changes the drone pitch without stopping playback.

7. **Given** the interval sequence (Quinte → Quarte → Terz → Oktave) is displayed in the right panel, **When** the user manually advances to the next interval, **Then** the expected interval updates, the deviation calculation uses the new target interval, and the previous interval row is marked as done.

---

### User Story 4 — Zielton Training with Staff Notation and Pitch Indicator (Priority: P1)

Leo switches to Zielton-Training. The left panel shows a five-line staff with a treble clef and a note head on it — the target note. A vertical pitch indicator floats beside the staff. He presses "Anhoren" to hear the target note played through the app's synthesizer. Then he plays it on his horn. The pitch indicator moves in real time as he approaches the target. When he is close enough, the app records a hit. He can press "Nachster Ton" to move to the next target manually, or wait for auto-advance when accuracy is confirmed.

**Why this priority**: Zielton-Training adds structured note targeting to the free-play experience. It is P1 because it requires staff rendering (already developed in 008-scale-exercise) and depends on the pitch meter from User Story 1. It delivers significant training value but can ship after the P0 modes are stable.

**Independent Test**: Run Zielton-Training with a predetermined sequence of target notes. Inject pitches matching each target within ±15ct. Verify that the hit counter increments, the avg deviation updates correctly, and "Nachster Ton" advances to the next note. Test "Anhoren" button independently by verifying it triggers audio synthesis of the displayed target note.

**Acceptance Scenarios**:

1. **Given** the user opens Zielton-Training, **When** the mode loads, **Then** the staff displays the first target note on the correct staff line/space with a treble clef, the pitch indicator beside the staff is at center/neutral, and the hit counter shows "0 / —".

2. **Given** a target note is displayed, **When** the user presses "Anhoren", **Then** the app plays the target note as a synthesized tone (warm, not a beep) for approximately 1.5 seconds, and the button is briefly disabled during playback to prevent double-trigger.

3. **Given** the user is playing and the detected pitch is within ±20 cents of the target note, **When** this is sustained for at least 400ms, **Then** the app registers a hit, the hit counter increments, and the deviation for this note is recorded and averaged into the session avg deviation.

4. **Given** a hit is registered, **When** the auto-advance behavior applies, **Then** the next target note appears on the staff within 1 second, the pitch indicator resets to neutral, and the tone history list in the right panel gains a new row showing the previous note and its deviation.

5. **Given** the user presses "Nachster Ton" at any time, **When** the button is pressed, **Then** the current target is skipped (not counted as a hit), the next note loads, and the skip is not recorded against accuracy statistics.

6. **Given** the vertical pitch indicator is active beside the staff, **When** the user plays at +8ct deviation, **Then** the indicator marker is positioned above the staff center by the correct proportional amount, matching the same physical behavior as the meter in Freies Spielen.

---

### User Story 5 — Tendency Display: Session and Historical (Priority: P1)

Thomas has been playing in Freies Spielen for 20 minutes. The right panel shows a tendency list with the notes he has played most, their average cent deviation this session, and — for notes that have enough historical data — a comparison to previous sessions (e.g., "F5 +15ct since 2 weeks"). This gives him the "problem note" insight that the product spec calls out as a core differentiator.

**Why this priority**: Tendency is the feature that transforms Tone Lab from a tuner into a practice companion. It surfaces the recurring problems a player cannot hear themselves. It is P1 because it requires accumulated session data and persistence, but the core pitch feedback works without it.

**Independent Test**: Simulate a session where F5 is consistently played at +13ct to +17ct (five detections). Verify the tendency list shows F5 with an average deviation around +15ct and a "consistently high" indicator. Then load a historical dataset where F5 was +15ct across three previous sessions, and verify the historical context label is shown.

**Acceptance Scenarios**:

1. **Given** the user has played a given note at least 5 times during the current session, **When** the tendency list is rendered, **Then** that note appears in the list with its average cent deviation (signed, e.g., "+15ct") calculated from all detections this session.

2. **Given** a note's average deviation this session exceeds ±10ct, **When** the tendency row is rendered, **Then** a warning indicator is shown (e.g., color-coded dot or "consistently high/low" label) to flag it as a systematic tendency rather than random variation.

3. **Given** historical data exists for a note across at least 3 prior sessions, **When** the tendency list renders that note, **Then** a secondary label shows the historical average deviation and the time period (e.g., "historically +15ct since 2 weeks"), allowing the user to see whether the current session tendency is a long-standing pattern.

4. **Given** a note's historical deviation was worse than the current session's deviation, **When** the tendency row is rendered, **Then** a "improving" indicator is shown (e.g., a subtle positive delta label) to give the user positive reinforcement.

5. **Given** the user has played fewer than 5 detections of a given note, **When** the tendency list is considered, **Then** that note is not shown (insufficient data), and no spurious single-reading tendency entries appear.

---

### User Story 6 — Session Stats Tracking (Priority: P1)

Leo plays in Tone Lab for 12 minutes. The right panel shows live session stats: total notes detected, accuracy percentage (notes within ±20ct), elapsed time, and average stability. When he stops the session, the stats are persisted as a ToneLabSession record, separate from Practice Sessions, and feed into the historical tendency calculation.

**Why this priority**: Stats make the session feel meaningful and provide the raw data that powers tendency analysis. They are P1 because core pitch feedback functions without them, but without stats, historical tendency cannot exist.

**Independent Test**: Run a simulated 5-minute session with 30 injected pitch events (20 within ±20ct, 10 outside). Verify the stats panel shows 30 total tones, 67% accuracy, correct elapsed time, and that stopping the session persists a ToneLabSession record retrievable from storage.

**Acceptance Scenarios**:

1. **Given** the user starts a new Tone Lab session, **When** the first pitch is detected, **Then** the session timer starts, the tone count increments to 1, and accuracy initializes based on whether that first note was within ±20ct.

2. **Given** the session has accumulated 47 detected notes (38 within ±20ct), **When** the stats panel is observed, **Then** it shows "47 tones", "92% accuracy (38 hits)", and the running elapsed time — all updating live.

3. **Given** the user switches between modes (e.g., Freies Spielen to Drone-Ubung) within a single Tone Lab visit, **When** stats are displayed, **Then** all detections across all modes are aggregated into the single session total — the session is not reset on mode switch.

4. **Given** the user stops or navigates away from Tone Lab, **When** the session ends, **Then** a ToneLabSession record is persisted with: session ID, mode breakdown, start time, duration, array of detected notes with timestamps and cent deviations, and computed accuracy and avg stability values.

5. **Given** a ToneLabSession is persisted, **When** the historical tendency calculator runs, **Then** it reads the note detections from all sessions within the configured lookback period and computes per-note average deviations to power the tendency display.

---

### User Story 7 — Interval Check Mode (Priority: P2, Phase 2 — Grayed Out)

The Interval Check tab is visible in the mode selector but grayed out with a "Phase 2" badge. The user cannot activate it. It serves as a roadmap signal: the app will eventually allow users to play two consecutive notes and have the app recognize the interval.

**Why this priority**: Interval recognition requires multi-note detection logic that does not exist in Phase 1. Showing the tab as disabled sets expectations correctly without hiding the roadmap.

**Independent Test**: Verify the Intervall-Check tab renders with 0.35 opacity, does not respond to click events, shows the "Phase 2" badge, and does not render any mode-specific content when focused.

**Acceptance Scenarios**:

1. **Given** the user views the Tone Lab mode selector, **When** the Intervall-Check tab is rendered, **Then** it is visually dimmed (opacity ~0.35), shows a "Phase 2" badge, and clicking it has no effect — the current mode does not change.

2. **Given** the user interacts with other UI elements while Intervall-Check is "selected" via direct DOM manipulation, **When** any event fires, **Then** no interval detection logic runs and no crashes occur — the disabled state is enforced in application logic, not just CSS.

---

### Edge Cases

- What happens when the microphone is unavailable or permission is denied? The Tone Lab screen must display a clear permission prompt and not crash. The pitch meter and all mode displays show a "no audio" state rather than stale or zero-cent data.
- What happens if the drone synthesis produces audio glitches (buffer underrun)? The app must recover silently within one audio buffer cycle and log the event without showing an error to the user.
- What happens when historical tendency data is absent (first-ever session)? The tendency list shows only session data with no historical labels — no empty state errors, no "undefined since" text.
- What happens if the user plays a note outside the instrument's configured range? The note is still detected and displayed — Tone Lab does not constrain detection to the configured range. However, the tendency list only logs notes within range for historical analysis.
- What happens to session stats if the app crashes mid-session? The session is either written to persistent storage incrementally (preferred) or discarded cleanly — no partial corrupt records that would corrupt historical tendency averages.
- What happens when two pitches are detected simultaneously (multiphonics or room noise)? The pitch detection algorithm reports the most stable / loudest fundamental. It does not attempt to display two pitches at once.
- What happens when the drone Grundton is changed while the user is playing? The drone pitch changes immediately on selection. The beating visualization resets to compute against the new Grundton. No click or discontinuity in the audio synthesis is tolerable — crossfade or immediate clean switch required.
- What happens when the stability graph reaches 60 seconds with no gaps? The graph scrolls smoothly without visual stuttering. The frame rate of the graph rendering does not cause the main UI thread to stutter at 60s boundary.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST display the currently detected pitch as a note name, Hz value, and signed cent deviation, updating at minimum 20 times per second.
- **FR-002**: The system MUST render a vertical pitch meter with a proportionally positioned dot: 0ct at center, ±50ct at the top/bottom extents, clamped beyond ±50ct.
- **FR-003**: The system MUST render a 60-second rolling stability graph that plots cent deviation over time, scrolls as time advances, and shows silence as a gap (no line).
- **FR-004**: The system MUST provide a Drone-Ubung mode that synthesizes a warm brass drone tone (Grundton plus 2-3 harmonics, no sine tone, no organ) using in-process synthesis (no external samples required for Phase 1).
- **FR-005**: The drone synthesis MUST produce the Grundton plus harmonics in a ratio consistent with a brass instrument timbre, with adjustable volume.
- **FR-006**: The system MUST display a beating (Schwebung) visualization in Drone-Ubung mode: a sine wave whose amplitude modulation rate corresponds to the acoustic beat frequency between the drone's target interval and the user's actual pitch.
- **FR-007**: The beat frequency calculation MUST use the actual frequency difference in Hz between the user's detected pitch and the expected pure-interval pitch, mapping that difference directly to the modulation rate of the visualization.
- **FR-008**: The system MUST allow the drone Grundton to be freely selected via dropdown from all chromatic pitches in the instrument's practical range, with the instrument-appropriate suggestion pre-selected and labeled.
- **FR-009**: The system MUST support a suggested interval sequence for Drone-Ubung: Quinte (702ct) → Quarte (498ct) → Terz (386ct for pure / 400ct for equal) → Oktave (1200ct), with manual advancement between intervals.
- **FR-010**: The system MUST provide a Zielton-Training mode that renders a target note on a five-line treble-clef staff with correct note-head placement on lines and spaces, including ledger lines for notes outside the standard five lines.
- **FR-011**: Zielton-Training MUST provide an "Anhoren" button that plays the target note as a synthesized tone for approximately 1.5 seconds; on the first note of a session, playback is automatic; thereafter, it is on demand.
- **FR-012**: Zielton-Training MUST provide a "Nachster Ton" button that manually advances to the next target note without recording a hit.
- **FR-013**: A hit in Zielton-Training is defined as a detected pitch within ±20ct of the target note sustained for at least 400ms. Auto-advance fires within 1 second of a confirmed hit.
- **FR-014**: The system MUST track session statistics in real time: total notes detected, accuracy percentage (notes within ±20ct of nearest semitone), elapsed session time, and average cent deviation.
- **FR-015**: Session statistics MUST be aggregated across all modes used in a single Tone Lab visit (no reset on mode switch).
- **FR-016**: The system MUST persist a ToneLabSession record when the user ends a Tone Lab session, containing: session ID, start timestamp, duration, mode breakdown, array of ToneLabNote detections (note, Hz, cent deviation, timestamp), computed accuracy, and average stability.
- **FR-017**: The system MUST display a tendency list in the right panel for Freies Spielen mode, showing notes with at least 5 detections this session, their average deviation, and a "consistently high/low" flag when the average exceeds ±10ct. Consistent with spec 001 FR-015 minimum sample count.
- **FR-018**: The tendency list MUST show historical context (average deviation and period) for notes that have at least 3 prior session records, sourced from persisted ToneLabSession data.
- **FR-019**: The Intervall-Check tab MUST be rendered in the mode selector as disabled (opacity ~0.35, no-click) with a "Phase 2" badge, with no functional implementation behind it.
- **FR-020**: The system MUST support dark and light themes; all Tone Lab UI elements MUST use the design token system (CSS custom properties) and switch correctly on theme change.
- **FR-021**: The entire Tone Lab screen MUST be usable as an open-ended session with no forced timer, no session steps, and no completion requirement — the user plays until they choose to stop.
- **FR-022**: The drone volume MUST be independently adjustable via a slider in the right panel without stopping or restarting the drone.

### Key Entities

- **ToneLabSession**: Represents a complete Tone Lab visit. Attributes: `id`, `mode_sequence` (list of modes used in order), `start_time` (ISO timestamp), `duration_ms`, `notes_detected` (array of ToneLabNote), `accuracy_pct`, `avg_deviation_ct`, `avg_stability_ct`.
- **ToneLabNote**: A single pitch detection event within a session. Attributes: `note_name` (e.g., "Bb4"), `frequency_hz`, `cent_deviation`, `timestamp_ms` (ms from session start), `mode` (which Tone Lab mode was active), `is_hit` (boolean, within ±20ct of nearest semitone).
- **DroneConfig**: Runtime configuration for the drone synthesizer. Attributes: `grundton_note` (e.g., "C4"), `grundton_hz`, `volume` (0.0–1.0), `target_interval_cents` (e.g., 702 for Quinte), `sound_type` (initially always "brass-synthetic").
- **BeatingVisualization**: Computed visualization parameters for Schwebung display. Attributes: `beat_frequency_hz` (acoustic beat rate = |user_hz - target_hz|), `amplitude_modulation_rate` (beat_frequency_hz, 1:1 mapping), `is_in_tune` (true when beat_frequency_hz < 0.5).
- **ToneLabTendency**: Computed tendency entry for a single note. Attributes: `note_name`, `session_avg_deviation_ct`, `session_sample_count`, `historical_avg_deviation_ct` (null if no prior data), `historical_period_label` (e.g., "since 2 weeks"), `is_consistently_off` (|session_avg| > 10ct), `trend` ("improving" | "stable" | "worsening" | "no-history").

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Pitch display latency — the note name, Hz, and cent readout update within 100ms of the acoustic event, measured from the moment of pitch onset to the moment of visual update.
- **SC-002**: Stability graph accuracy — the plotted cent deviation at any point in the 60-second window differs from the ground-truth pitch input by no more than ±2ct.
- **SC-003**: Beating visualization correctness — the amplitude modulation rate of the Schwebung wave is within ±0.2 Hz of the true acoustic beat frequency for deviations between 5ct and 50ct.
- **SC-004**: Drone Grundton switching — changing the Grundton via dropdown applies the new pitch within one audio buffer cycle (< 50ms) with no audible click or gap longer than 20ms.
- **SC-005**: Zielton hit detection accuracy — when a note matching the target within ±20ct is held for 400ms, the system registers a hit in 100% of cases; when a note deviating by more than ±25ct is held, it is never registered as a hit.
- **SC-006**: Session persistence — after a session of at least 1 minute with at least 10 detected notes, the persisted ToneLabSession record is retrievable and contains data matching the in-session display within rounding tolerance.
- **SC-007**: Tendency correctness — after 5 detections of a note at +15ct average, the tendency list shows that note at +15ct ±2ct.
- **SC-008**: Mode switch continuity — switching between Tone Lab modes takes less than 300ms to update the left panel content with no crash and no loss of accumulated session stats.
- **SC-009**: UI responsiveness — the Tone Lab screen maintains 60fps rendering during active pitch detection and graph updates on the minimum supported hardware target (defined in app shell spec 003).
- **SC-010**: Accessibility — all interactive controls (mode tabs, Grundton dropdown, volume slider, Anhoren button, Nachster Ton button) are keyboard-accessible and have visible focus states compliant with the project's accessibility baseline.
