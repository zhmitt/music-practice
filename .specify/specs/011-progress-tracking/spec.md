# Feature Specification: Progress & Tracking

**Feature Branch**: `011-progress-tracking`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Long-term analytics dashboard showing practice trends, problem areas, and achievements."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Headline Stats with Trend Comparison (Priority: P0)

A player opens the Progress view and immediately sees how they are doing: total practice time, number of sessions, average pitch deviation, and current streak — each with a comparison to the previous period. This gives them a meaningful at-a-glance sense of momentum before they look at any chart.

**Why this priority**: This is the first thing a user sees when they tap the Progress tab. Without these four numbers, the entire view feels empty and unmotivating. It is the fastest possible signal of "am I improving?" and drives return visits.

**Independent Test**: Can be fully tested by opening the Progress view with a populated local database and verifying the four stat cards render with correct values and correct trend indicators. Delivers meaningful value as a standalone "quick check" screen even without charts.

**Acceptance Scenarios**:

1. **Given** the user has completed at least one session, **When** they open the Progress view, **Then** all four stat cards (Übungszeit, Sessions, Avg Pitch, Streak) render with a non-zero primary value.
2. **Given** the user has sessions in two different calendar months, **When** they view the stats, **Then** each card shows a trend comparison to the previous equivalent period (e.g., "+2h vs. last month"), with a green up-arrow for positive trends.
3. **Given** the user's average pitch deviation decreased from the previous period, **When** they view the Avg Pitch card, **Then** the trend indicator shows a down-arrow colored green (lower deviation = improvement).
4. **Given** the user has no sessions at all, **When** they open the Progress view, **Then** stat cards render with "—" or zero values and no trend indicators; no crash or empty state error occurs.
5. **Given** the user's current streak is 0 (did not practice today or yesterday), **When** they view the Streak card, **Then** the card shows "0 Tage" and displays the all-time record streak beneath it.

---

### User Story 2 — Pitch Development Graph (Priority: P0)

A player wants to see whether their intonation is improving over time. They view a line chart showing their weekly average cent deviation over the selected time period. A line sloping downward means they are getting more in tune.

**Why this priority**: Pitch accuracy is the core skill ToneTrainer trains. Seeing a trend line move toward zero is the primary long-term motivator. Without this chart, the app cannot demonstrate that practice is having an effect.

**Independent Test**: Can be fully tested by checking that the SVG line chart renders correct data points for a known set of sessions, that the Y-axis is labeled in centitones, that the X-axis shows correct week labels for the selected period, and that switching time periods re-renders the chart with the appropriate subset of data.

**Acceptance Scenarios**:

1. **Given** the user has sessions spanning at least 2 weeks, **When** they view the Pitch Development chart, **Then** a line chart renders with one data point per week, the Y-axis represents cent deviation (0ct at top), and the current week's point is visually highlighted.
2. **Given** the user selects the "4W" period tab, **When** the chart renders, **Then** it shows at most 4 weekly data points; selecting "6M" shows monthly aggregates for up to 6 months; selecting "7T" shows daily points for 7 days; selecting "Ges." shows all available weekly data.
3. **Given** the user's average cent deviation decreased over the displayed period, **When** they view the chart, **Then** the line slopes downward from left to right.
4. **Given** the user has only one session (one data point), **When** they view the chart, **Then** a single point renders with no connecting line, without crash.
5. **Given** there are no sessions in the selected period, **When** they view the chart, **Then** the chart area shows an empty state ("Keine Daten für diesen Zeitraum") rather than rendering a broken chart.

---

### User Story 3 — Problem Tones List (Priority: P0)

A player wants to know which specific notes they consistently play out of tune. They see a ranked list of up to 5 notes, each showing the note name, the size and direction of the deviation, a trend description (e.g., "seit 3 Wochen" or "besser werdend"), and a concrete practice recommendation.

