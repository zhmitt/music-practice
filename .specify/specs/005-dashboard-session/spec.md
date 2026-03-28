# Feature Specification: Dashboard & Session Engine

**Feature Branch**: `005-dashboard-session`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Dashboard home screen with daily session suggestion and quick stats; Session Engine generates smart practice sessions based on rules"

---

## User Scenarios & Testing

### User Story 1 — Daily Session Suggestion on Dashboard (Priority: P0)

Leo opens the app after school. The dashboard immediately shows today's suggested practice session: a title ("Freitag: Review"), a total duration, and a numbered list of exercises with type, name, detail, and time allocation. He presses "Session starten" and begins practicing without any configuration.

**Why this priority**: This is the entry point for 80% of all app interactions. Without a compelling, pre-built session on the home screen, users have no clear call to action and the core value proposition collapses.

**Independent Test**: Can be fully tested by launching the app and verifying the dashboard displays a populated session card with at least one exercise and a working "Session starten" button — before any practice data exists.

**Acceptance Scenarios**:

1. **Given** a user has completed onboarding (instrument, level, session duration set), **When** they open the app on any day, **Then** the dashboard displays a session card with: a title reflecting the day/context, total duration matching the user's configured session length, and 2–4 exercises each with type label, name, detail text, and time in minutes.

2. **Given** a brand-new user with no practice history, **When** the dashboard loads, **Then** the session engine falls back to a default warm-up-first session appropriate for the user's stated level, and the session card is fully populated (not empty or showing an error state).

3. **Given** a session card is shown, **When** the user taps "Session starten", **Then** the practice session launches in fullscreen mode with the first exercise active.

---

### User Story 2 — Session Engine Generates Rule-Based Sessions (Priority: P0)

Thomas opens the app on a Tuesday. He has been practicing for 3 weeks. The engine examines his history, sees F5 has been consistently sharp, and builds a session: Long Tones warm-up first, then a drone exercise targeting F5, then a scale rotation, all fitted to his 20-minute budget.

**Why this priority**: The session engine is the intelligence layer that differentiates ToneTrainer from a plain tuner app. Without smart generation, the dashboard degenerates into static content.

**Independent Test**: Can be fully tested by seeding pitch history data (F5 at +15ct across 5 sessions) and asserting that the generated session includes a weakness exercise targeting F5, opens with Long Tones, and does not exceed the configured time budget.

**Acceptance Scenarios**:

1. **Given** a user's practice history contains a note with avg cent deviation > ±10ct over at least 3 sessions, **When** the engine generates a session, **Then** the plan includes an exercise type that directly addresses that note (drone exercise or targeted long tone), placed after the warm-up.

2. **Given** a user has practiced the same scale 3 days in a row, **When** the engine generates today's session, **Then** the rotation rule selects a different exercise for the variety slot (not the same scale again).

3. **Given** today is Friday, **When** the engine generates a session, **Then** the session title reflects "Review" and the exercise selection favors previously practiced material rather than new elements.

4. **Given** a user's configured session duration is 15 minutes, **When** the engine builds a session plan, **Then** the sum of all exercise durations equals exactly 15 minutes, and no individual exercise has been cut mid-way (durations are adjusted in whole minutes, minimum 1 min per exercise).

5. **Given** the engine formula (Warm-up + Weakness + Rotation + Optional new challenge), **When** the time budget is too short to fit all four slots, **Then** the optional new challenge slot is dropped first, then rotation is shortened, but warm-up is never removed.

---

### User Story 3 — Streak Tracking and Display (Priority: P1)

Leo checks the streak card on the dashboard. It shows "5" in large type, a row of Mo–So indicators with today highlighted, and completed days filled in. This gives him a quick visual of his consistency this week.

**Why this priority**: Streak visibility is a lightweight motivation signal that requires no action from the user. It surfaces commitment without gamification.

**Independent Test**: Can be fully tested independently by seeding session records for the past 7 days and asserting the streak card displays the correct consecutive count and the correct day indicators in the weekly row.

**Acceptance Scenarios**:

1. **Given** a user has practiced on each of the last 5 consecutive days including today, **When** the dashboard loads, **Then** the streak card shows "5" and the day indicators for those days are filled/active.

2. **Given** a user missed yesterday but practiced today, **When** the dashboard loads, **Then** the streak resets to 1, yesterday's day indicator is empty, and today's is highlighted as current.

3. **Given** a user has never practiced, **When** the dashboard loads, **Then** the streak card shows "0" or "–" and all weekly day indicators are empty.

