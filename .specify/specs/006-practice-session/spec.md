# Feature Specification: Practice Session (Fullscreen)

**Feature Branch**: `006-practice-session`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "The core experience — a guided, step-by-step practice session. Opens as fullscreen overlay, walks through exercises sequentially."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Navigate a Multi-Exercise Session Step by Step (Priority: P0)

A user opens the dashboard, sees the suggested session plan (e.g. Einblasen, Tonleiter, Intonation, Rhythmus), and taps "Session starten." The app enters fullscreen mode. The user works through each exercise sequentially: when an exercise ends, an intra-exercise summary appears and the user either repeats with "Nochmal" or advances with "Weiter." After the last exercise the Session Summary screen is shown. The user taps "Fertig" and returns to the dashboard.

**Why this priority**: This is the primary interaction loop of the entire application. Without it no other feature has context. Everything else — pitch detection, rhythm analysis, progress tracking — is exercised through this flow.

**Independent Test**: Can be fully tested by starting a session from the dashboard with a stub session plan (4 exercises with hardcoded note sequences), completing all exercises via "Weiter," and verifying the Session Summary appears. Delivers the end-to-end guided practice experience even without live audio.

**Acceptance Scenarios**:

1. **Given** a session plan with 4 exercises, **When** the user taps "Session starten," **Then** the fullscreen overlay renders with a 3 px progress bar at 0%, step labels showing Exercise 1 as active, and a countdown timer starting from the total session duration.
2. **Given** the user is on the first exercise, **When** the exercise completes, **Then** an intra-exercise summary is shown inside the exercise area, and the bottom controls display "Nochmal" and "Weiter."
3. **Given** the intra-exercise summary is visible, **When** the user taps "Nochmal," **Then** the same exercise restarts from the first tone and the exercise result data is reset.
4. **Given** the intra-exercise summary is visible, **When** the user taps "Weiter," **Then** the next exercise loads, the step label for the completed exercise is marked done, and the progress bar advances by one step fraction.
5. **Given** the user completes the final exercise and taps "Weiter," **Then** the Session Summary screen replaces the exercise view with the headline stats, highlights, improvements, exercise breakdown, optional milestone, streak update, and the "Fertig" / "Noch eine Übung" action buttons.
6. **Given** the Session Summary is showing, **When** the user taps "Fertig," **Then** the fullscreen overlay closes and the dashboard is shown with updated stats.

---

### User Story 2 — Exercise Area Renders Correct UI per Exercise Type (Priority: P0)

Each exercise type (Long Tones, Scale, Drone, Rhythm) has a distinct visual representation in the main exercise area (left panel). When the session advances to an exercise, the correct sub-component renders. The right sidebar always shows the task description, the tone/pattern sequence, and live accuracy stats.

**Why this priority**: Rendering the wrong UI for an exercise type would make the session unusable. The exercise area is the core feedback surface the user watches while playing.

**Independent Test**: Can be tested by creating a session with one exercise of each type and verifying that the correct component renders in the exercise area for each. Does not require audio input.

**Acceptance Scenarios**:

1. **Given** the current exercise is of type Long Tones, **When** the exercise area renders, **Then** it shows: animated listening bars, a large note name, a vertical pitch meter with a colored dot indicating deviation, the cent value below the meter, and a stability timeline graph.
2. **Given** the current exercise is of type Scale, **When** the exercise area renders, **Then** it shows: the scale tones on staff lines (or the active note name prominently), the vertical pitch meter, and the cent value.
3. **Given** the current exercise is of type Drone, **When** the exercise area renders, **Then** it shows: the reference drone tone label, a beating/interference waveform visualization, and the cent deviation from the drone pitch.
4. **Given** the current exercise is of type Rhythm, **When** the exercise area renders, **Then** it shows: the rhythmic pattern in standard notation (or block view if configured), a metronome beat indicator, and a timing accuracy readout.
5. **Given** any exercise type, **When** the right sidebar renders, **Then** it shows the task description text, an "Anhören" button to preview the target tone/pattern, the ordered tone/pattern sequence with checkmarks for completed items and highlight on the active item, plus live Genauigkeit (%) and Stabilität (±ct) stats.