**Why this priority**: Knowing *which* notes to focus on is what makes ToneTrainer an intelligent practice companion rather than just a statistics tracker. This directly drives behavior — the user picks up their instrument and works on the listed notes.

**Independent Test**: Can be fully tested with a known set of session data by verifying that the correct top-N notes appear in descending order of deviation magnitude, that trend text matches the computed trend direction, and that the recommendation references the worst note by name.

**Acceptance Scenarios**:

1. **Given** the user has session data with pitch measurements per note, **When** they view Problem-Töne, **Then** up to 5 notes are listed, ranked by descending average absolute cent deviation, each showing note name, a deviation bar, a cent value, a trend description, and one recommendation card at the bottom for the worst note.
2. **Given** a note has been above the deviation threshold for 3 or more consecutive weeks, **When** it appears in the list, **Then** the trend text reads "seit N Wochen" and the bar/indicator is colored amber.
3. **Given** a note's average deviation improved by more than 2ct compared to the previous equivalent period, **When** it appears in the list, **Then** the trend text reads "besser werdend" and the indicator is colored green.
4. **Given** a note has fallen below ±5ct average deviation this week, **When** it appears in the list, **Then** the trend text reads "fast perfekt" or it is removed from the list entirely.
5. **Given** fewer than 3 unique notes have been played with a deviation above the threshold, **When** the section renders, **Then** only those available notes are listed; if zero, an empty state reads "Noch keine konsistenten Abweichungen erkannt."

---

### User Story 4 — Calendar Heatmap (Priority: P1)

A player wants to see their practice consistency over the past month at a glance. A GitHub-style calendar grid shows each day as a cell, colored by practice intensity, with today highlighted distinctly.

**Why this priority**: Visual consistency feedback is a well-proven habit-building pattern. However, because it shows only *whether* the user practiced (not *how well*), it is less critical than the pitch charts and problem-tone analysis.

**Independent Test**: Can be fully tested by verifying that the correct number of weeks are rendered, that days with zero practice render as empty cells, that days with practice render in the correct intensity tier based on minutes practiced, and that today's cell uses the "today" highlight style.

**Acceptance Scenarios**:

1. **Given** the current date, **When** the heatmap renders, **Then** a 7-row (Mon–Sun) grid is shown with enough columns to cover at least 4 complete weeks ending with the current week; today's cell is visually distinguished (solid accent color, glow).
2. **Given** a day with 0 minutes of practice, **When** it renders, **Then** the cell uses the empty/background color.
3. **Given** a day with practice, **When** it renders, **Then** the cell color maps to one of three intensity tiers: low (1–14 min), mid (15–29 min), high (30+ min).
4. **Given** future days in the current week (after today), **When** they render, **Then** they appear as empty cells indistinguishable from days with zero practice — no future-date special state.
5. **Given** a month boundary falls within the displayed range, **When** the heatmap renders, **Then** month labels are visible above the relevant columns so the user can orient themselves in time.

---

### User Story 5 — Rhythm Development Graph (Priority: P1)

A player wants to see whether their rhythm accuracy is improving over time. A line chart shows weekly average timing accuracy as a percentage, ascending toward 100%. The interaction model mirrors the Pitch Development graph.

**Why this priority**: Rhythm is the second core skill after pitch. This chart is the rhythm equivalent of User Story 2, and its structure is nearly identical. It is P1 rather than P0 because rhythm tracking is Phase 2 functionality in the product roadmap — the chart must exist but can render an empty state if no rhythm data is available yet.

**Independent Test**: Can be fully tested independently from pitch data. With a known set of rhythm session records, verify that the chart renders correct weekly accuracy values, Y-axis runs 50%–100%, and ascending slope indicates improvement.

**Acceptance Scenarios**:

1. **Given** the user has completed rhythm exercises, **When** they view the Rhythmus-Entwicklung chart, **Then** a line chart renders with one point per week showing average timing accuracy %; the Y-axis runs from 50% (bottom) to 100% (top).
2. **Given** no rhythm exercises have been completed, **When** the chart section renders, **Then** it shows an empty state ("Noch keine Rhythmusdaten vorhanden") rather than a broken chart.
3. **Given** the user selects a time period, **When** the rhythm chart re-renders, **Then** it uses the same period as the pitch chart — the period selector is shared and affects both charts simultaneously.
4. **Given** a week had multiple rhythm sessions, **When** that week's point renders, **Then** the value is the arithmetic mean of all timing accuracy percentages for that week.

---

### User Story 6 — Session Journal (Priority: P1)

A player wants to review their practice history. A chronological list of sessions shows date, duration, which exercises were covered, pitch accuracy, and rhythm accuracy for each session. Rows are clickable to open a detail view.

**Why this priority**: The session journal makes the database of completed sessions navigable and legible. It provides context for the aggregated charts — a player can see which specific sessions caused an outlier in a graph. It is P1 because the value of the list depends on having enough sessions to make browsing useful, which takes time.

**Independent Test**: Can be fully tested by verifying that sessions are listed in reverse-chronological order, that each row shows the correct date, duration, exercise names, pitch %, and rhythm %, and that clicking a row navigates to a session detail view (or placeholder if P2 detail view is not yet implemented).

**Acceptance Scenarios**:

1. **Given** the user has completed sessions, **When** they view the Übungstagebuch, **Then** sessions are listed most-recent-first; each row shows: date (localized), duration in minutes, exercise list (truncated with ellipsis if too long), pitch accuracy %, and rhythm accuracy %.
2. **Given** a session had no rhythm exercises, **When** it renders in the journal, **Then** the rhythm accuracy column shows "—" rather than 0%.
3. **Given** the user taps a session row, **When** the tap is registered, **Then** the app navigates to the session detail view for that session.
4. **Given** the user has more than 20 sessions, **When** they scroll the journal, **Then** sessions load incrementally (pagination or virtual scroll) without visible jank.
5. **Given** no sessions have been completed, **When** the journal section renders, **Then** it shows an empty state ("Noch keine Sessions aufgezeichnet").

---

### User Story 7 — Milestone Timeline (Priority: P1)

A player wants to see the key moments in their practice history: when they first held a tone stably, when they hit a 7-day streak, when a problem tone finally fell below ±5ct. A minimal chronological timeline lists these events without gamification framing.

**Why this priority**: Milestones serve as narrative anchors in the player's progress story. They make long-term improvement feel tangible. They are P1 rather than P0 because they depend on a working system for detecting and persisting milestone events — that infrastructure must exist before the timeline can render meaningfully.

**Independent Test**: Can be fully tested in isolation from the rest of the Progress view by seeding a set of milestone records and verifying that each renders with the correct title, description, date, category badge, and that the most recent milestone is visually distinguished.

**Acceptance Scenarios**:

1. **Given** the user has achieved at least one milestone, **When** they view Meilensteine, **Then** milestones are listed most-recent-first; each row shows: a dot on the timeline, a date, a one-line description, and a small category badge (Pitch / Stabilität / Rhythmus / Konsistenz).
2. **Given** the most recent milestone, **When** it renders, **Then** its timeline dot uses the accent color and a filled center dot; older milestones use the subtle unfilled dot style.
3. **Given** a streak milestone is achieved, **When** it appears in the timeline, **Then** the description reads exactly as defined in section 4c of the product spec (e.g., "7 Tage in Folge geübt") without trophy or badge imagery.
4. **Given** no milestones have been achieved, **When** the section renders, **Then** it shows an empty state ("Noch keine Meilensteine erreicht — weiter üben!") without the timeline chrome.
5. **Given** the user achieved the same milestone type twice (e.g., two different problem tones fell below ±5ct), **When** both events are listed, **Then** each appears as a separate row with its own date and the specific note name in the description.

---

### User Story 8 — Time Period Selector (Priority: P1)