---

### User Story 4 — Week Progress Toward Practice Goal (Priority: P1)

The week progress card shows "68%" with a gradient progress bar and "1h 42m / 2h 30m" in small text below. Thomas can tell at a glance whether he is on track for his weekly goal without navigating to the Progress screen.

**Why this priority**: Gives users an ambient awareness of their practice commitment. Complements the streak without duplicating it — streak measures consecutive days, week progress measures total time.

**Independent Test**: Can be fully tested by seeding session records for the current week and asserting the percentage, progress bar fill, and time labels reflect the correct values given the user's configured weekly goal.

**Acceptance Scenarios**:

1. **Given** a user has practiced 102 minutes this week against a 150-minute goal, **When** the dashboard loads, **Then** the week progress card shows "68%", a bar filled to 68%, and the label "1h 42m / 2h 30m".

2. **Given** a user has met or exceeded the weekly goal, **When** the dashboard loads, **Then** the bar is fully filled (100%), percentage shows 100% (or the actual over-percentage), and the display does not overflow or break layout.

3. **Given** it is Monday with no practice yet this week, **When** the dashboard loads, **Then** the card shows "0%", an empty bar, and "0m / [goal]".

---

### User Story 5 — Last Session Summary Display (Priority: P1)

Below the streak and week progress cards, a compact card shows the most recent session: the date/time ("Gestern, 18:30"), duration (22 min), pitch accuracy (87%), rhythm accuracy, and average cent deviation. This lets the user quickly re-orient before starting today's session.

**Why this priority**: Contextualizes today's suggestion with yesterday's outcome. Closes the feedback loop without requiring a click into the Progress screen.

**Independent Test**: Can be fully tested by creating a single completed session record and asserting the last session card renders the correct date, duration, pitch %, rhythm %, and avg ct values.

**Acceptance Scenarios**:

1. **Given** a completed session exists in history, **When** the dashboard loads, **Then** the last session card displays: the human-readable date ("Gestern" / "Montag, 25.03" depending on recency), duration in minutes, pitch accuracy as a percentage, and average cent deviation.

2. **Given** no session has ever been completed, **When** the dashboard loads, **Then** the last session card shows a neutral empty state (e.g., "Noch keine Session") without crashing or showing undefined values.

3. **Given** a session was completed today, **When** the dashboard loads, **Then** the date label reads "Heute, [time]" rather than "Gestern".

---

### User Story 6 — Weak Spots Display (Priority: P1)

The weak spots card shows the top 3 problem tones with a horizontal deviation bar and a cent value. F5 at +15ct has a long bar in red-amber; Eb4 at -12ct has a shorter bar with a trend note. Thomas can see at a glance which notes need the most attention this week.

**Why this priority**: The weak spots card is the direct output of the pitch tracking investment. It closes the loop between raw pitch data and actionable practice focus, without requiring navigation to the full Progress screen.

**Independent Test**: Can be fully tested by seeding pitch deviation records for multiple notes across multiple sessions and asserting the card displays the correct top-3 notes sorted by absolute avg deviation, with correct values and direction indicators.

**Acceptance Scenarios**:

1. **Given** pitch history contains at least 3 notes with sample_count >= 5, **When** the dashboard loads, **Then** the weak spots card lists up to 3 notes sorted by absolute average cent deviation descending, each with its note name, deviation value with direction sign, and a bar proportional to deviation magnitude.

2. **Given** a previously problematic note has improved (deviation < ±5ct in the last 3 sessions), **When** the dashboard loads, **Then** a trend indicator (e.g., "besser als letzte Woche") appears alongside that note's entry.

3. **Given** no pitch history exists yet, **When** the dashboard loads, **Then** the weak spots card shows a neutral empty state ("Noch keine Daten") without crashing.

---

### User Story 7 — Session Customization via "Anpassen" (Priority: P1)

After seeing today's suggestion, Leo wants to swap the rhythm exercise for an extra drone session. He taps "Anpassen" and is presented with the exercise list in an editable state: he can remove an exercise, add one from a library, or reorder them. The total duration updates live. He confirms and starts the modified session.

**Why this priority**: Users must feel in control. The engine's suggestion is a starting point, not a constraint. Without "Anpassen", power users and anyone whose teacher assigned different homework will be frustrated.

**Independent Test**: Can be fully tested independently by tapping "Anpassen" on the session card, removing one exercise, adding a different one, verifying the total duration updates, and confirming the modified plan is used when "Session starten" is pressed.

**Acceptance Scenarios**:

1. **Given** the session card is displayed, **When** the user taps "Anpassen", **Then** an editing interface appears showing the current exercise list with controls to remove, add, and reorder exercises.

2. **Given** the user is in the edit mode, **When** they add or remove an exercise, **Then** the total session duration updates in real time to reflect the change.

3. **Given** the user has modified the session and taps confirm, **When** the session launches, **Then** it uses the user-modified plan, not the originally generated one.

4. **Given** the user is in edit mode, **When** they attempt to remove the warm-up (Long Tones), **Then** the UI prevents removal and shows an explanatory note ("Einblasen ist Pflicht").

---

### User Story 8 — Quick-Links to Tone Lab and Rhythmus-Studio (Priority: P2)

At the bottom of the dashboard, two card-style quick-link buttons let the user jump directly to Tone Lab or Rhythmus-Studio for unstructured free practice, bypassing the session flow entirely.

**Why this priority**: Some users (especially Thomas) will sometimes prefer freeform exploration over a guided session. Quick-links reduce friction for this secondary flow without cluttering the primary session card area.

**Independent Test**: Can be fully tested by verifying the two quicklink cards render on the dashboard and tapping each navigates to the correct view.

**Acceptance Scenarios**:

1. **Given** the dashboard is visible, **When** the user taps the Tone Lab quick-link card, **Then** the Tone Lab view loads.

2. **Given** the dashboard is visible, **When** the user taps the Rhythmus-Studio quick-link card, **Then** the Rhythmus-Studio view loads.

---

### User Story 9 — Day-of-Week Session Adaptation (Priority: P2)

On Fridays, the session engine automatically enters "Review" mode: exercises focus on previously covered material from the week, the title says "Freitag: Review", and no new elements are introduced.

**Why this priority**: Scheduled review is a proven learning technique. Encoding Friday as review day provides structure without requiring manual user configuration.

**Independent Test**: Can be fully tested by mocking the system date to a Friday, generating a session, and asserting the title contains "Review" and no "new challenge" slot is present in the exercise list.

**Acceptance Scenarios**:

1. **Given** today is Friday, **When** the session engine runs, **Then** the generated session title includes "Review" and the exercise list consists only of exercises practiced earlier in the current week (or defaults to the most recently practiced types if no data exists).

2. **Given** today is Friday and the user has no practice history from this week, **When** the engine runs, **Then** it falls back to a standard warm-up-first session (the "Review" label still appears but exercises default gracefully).

---

### Edge Cases

- What happens when the user's configured session duration is very short (e.g., 5 minutes)? The engine must fit a minimal viable session: warm-up only (3 min) + one short exercise (2 min), with no crash.
- What happens when all exercise slots would sum to less than the time budget? The warm-up duration is extended to fill remaining time, up to a maximum of 5 minutes.
- What happens when pitch history exists but sample_count is too low (< 3 samples per note) to be statistically reliable? Those notes are excluded from the weak spots card and the weakness exercise slot.
- What happens when the app is opened past midnight but the user hasn't slept yet (subjective "today" problem)? The session date boundary is configurable (default: midnight), and the engine uses wall-clock date, not a "smart" day boundary, for MVP.
- What happens when the user rapidly taps "Session starten" multiple times? The button is disabled after the first tap to prevent duplicate session records.
- What happens when two sessions are completed on the same calendar day? Both are stored; streak and week progress count the day once; last session card shows the most recent.

---

## Requirements

### Functional Requirements