---

### User Story 3 — Automatic Tone Advancement Within an Exercise (Priority: P0)

While playing, the app monitors pitch detection output in real time. When a tone is held within the configured pitch tolerance for a sufficient stable duration, the app automatically marks it as complete and advances to the next tone. The user does not need to press any button to move between tones within a single exercise.

**Why this priority**: This is the "smart" behavior that distinguishes ToneTrainer from a static tuner. Without auto-advancement the session flow breaks and the user is stuck waiting.

**Independent Test**: Can be tested with a mock pitch-detection stream. Feed a stable in-tune signal for the minimum hold duration, verify the current tone index increments and the sidebar tone sequence updates. Feed an out-of-tune or unstable signal and verify the index does not advance.

**Acceptance Scenarios**:

1. **Given** a tone is active and the user plays a pitch within the exercise-type-specific tolerance (see FR-008: Long Tones ±5ct/8s, Scale ±20ct/200ms, Drone per spec 009), **When** the exercise-specific advancement criteria are met, **Then** the active tone in the sidebar is marked with a checkmark, the cent result is recorded, and the next tone becomes active.
2. **Given** a tone is active and the user plays a pitch outside the tolerance band, **When** the pitch is detected, **Then** the pitch meter dot moves accordingly but the tone does not advance.
3. **Given** the last tone in an exercise is completed by auto-advancement, **Then** the exercise transitions to the intra-exercise summary state without any user button press.
4. **Given** audio input is silent (no pitch detected), **When** a tone is active, **Then** no advancement occurs and the exercise remains in the waiting state.

---

### User Story 4 — Session Summary with Stats After Completion (Priority: P0)

After all exercises in the session are completed the user sees the Session Summary. It presents three headline metrics (Pitch %, Rhythmus %, Avg ct), a "Highlights" list of what went well, a "Dran bleiben" list of what needs work, a per-exercise score breakdown, any milestone achieved in this session, the updated streak count, and two action buttons.

**Why this priority**: The summary closes the practice loop. It is the moment the user learns what happened and decides whether to keep going. Without it the session has no endpoint and no data feedback.

**Independent Test**: Can be tested by rendering the summary component with a hardcoded `SessionSummary` data object and verifying each section renders correctly.

**Acceptance Scenarios**:

1. **Given** a completed session, **When** the Session Summary renders, **Then** it shows the title "Session fertig!" with a green checkmark icon, the session date and total duration in the subtitle.
2. **Given** a completed session, **When** the stats row renders, **Then** it shows three cells — Pitch %, Rhythmus %, and Avg Abweichung in ct — with correct values from the `SessionSummary` entity.
3. **Given** a completed session with identified strengths, **When** the Highlights section renders, **Then** it shows up to three positive observations (e.g. "Bb4 perfekt getroffen — 0ct Abweichung") each prefixed with a green checkmark icon.
4. **Given** a completed session with identified weaknesses, **When** the "Dran bleiben" section renders, **Then** it shows up to three improvement notes each prefixed with an amber warning icon.
5. **Given** the exercise breakdown section renders, **Then** each exercise appears with: its numbered colored badge, exercise name and sub-detail, and its percentage score colored green/amber/red by threshold.
6. **Given** no milestone was achieved in this session, **Then** the "Neu erreicht" section is not rendered.
7. **Given** a milestone was achieved in this session, **When** the "Neu erreicht" section renders, **Then** it shows the milestone name and subtitle as a single row with a gradient card, no popup or modal.
8. **Given** the session was completed on a streak day, **When** the streak section renders, **Then** it shows the new streak count, the day-of-week indicators with past days filled in accent color and today highlighted.
9. **Given** the Session Summary is showing, **When** the user taps "Fertig," **Then** the session overlay closes and the user returns to the dashboard.
10. **Given** the Session Summary is showing, **When** the user taps "Noch eine Übung," **Then** the app presents a way to add or repeat an exercise and re-enter the session flow.

---

### User Story 5 — Pause and Resume (Priority: P1)