A player wants to examine different time horizons. A segmented control with four options (7 Tage / 4 Wochen / 6 Monate / Gesamt) filters the Pitch Development graph, Rhythm Development graph, and headline stat trend comparisons simultaneously.

**Why this priority**: Without a time period selector, the charts are frozen to one fixed window. The selector transforms the charts from a single view into an exploratory tool. It is P1 because it depends on the charts themselves (P0) existing first.

**Independent Test**: Can be fully tested by verifying that selecting each period option causes both charts and the stat trend labels to re-compute and re-render with data from the correct date range, and that the selected tab is visually active.

**Acceptance Scenarios**:

1. **Given** the Progress view is open, **When** the user taps a period tab (7T / 4W / 6M / Ges.), **Then** the active tab is highlighted, and both SVG charts re-render using data from that period within 200ms.
2. **Given** "7T" is selected, **When** the pitch chart renders, **Then** the X-axis shows daily labels for the past 7 days.
3. **Given** "4W" is selected, **When** the pitch chart renders, **Then** the X-axis shows weekly labels W1–W4.
4. **Given** "6M" is selected, **When** the pitch chart renders, **Then** the X-axis shows monthly labels for the past 6 months.
5. **Given** "Ges." is selected, **When** the pitch chart renders, **Then** the X-axis shows all weeks available from the first session to the current week, up to a reasonable maximum (e.g., 52 weeks).
6. **Given** the period selector state changes, **When** the headline stat trend labels update, **Then** the comparison period in the trend text also reflects the new period (e.g., "vs. letzte 7 Tage" vs. "vs. letzter Monat").

---

### User Story 9 — Session Detail View (Priority: P2)

A player taps a session in the journal and sees the full breakdown: every exercise, the pitch accuracy per note, rhythm accuracy per pattern, total duration, and any milestones achieved during that session.

**Why this priority**: P2 because it requires the P1 journal to exist first, and because the value increases with number of sessions — early users get more value from the aggregate charts. The detail view is a depth feature for engaged users.

**Independent Test**: Can be fully tested by navigating to the detail view for a known session and verifying that all recorded exercises, per-note pitch data, and per-pattern rhythm data are correctly displayed.

**Acceptance Scenarios**:

1. **Given** the user taps a journal row, **When** the detail view opens, **Then** it shows: session date, total duration, a list of exercises with per-exercise accuracy, and any milestones that were achieved during that session.
2. **Given** a session had pitch exercises, **When** the detail view renders, **Then** each played note is shown with its average cent deviation for that session, colored green (≤5ct), amber (6–15ct), or red (>15ct).
3. **Given** a session had no rhythm exercises, **When** the detail view renders, **Then** the rhythm section is absent rather than showing empty rows.

---

### User Story 10 — Milestone Notifications in Session Summary (Priority: P1)

When a player finishes a session that triggered one or more milestone achievements, a discreet one-line notification appears in the session summary screen, so they notice the achievement in context without a disruptive popup.

**Why this priority**: P1 because spec 006 FR-NEW already requires the Session Summary to display milestones inline. The detection logic must exist for the summary to render them. This is tightly coupled with spec 006 User Story 8 (Milestone Detection, also P1).

**Independent Test**: Can be fully tested by simulating a session that crosses a milestone threshold and verifying that the session summary shows the milestone line and that the same milestone is recorded in the timeline.

**Acceptance Scenarios**:

1. **Given** a session triggers a milestone, **When** the session summary screen opens, **Then** a single line (not a modal or popup) reads the milestone description, e.g., "Meilenstein: 7 Tage in Folge geübt".
2. **Given** a session triggers multiple milestones, **When** the summary renders, **Then** each is listed as a separate line, stacked vertically.
3. **Given** a session triggers no milestones, **When** the summary renders, **Then** no milestone section appears.

---

### Edge Cases