- **FR-001**: The dashboard MUST display a session card on every load, populated with a title, total duration, and 2–4 exercises (type, name, detail, duration_min).
- **FR-002**: The session engine MUST always place a Long Tones warm-up exercise as the first exercise in every generated plan.
- **FR-003**: The session engine MUST include a weakness exercise when any note has avg_cent_deviation > ±10ct with sample_count >= 3; otherwise this slot is omitted.
- **FR-004**: The session engine MUST respect the user's configured session duration: the sum of all exercise durations MUST equal the configured total exactly (±0 minutes), with no exercise duration falling below 1 minute.
- **FR-005**: The session engine MUST NOT assign the same exercise type to both the warm-up and the rotation slot in a single session.
- **FR-006**: The session engine MUST track the last 7 days of exercise types used and avoid repeating the same rotation exercise on consecutive days.
- **FR-007**: On Fridays, the session engine MUST set the session title to include "Review" and MUST NOT include new challenge exercises.
- **FR-008**: A new challenge exercise MUST only be introduced if the user's avg pitch accuracy across the last 3 sessions is >= 80%.
- **FR-009**: The dashboard MUST display a streak card showing the current consecutive-day streak count and a Mo–So day indicator row for the current week.
- **FR-010**: The dashboard MUST display a week progress card showing practiced minutes, goal minutes, and a percentage bar for the current calendar week (Mon–Sun).
- **FR-011**: The dashboard MUST display a last session card showing date/time, duration, pitch accuracy (%), rhythm accuracy (%), and avg cent deviation for the most recently completed session.
- **FR-012**: When no session history exists, all stat cards (streak, week progress, last session, weak spots) MUST render empty states without errors or undefined values.
- **FR-013**: The dashboard MUST display a weak spots card showing up to 3 notes with the highest absolute avg cent deviation (minimum sample_count of 3), sorted descending by absolute deviation.
- **FR-014**: The weak spots card MUST show a trend indicator for notes that have improved or worsened compared to the prior 7-day period.
- **FR-015**: The "Anpassen" link MUST open a session edit interface that allows adding, removing, and reordering exercises, with the total duration updating in real time.
- **FR-016**: The system MUST prevent removal of the warm-up (Long Tones) exercise in the session edit interface.
- **FR-017**: A modified session plan MUST be used verbatim when "Session starten" is pressed after editing; the originally generated plan MUST NOT override it.
- **FR-018**: The "Session starten" button MUST be disabled after the first tap until the session view has fully loaded, to prevent duplicate session creation.
- **FR-019**: The dashboard MUST display two quick-link cards (Tone Lab, Rhythmus-Studio) that navigate to the respective views.
- **FR-020**: The session plan for a given day MUST be regenerated fresh each time the app is opened; the engine does not cache yesterday's plan.

### Key Entities

- **SessionPlan**: Represents a single day's generated or customized practice plan. Key attributes: `id` (UUID), `date` (calendar date), `exercises` (ordered list of Exercise), `total_duration_min` (integer), `generated_by_rules` (boolean — false if user-modified), `day_of_week` (0–6), `is_review_day` (boolean).

- **Exercise**: A single practice unit within a SessionPlan. Key attributes: `type` (enum: `long_tones` | `scale` | `drone` | `rhythm` | `new_challenge`), `name` (display name, e.g., "F-Dur"), `detail` (contextual instruction, e.g., "Drone auf F3"), `duration_min` (integer, min 1), `config` (type-specific JSON blob, e.g., target note, BPM, scale key).

- **WeekProgress**: Aggregated view of the current calendar week's practice. Derived from CompletedSession records. Key attributes: `practiced_minutes` (integer), `goal_minutes` (integer from user settings), `days_practiced` (list of dates), `streak_current` (integer), `streak_best` (integer, all-time).

- **WeakSpot**: Represents a note with a statistically significant intonation problem. Derived from PitchSample records. Key attributes: `note_name` (e.g., "F5"), `avg_cent_deviation` (float, positive = sharp), `trend` (enum: `improving` | `worsening` | `stable`), `sample_count` (integer), `first_seen` (date when note first appeared as problematic).

- **CompletedSession**: A record of a finished practice session. Key attributes: `id` (UUID), `date` (timestamp), `duration_min` (integer), `pitch_accuracy_pct` (float 0–100), `rhythm_accuracy_pct` (float 0–100 or null if no rhythm exercise), `avg_cent_deviation` (float), `exercises_completed` (list of Exercise types).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fresh app install completes onboarding and arrives at a dashboard with a fully populated session card in under 3 seconds on target hardware (no loading spinner shown for the session card).
- **SC-002**: The session engine produces a valid session plan (correct time budget, warm-up first, no rule violations) in under 100ms, measurable via unit test timing assertions.
- **SC-003**: In unit tests covering all 6 session engine rules, 100% of rule assertions pass for a set of at least 20 generated plans with varying history inputs (including zero-history, one-week history, and multi-week history with identified weak spots).
- **SC-004**: The "Session starten" button tap-to-fullscreen transition completes in under 200ms (measured from tap to first frame of the session view).
- **SC-005**: All five dashboard stat cards (session, streak, week progress, last session, weak spots) render their empty states without console errors when the local database contains zero session records.
- **SC-006**: The session customization flow (open "Anpassen", modify one exercise, confirm) completes without data loss: the modified plan is preserved and launched correctly in 100% of test runs.
- **SC-007**: Streak calculation is correct (matches expected value) for all edge cases in the test suite: first-ever session, broken streak, same-day double session, and multi-week continuous streak.