The user can pause the session at any time. While paused, the session timer stops, audio analysis stops (no pitch or onset detection), and the exercise area goes into a visual paused state. Resuming restores everything to the exact state before the pause.

**Why this priority**: Essential for any real practice context (phone call, break, distraction). Without pause the user must abandon the session.

**Independent Test**: Can be tested by starting a session, pressing Pause, waiting a known duration, pressing Resume, and verifying the timer did not advance during the pause interval and audio analysis was suspended.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the user taps "Pause" or presses Space, **Then** the timer freezes, audio analysis suspends, the listening animation stops, and the Pause button label changes to "Weiter" (resume).
2. **Given** a paused session, **When** the user taps the resume button or presses Space again, **Then** the timer resumes from exactly where it stopped, audio analysis restarts, and the exercise area returns to the active state.
3. **Given** a paused session, **When** the user does not interact for an extended period, **Then** the session remains paused indefinitely without auto-closing.

---

### User Story 6 — Repeat Exercise (Priority: P1)

At the intra-exercise summary the user can choose "Nochmal" to repeat the exercise from the beginning. The repeat does not count as a separate exercise in the session plan but the result from the best (or last) attempt is used for the session summary.

**Why this priority**: Repetition is the core learning mechanism in practice. The product spec explicitly states "Wiederholung explizit ermöglichen."

**Independent Test**: Can be tested by completing an exercise, pressing "Nochmal," completing it again, then pressing "Weiter," and verifying the session advances to the next exercise and only one result is recorded per exercise slot.

**Acceptance Scenarios**:

1. **Given** an intra-exercise summary, **When** the user taps "Nochmal," **Then** the exercise restarts from tone index 0 with a fresh `ExerciseResult` accumulator and the sidebar sequence resets to all-upcoming.
2. **Given** a user completes the same exercise multiple times, **When** the session summary is generated, **Then** only one `ExerciseResult` per exercise slot is included, using the result of the most recent attempt.

---

### User Story 7 — Keyboard Shortcuts (Priority: P1)

Desktop users can control the session entirely from the keyboard without reaching for the mouse.

**Why this priority**: ToneTrainer runs as a Tauri desktop app. The user has both hands on the instrument; keyboard shortcuts enable eyes-free and hands-near control.

**Independent Test**: Can be tested by firing keyboard events in the session view and asserting the correct state transitions occur.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the user presses Space, **Then** the session pauses; pressing Space again resumes.
2. **Given** an active exercise, **When** the user presses Arrow Right, **Then** the current tone is skipped and the next tone becomes active (manual advance).
3. **Given** an intra-exercise summary is showing, **When** the user presses R, **Then** the exercise repeats (equivalent to "Nochmal").
4. **Given** an active session, **When** the user presses Escape, **Then** a confirmation prompt appears; confirming closes the session and returns to the dashboard without saving the incomplete result.

---

### User Story 8 — Milestone Detection and Display in Summary (Priority: P1)

After a session, the app checks whether any milestone condition was crossed for the first time. If a milestone is reached it is displayed as a single unobtrusive row in the Session Summary.

**Why this priority**: Milestones mark genuine progress events. They must be detected and shown without popup or gamification theatre, consistent with the design philosophy from section 4c of the product spec.

**Independent Test**: Can be tested by constructing a `SessionSummary` that satisfies a known milestone condition (e.g. all rounds of a rhythm pattern above 85%) and asserting the "Neu erreicht" section renders with the correct milestone text and is absent when the condition is not met.

**Acceptance Scenarios**:

1. **Given** the session results satisfy a milestone condition that has not been previously recorded, **When** the Session Summary renders, **Then** the "Neu erreicht" section shows the milestone name and a short sub-description as a gradient card row.
2. **Given** the same milestone has already been recorded from a previous session, **When** the Session Summary renders, **Then** the "Neu erreicht" section is absent even if the condition is met again.
3. **Given** multiple milestones are achieved in one session, **Then** each milestone is shown as its own row in the "Neu erreicht" section.

---

### User Story 9 — Skip Exercise Mid-Session (Priority: P2)

During an active exercise the user can skip it entirely and jump to the next exercise without completing any tones. The skipped exercise is recorded with a null/incomplete result in the session summary and does not influence the aggregate score.