- What happens when there is only one day of practice data? Heatmap renders one filled cell; charts render a single point without a connecting line; trend comparisons show "—" rather than a delta.
- What happens when the user's timezone changes (e.g., travel)? Session dates are stored as local-time dates; streak calculation must be timezone-aware and consistent with the device's current timezone.
- What happens when the database contains sessions with partially missing data (e.g., a session saved without pitch data)? Those sessions appear in the journal but are excluded from pitch chart aggregates without causing a crash.
- What happens when the user has practiced every single day for over a year? The "Gesamt" chart must not overflow or truncate silently — it renders up to 52 weekly buckets and groups older data into a "before" marker if needed.
- What happens when avg_pitch_deviation for a week is exactly 0ct? The chart renders a point at the top of the Y-axis; no divide-by-zero or display anomaly occurs.
- What happens when a session is deleted by the user via the data-reset setting? The Progress view re-computes all aggregates from the remaining sessions; milestones that depended on the deleted session are NOT retroactively revoked.
- What happens on a narrow viewport (tablet/mobile)? The two-column row (heatmap + pitch chart) stacks vertically; the four stat cards wrap to 2×2; no horizontal overflow occurs.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compute and display four headline stat cards: total practice time (hh:mm), session count, average pitch deviation (±ct), and current streak (days), each with a trend comparison to the previous equivalent period.
- **FR-002**: The system MUST render a GitHub-style calendar heatmap showing at least 4 complete weeks, with cells colored across 4 intensity levels based on minutes practiced per day, and today's cell distinguished with the accent color.
- **FR-003**: The system MUST render a Pitch Development line chart with average cent deviation on the Y-axis (lower = better) and time on the X-axis, using the selected time period.
- **FR-004**: The system MUST render a Rhythm Development line chart with timing accuracy percentage on the Y-axis (higher = better) and time on the X-axis, using the selected time period.
- **FR-005**: The system MUST display a Problem-Töne list of up to 5 notes ranked by descending average absolute cent deviation, each with: note name, deviation bar with directional indicator, cent value, trend text, and a recommendation card for the top note.
- **FR-006**: The system MUST display a Meilensteine timeline listing all achieved milestones in reverse-chronological order, with date, description, and category badge, using the milestone types defined in product spec section 4c.
- **FR-007**: The system MUST display an Übungstagebuch session journal listing all completed sessions in reverse-chronological order, each row showing date, duration, exercise list (truncated), pitch %, and rhythm %.
- **FR-008**: The system MUST provide a time period selector with four options — 7 Tage, 4 Wochen, 6 Monate, Gesamt — that simultaneously updates both development charts and the headline stat trend comparisons.
- **FR-009**: Each session journal row MUST be clickable and navigate to a session detail view (P2; until P2 is implemented, tapping the row is a no-op or shows a placeholder).
- **FR-010**: The system MUST detect milestone achievements at session completion and persist them to the local database; milestone detection is idempotent (completing the same session twice does not create duplicate milestones).
- **FR-011**: All data MUST be read exclusively from the local SQLite database; no network requests are made by this feature.
- **FR-012**: The Progress view MUST render correctly (no crash, no broken state) when the database contains zero sessions.
- **FR-013**: Trend indicators MUST use color semantics consistently: green = improvement (more time, more sessions, lower deviation, better rhythm, improving trend), amber = stagnant or worsening trend.
- **FR-014**: The problem tone recommendation MUST reference the highest-deviation note by name and suggest a specific exercise type (e.g., Drone-Übung).
- **FR-015**: The milestone display MUST NOT use trophy icons, badge imagery, point values, or level language; presentation is a minimal timeline as specified in product spec section 4c.

### Data Sources

The Progress view aggregates data from multiple record types:

| Source Record | Source Spec | Feeds Into |
|---|---|---|
| CompletedSession (from Practice Session) | Spec 006 | Headline stats, journal, heatmap, pitch/rhythm charts |
| ToneLabSession (from Tone Lab) | Spec 009 | Pitch chart, problem tones, heatmap (practice time), headline stats |
| PatternAttempt (from Rhythm Studio) | Spec 010 | Rhythm chart, headline stats |
| SubdivisionAttempt (from Rhythm Studio) | Spec 010 | Rhythm chart |
| ToneAttempt (from Long Tones) | Spec 007 | Problem tones (per-note deviation data) |
| ScaleNoteResult (from Scale Exercise) | Spec 008 | Problem tones (per-note deviation data) |