**Why this priority**: Edge case; useful for experienced users who want to skip exercises they have already warmed up for. Lower priority because the session still functions correctly without this.

**Independent Test**: Can be tested by triggering skip on exercise 2 of a 4-exercise session and verifying the session jumps to exercise 3, the progress bar updates correctly, and the summary shows exercise 2 as skipped.

**Acceptance Scenarios**:

1. **Given** an active exercise, **When** the user activates the skip action (implementation TBD: long-press "Weiter" or a dedicated control), **Then** the exercise ends immediately, the step label is marked as skipped (visually distinct from "done"), and the next exercise loads.
2. **Given** an exercise was skipped, **When** the Session Summary renders the exercise breakdown, **Then** the skipped exercise row shows "Übersprungen" instead of a score.

---

### Edge Cases

- What happens when the session plan has only one exercise? The progress bar should still render (showing 100% after completion) and "Weiter" after the single exercise goes directly to the Session Summary.
- What happens if audio permission is not granted when the session starts? The session must show a non-blocking warning and allow the user to proceed in "silent mode" where tones must be advanced manually via Arrow Right.
- What happens if the app loses focus (window minimized) mid-session? The session should auto-pause and remain paused until the window regains focus.
- What happens if the timer reaches 0:00 during an active exercise? The timer stops at 0:00 but the exercise continues until the user completes or skips it; the session summary records the actual elapsed time.
- What happens if pitch detection produces a very high jitter signal (noisy environment)? Tone auto-advancement must require a continuous stable window, not just a momentary in-tune reading, to avoid false advances.
- What happens on very small screen sizes (Tauri window resized below 768 px)? The two-panel layout should collapse: sidebar content moves below the exercise area or into a collapsible drawer.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The session MUST render as a fullscreen overlay (position: fixed, inset: 0, z-index above all navigation) that completely covers the main app shell including the sidebar and header.
- **FR-002**: The session header MUST show a 3 px thin progress bar at the very top whose fill width represents current exercise index / total exercise count.
- **FR-003**: The session header MUST show step labels for each exercise in the plan, with distinct visual states: upcoming (dim), active (full weight), done (checkmark or muted).
- **FR-004**: The session header MUST show a countdown timer displaying remaining session time in MM:SS format using tabular numerals.
- **FR-005**: The session content area MUST use a two-column layout: a main exercise area (flexible width) and a fixed 280 px right sidebar.
- **FR-006**: The exercise area MUST render a different sub-component depending on the exercise type: LongToneView, ScaleView, DroneView, or RhythmView. Note: The Drone exercise within a guided session reuses the Drone-Übung mode from Tone Lab (spec 009) with session-specific constraints: the Grundton and target intervals are pre-selected by the session engine (spec 005), auto-advance follows the same pattern as Long Tones (hold within tolerance for a configured duration), and the result feeds into the session summary.
- **FR-007**: The right sidebar MUST always show: task description text, an "Anhören" button that plays the target tone or pattern audio, the ordered tone/pattern sequence list, and live Genauigkeit and Stabilität stats.
- **FR-008**: Within an exercise, the system MUST auto-advance to the next tone according to the exercise-type-specific advancement criteria defined in the exercise's own specification:
  - Long Tones (spec 007): ±5ct tolerance, 8s hold duration, stability threshold
  - Scale (spec 008): ±20ct tolerance, 200ms hold duration
  - Drone (spec 009): exercise-specific criteria
  The Practice Session MUST NOT define its own generic auto-advance parameters that override exercise-specific specs.
- **FR-009**: After the final tone of an exercise is completed, the system MUST transition to an intra-exercise summary state showing the exercise result, with "Nochmal" and "Weiter" controls visible.
- **FR-010**: The bottom control bar MUST always contain a Pause button on the left and a control group on the right that shows "Nochmal" + "Weiter" during intra-exercise summary, or is minimal/hidden during active exercise.
- **FR-011**: Pressing Pause MUST immediately freeze the session timer and suspend audio analysis; pressing Resume (same button) MUST restore both.
- **FR-012**: The system MUST compute a `SessionSummary` entity when all exercises are completed and navigate to the Session Summary screen.
- **FR-013**: The Session Summary MUST display: session title ("Session fertig!"), session date and total duration, three headline stats (Pitch %, Rhythmus %, Avg ct), Highlights section, Dran bleiben section, exercise breakdown with per-exercise scores, streak update, and "Fertig" / "Noch eine Übung" action buttons.
- **FR-014**: The Session Summary MUST conditionally display a "Neu erreicht" section only when at least one new milestone was achieved and not previously recorded.
- **FR-NEW**: The Session Summary MUST display any milestones achieved during the session as inline notification lines (not popups), consistent with the milestone system defined in spec 011. If no milestones were achieved, this section is hidden.
- **FR-015**: The keyboard shortcuts Space (pause/resume), Arrow Right (advance tone), R (repeat exercise at summary), and Escape (exit with confirmation) MUST be active during the session and MUST NOT conflict with default browser/Tauri behaviors.
- **FR-016**: Pressing Escape during an active session MUST show a confirmation step before closing; dismissing the confirmation returns to the session.
- **FR-017**: The session overlay MUST hide the main app sidebar and navigation so the practice area has zero visual distractions.

### Key Entities

- **ActiveSession**: Represents the runtime state of an in-progress session. Attributes: `plan` (ordered list of exercise definitions), `current_exercise_index` (integer), `elapsed_ms` (integer, counts up), `paused` (boolean), `started_at` (timestamp). Relationships: owns zero or more `ExerciseResult` objects (one per completed exercise slot).
- **ExerciseResult**: Represents the outcome of a single completed exercise attempt. Attributes: `exercise_type` (Long Tones | Scale | Drone | Rhythm | new_challenge), `notes_played` (list of note observations with target pitch, detected pitch, deviation ct, duration ms), `accuracy_pct` (integer 0–100), `avg_deviation_ct` (float), `duration_ms` (integer), `skipped` (boolean). Relationships: belongs to one `ActiveSession`. Note: `new_challenge` exercises are always rendered using the sub-view of their underlying exercise type (e.g., a new_challenge Scale renders as a ScaleView). The `new_challenge` flag is metadata for the session engine, not a distinct view type.
- **SessionSummary**: The read-only aggregate computed at session end. Attributes: `total_duration_ms`, `exercises_completed` (integer), `pitch_accuracy` (integer 0–100, weighted average across pitch exercises), `rhythm_accuracy` (integer 0–100, average across rhythm exercises), `avg_deviation_ct` (float), `highlights` (list of strings), `improvements` (list of strings), `milestone` (optional milestone reference or list thereof), `streak_days` (integer). Derived from a list of `ExerciseResult` objects.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can start a session and complete all exercises through to the Session Summary in a single uninterrupted flow without encountering any blocking errors or dead-end states.
- **SC-002**: Tone auto-advancement responds within 200 ms of the stability threshold being met, measured from the moment the minimum stable hold duration is satisfied to the moment the next tone becomes active.
- **SC-003**: The session timer drifts by no more than ±100 ms per minute relative to wall-clock time; pausing and resuming does not accumulate timer drift.
- **SC-004**: The Session Summary renders with correct aggregated stats (Pitch %, Rhythmus %, Avg ct) that match the sum of the individual `ExerciseResult` values for that session — verifiable in automated tests with known fixture data.
- **SC-005**: Milestone detection produces no false positives (milestone shown when not earned) and no false negatives (milestone not shown when first earned) across all milestone definitions from section 4c of the product spec, verified by unit tests over fixture session data.
- **SC-006**: The fullscreen overlay covers 100% of the viewport with zero visible navigation elements (sidebar, header, tab bar) during an active session.
- **SC-007**: Keyboard shortcuts (Space, Arrow Right, R, Escape) respond correctly on first press with no perceptible lag, testable via synthetic keyboard event dispatch in unit/integration tests.
- **SC-008**: The session can be paused and resumed at any point within an exercise without data loss (the tone sequence state, elapsed time, and partial `ExerciseResult` are all preserved through the pause/resume cycle).