All source records are stored in the local SQLite database. The Progress view reads and aggregates them at display time — no separate aggregation table is maintained.

### Key Entities

- **ProgressSnapshot**: Aggregated stats for a given period. Attributes: `period_start` (date), `period_end` (date), `total_practice_minutes` (int), `session_count` (int), `avg_pitch_deviation` (f32, absolute cents), `streak_current` (int, days), `streak_record` (int, days), `pitch_trend_pct` (f32, relative change vs previous period), `rhythm_trend_pct` (f32).

- **ProblemNote**: A note that has been consistently played out of tune. Attributes: `note_name` (string, e.g., "F"), `octave` (int), `avg_cent_deviation` (f32, signed), `trend_direction` (enum: improving | stagnant | worsening), `weeks_present` (int, consecutive weeks in the list), `sample_count` (int), `first_seen` (date), `recommendation` (string, generated).

- **Milestone**: A recorded achievement event. Attributes: `id` (uuid), `type` (enum — see categories below), `title` (string), `description` (string), `achieved_at` (datetime), `session_id` (uuid, nullable). Milestone types: `pitch_first_tone`, `pitch_10_in_a_row`, `pitch_problem_tone_under_5ct`, `pitch_session_avg_under_5ct`, `pitch_full_scale_under_5ct`, `stability_8s_hold`, `stability_session_no_outlier`, `rhythm_first_pattern_90pct`, `rhythm_all_rounds_85pct`, `rhythm_eighth_pattern`, `rhythm_triplet_exercise`, `streak_3`, `streak_7`, `streak_14`, `streak_30`, `sessions_10`, `sessions_25`, `sessions_50`.

- **SessionLogEntry**: A record of a completed practice session. Attributes: `id` (uuid), `date` (date), `duration_min` (int), `exercises` (string[], names), `pitch_accuracy_pct` (f32, nullable), `rhythm_accuracy_pct` (f32, nullable), `avg_deviation_ct` (f32, nullable).

- **HeatmapDay**: A single day's practice indicator for the calendar heatmap. Attributes: `date` (date), `practiced` (bool), `minutes` (int). Intensity tiers: 0 min = empty, 1–14 min = low, 15–29 min = mid, 30+ min = high.

- **WeeklyPitchPoint**: One data point on the Pitch Development chart. Attributes: `week_start` (date), `avg_cent_deviation` (f32), `session_count` (int).

- **WeeklyRhythmPoint**: One data point on the Rhythm Development chart. Attributes: `week_start` (date), `avg_timing_accuracy_pct` (f32), `session_count` (int).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Progress view opens and renders all P0 sections (headline stats, pitch chart, problem tones) within 300ms of navigation on a machine with 1,000 stored sessions.
- **SC-002**: Switching the time period selector updates both charts within 200ms without a full page re-render.
- **SC-003**: A player with 30 days of practice data can identify their top problem tone and the associated recommendation without reading any documentation.
- **SC-004**: All P0 acceptance scenarios pass with a seeded test database containing at least 30 sessions across 6 weeks.
- **SC-005**: The view renders without error or visual overflow on viewports from 768px to 1920px wide (responsive layout as per product spec section 4b).
- **SC-006**: Milestone detection produces zero false positives and zero missed detections across all 17 milestone types when run against the reference test dataset.
- **SC-007**: The Progress view renders a coherent empty state (no crash, no broken charts, legible empty-state copy) when the database contains zero sessions.
- **SC-008**: No network requests are made when the Progress view is open; all data is served from local SQLite (verifiable by disabling the network in dev tools and observing no error).
