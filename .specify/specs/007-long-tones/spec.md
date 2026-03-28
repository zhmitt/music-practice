# Feature Specification: Long Tones Exercise

**Feature Branch**: `007-long-tones`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Long Tones Exercise — first and most fundamental warm-up exercise"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Pitch Feedback During a Long Tone (Priority: P0)

The player starts a Long Tones exercise, blows a note, and immediately sees the vertical pitch meter respond. A dot moves up and down on a vertical bar (+50ct top, -50ct bottom, center = perfect). The current cent deviation is displayed as a number with color coding (green = within tolerance, amber = slightly off, red = far off). The note name and Hz value are shown prominently. This is the core feedback loop the entire exercise depends on.

**Why this priority**: Without real-time pitch feedback, the exercise has no purpose. Every other story in this feature builds on top of this foundation. This is also the "aha moment" from the onboarding — the player blows and instantly sees the app respond.

**Independent Test**: Can be fully tested by starting a Long Tones exercise with a microphone connected, playing any note, and verifying the pitch meter animates and shows accurate cent deviation. Delivers immediate value as a standalone tuner-like experience.

**Acceptance Scenarios**:

1. **Given** a Long Tones exercise is active and the microphone is listening, **When** the player plays a Bb4 within 20ct of center, **Then** the vertical meter dot appears near center, the note name "Bb" is displayed, the Hz value is shown (e.g. "466.2 Hz"), and the cent label shows the deviation (e.g. "+3ct") in green.
2. **Given** the player is playing a note, **When** their pitch drifts more than 15ct sharp, **Then** the dot moves toward the top of the meter and the cent label turns amber; beyond 25ct it turns red.
3. **Given** no pitch is detected (player not playing or below amplitude threshold), **Then** the pitch meter dot is hidden or shown in a neutral/inactive state and no cent value is displayed.
4. **Given** the player plays a note that is more than a semitone away from the target, **Then** the meter shows maximum deviation and the display reflects the actual detected pitch without crashing or freezing.

---

### User Story 2 - Stability Graph Shows Pitch Steadiness Over Time (Priority: P0)

While holding a note, a live SVG graph scrolls in real time showing the pitch deviation over the last few seconds. The graph gives the player a visual record of how steady their tone has been — a flat horizontal line near center means excellent stability, wavy lines mean the pitch is wandering. This lets the player develop awareness of breath support and embouchure control.

**Why this priority**: The stability graph is what differentiates this feature from a plain tuner. Without it, the player cannot see trends within a single held note — only the instantaneous position. Stability tracking is the core pedagogical value of the long tone exercise.

**Independent Test**: Can be fully tested by playing a sustained note and observing the graph update in real time. The graph should clearly distinguish a stable tone (flat line) from an unstable one (wavy line). Delivers value independently as a practice feedback tool.

**Acceptance Scenarios**:

1. **Given** the player holds a note for 3+ seconds, **When** their pitch is steady (within ±3ct), **Then** the stability graph shows a mostly flat line near the center axis.
2. **Given** the player's pitch wavers significantly (±15ct swings), **Then** the stability graph shows a visibly wavy line, giving clear visual feedback that the tone is unstable.
3. **Given** the player is playing, **When** new pitch data arrives (≤50ms intervals), **Then** the graph updates with a smooth leftward scroll, showing the most recent few seconds of data.
4. **Given** the player stops playing mid-hold and restarts, **Then** the graph either shows a gap/break in the line or resets to a clean state, without carrying over stale data.

---

### User Story 3 - Automatic Advance to Next Tone When Held Stably (Priority: P0)

When the player holds the target note within pitch tolerance for the required duration, the exercise automatically advances to the next tone in the sequence. The player does not need to press any button — the app recognizes successful completion and moves forward. A brief visual confirmation is shown before the next target note appears.

**Why this priority**: Automatic advance is central to the exercise flow. Manual advancement would require the player to take the instrument away from their face, breaking concentration and practice rhythm. This is the core interaction loop: play → hold → advance → breathe → next note.

**Independent Test**: Can be fully tested by playing through a 2-3 tone sequence and verifying that correct, stable tones trigger advancement without any button press. Incorrect or unstable tones must not advance.

**Acceptance Scenarios**:

1. **Given** the target note is C4 and tolerance is ±5ct, **When** the player holds C4 within ±5ct for at least 80% of an 8-second window, **Then** the exercise automatically advances to the next tone in the sequence after the timer reaches 8s.
2. **Given** the player holds the correct pitch but with high instability (std deviation > threshold), **Then** the timer does not complete and advancement does not trigger, even if 8 seconds have elapsed.
3. **Given** the player plays a wrong note (more than a semitone from target), **Then** the timer does not accumulate stable time and advancement is not triggered.
4. **Given** the player reaches the last tone in the sequence and holds it successfully, **Then** the exercise completes and a summary screen or completion state is shown.
5. **Given** the player stops playing mid-hold and the amplitude drops below the detection threshold, **Then** the stable-hold timer pauses and resumes only when pitch detection resumes within tolerance.

---

### User Story 4 - Tone Sequence Display With Progress Indicators (Priority: P1)

The full sequence of tones for the exercise is shown at the bottom of the screen (e.g. Bb4, F4, C4, G3, Eb3). Each tone displays its completion state: a checkmark for tones already passed, a filled dot for the current tone, and empty circles for upcoming tones. The player can see at a glance where they are in the sequence and how much remains.

**Why this priority**: Context awareness reduces anxiety and helps the player plan their breathing. A beginning player needs to know "three more tones to go" to pace themselves. This is important but not blocking — the core feedback (stories 1-3) works without it.

**Independent Test**: Can be fully tested by navigating through a tone sequence and checking that the visual state of each indicator updates correctly as tones are completed.

**Acceptance Scenarios**:

1. **Given** a 5-tone sequence where 2 have been completed and the 3rd is active, **When** the sequence bar is displayed, **Then** tones 1 and 2 show checkmarks, tone 3 shows a filled dot, and tones 4 and 5 show empty circles.
2. **Given** the exercise advances from one tone to the next, **When** the transition occurs, **Then** the previously active dot becomes a checkmark and the next tone's circle becomes a filled dot within 200ms.
3. **Given** a tone sequence with note names (e.g. "Bb4"), **Then** each indicator in the sequence bar displays the note name in a readable size.

---

### User Story 5 - "Anhoren" Button Plays Synthesized Reference Tone (Priority: P1)

A button labeled "Anhoren" (German: "Listen") is visible near the target note display. When pressed, the app plays a synthesized warm brass tone at the target pitch — Grundton plus 2-3 harmonics — so the player can hear what they are aiming for before playing. On the very first tone of an exercise, the reference plays automatically. After that, the player decides when to use it.

**Why this priority**: Hearing the target note before playing it is essential for ear training and helps beginners find the pitch mentally before embouchure engagement. It is not required for the pitch feedback loop (stories 1-3) but significantly improves the educational value.

**Independent Test**: Can be fully tested by pressing the button and verifying a warm, pitched tone sounds at the correct frequency, distinct from a sine wave. Automatic playback on first tone can be tested by starting a fresh exercise.

**Acceptance Scenarios**:

1. **Given** a Long Tones exercise has just started with the first target note, **Then** the reference tone plays automatically once at the correct pitch without the player pressing anything.
2. **Given** the player is on any tone in the sequence, **When** they press the "Anhoren" button, **Then** a synthesized warm brass tone at the target pitch plays for approximately 2 seconds and then stops.
3. **Given** the reference tone is playing, **When** the player begins blowing their instrument, **Then** the reference tone fades out or stops to avoid interference with pitch detection.
4. **Given** the synthesized tone, **Then** it must use Grundton plus 2-3 harmonic partials and must NOT be a plain sine wave or organ-like sound.

---

### User Story 6 - Configurable Hold Duration and Tolerance (Priority: P1)

The exercise settings allow the target hold duration (default: 8 seconds) and pitch tolerance (default: ±5ct) to be adjusted. A beginner might use 5 seconds and ±10ct; an advanced player might use 12 seconds and ±3ct. These settings persist across sessions and can be changed from the exercise configuration screen or the global settings.

**Why this priority**: Fixed defaults serve a median user but the target personas range from a 10-year-old beginner (Leo) to an analytically-minded returner (Thomas). Without configurability, the exercise is either too hard for beginners or insufficiently challenging for advanced players.

**Independent Test**: Can be fully tested by changing hold duration to 5s and tolerance to ±10ct, playing a note, and verifying that advancement triggers after 5 seconds rather than 8, and that a ±8ct deviation still counts as within tolerance.

**Acceptance Scenarios**:

1. **Given** the user has set hold duration to 5s and tolerance to ±10ct, **When** a note is held within ±10ct for 80% of 5 seconds, **Then** the exercise advances at 5 seconds, not 8.
2. **Given** the user changes tolerance from ±5ct to ±3ct, **When** the player holds a note at +4ct deviation, **Then** the cent label shows amber/red and stable-hold time does not accumulate.
3. **Given** the settings screen, **When** the user adjusts hold duration, **Then** the hold timer display on the exercise screen updates to reflect the new target (e.g. "0s / 5s" instead of "0s / 8s").
4. **Given** the user has configured custom settings and closes and reopens the app, **Then** the custom settings are preserved across sessions.

---

### User Story 7 - Per-Tone Results After Completing the Sequence (Priority: P2)

After the player completes all tones in the sequence (or exits the exercise), a results summary is shown. For each tone, the summary displays: average cent deviation, stability score (standard deviation of pitch), and held duration. This data is also persisted as a `ToneAttempt` record so it can feed into the progress tracking feature (011).

**Why this priority**: Per-tone results provide post-session reflection and feed the long-term progress view. Valuable, but the in-session experience (P0/P1 stories) is more important to get right first. This story also has a dependency on spec 011 (Progress Tracking) for persistence.

**Independent Test**: Can be fully tested by completing a full sequence and checking that a summary is displayed with one row per tone, each showing a numeric deviation value and stability rating.

**Acceptance Scenarios**:

1. **Given** the player completes a 4-tone sequence, **When** the results screen is shown, **Then** each of the 4 tones is listed with its average cent deviation, stability score, and held duration.
2. **Given** a tone where the player never reached stability threshold, **Then** that tone's result shows "not passed" or an equivalent indicator rather than a passing score.
3. **Given** the results are generated, **When** they are persisted, **Then** a `ToneAttempt` record is stored with: target_note, actual_pitches array, avg_deviation_ct, stability_std, held_duration_ms, and passed (boolean).

---

### Edge Cases

- **Player plays wrong note entirely**: The pitch meter reflects the actual detected pitch (not the target), the deviation display shows the discrepancy, but the stable-hold timer does not accumulate. No crash or lock-up. The player can correct their note and the session resumes normally.
- **Player stops mid-hold and restarts**: The stable-hold timer pauses when amplitude drops below the detection threshold. When the player re-enters the target pitch range, the timer resumes from where it was (not reset). If the gap exceeds a configurable "reset threshold" (e.g. 2 seconds silence), the timer resets to zero.
- **Very unstable playing (never reaches stability threshold)**: The exercise does not advance automatically. The hold timer may reach 8 seconds but if the 80% in-tolerance criterion is not met, advancement is blocked. A "Skip" control remains available so the player is never permanently stuck.
- **Player plays too quietly to detect**: If the audio amplitude is below the detection floor, the pitch meter shows an inactive state and no timer accumulates. A subtle visual hint (e.g. "Louder" or a microphone icon) may be shown to guide the player.
- **First use / no microphone permission**: If microphone permission is not granted, the exercise cannot function. The app must surface a clear error state directing the user to grant permission, not a blank screen.
- **Extremely long hold (player ignores timer)**: If the player holds a tone far beyond the target duration without receiving automatic advance (e.g. due to instability), the UI must remain responsive. No memory leaks or runaway state accumulation from an unbounded pitch data buffer.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST detect the fundamental pitch of a sustained monophonic note from microphone audio in real time with a latency of ≤ 50ms from sound to UI update.
- **FR-002**: The system MUST display the target note name (e.g. "Bb"), octave (e.g. "4"), and frequency in Hz on the exercise screen at all times.
- **FR-003**: The system MUST display a vertical pitch meter showing the current cent deviation of the detected pitch relative to the target note, with the center line representing 0ct, the top representing +50ct, and the bottom representing -50ct.
- **FR-004**: The system MUST color-code the cent deviation display: green when within the configured tolerance, amber when 1.5× tolerance, and red beyond that.
- **FR-005**: The system MUST render a live scrolling stability graph (SVG or canvas) showing pitch deviation over the last configurable window (default: 5 seconds).
- **FR-006**: The system MUST accumulate a "stable hold" timer that counts only time spent within the configured pitch tolerance. The timer display MUST show current stable seconds and target seconds (e.g. "6s / 8s").
- **FR-007**: The system MUST automatically advance to the next tone in the sequence when the stable hold timer reaches the target duration AND the in-tolerance percentage over that window is ≥ 80% AND the pitch standard deviation is below the configured stability threshold.
- **FR-008**: The system MUST display the full tone sequence at the bottom of the exercise screen with per-tone status indicators: passed (checkmark), current (filled dot), upcoming (empty circle).
- **FR-009**: The system MUST play the first target note's reference audio automatically when the exercise starts.
- **FR-010**: The system MUST provide an "Anhoren" button that plays a synthesized warm brass reference tone (Grundton + 2-3 harmonic partials) at the target pitch when pressed.
- **FR-011**: The system MUST support at minimum the following predefined tone sequences: Bb Horn Anfanger (Bb4, F4, C4, G3) and Bb Horn Fortgeschritten (Bb4, F4, C4, G3, Eb3, Bb3).
- **FR-012**: The system MUST persist a `ToneAttempt` record for each tone after the exercise completes, containing: target note, sampled pitch array, average deviation in cents, stability standard deviation, held duration in ms, and pass/fail result.
- **FR-013**: The system MUST allow the user to configure: target hold duration (range: 3–30 seconds), pitch tolerance (range: ±1ct – ±20ct), and stability threshold (standard deviation ceiling). These settings MUST persist across app sessions.
- **FR-014**: The system MUST provide a "Skip" control that allows the player to advance to the next tone at any time without meeting the automatic advance criteria.
- **FR-015**: The system MUST pause the stable-hold timer when detected audio amplitude falls below the silence threshold, and resume it when pitch detection returns within tolerance.

### Key Entities

- **LongToneExercise**: Configuration for a single exercise run. Contains: `target_notes[]` (ordered array of target pitches), `hold_duration_sec` (target hold time per tone), `tolerance_ct` (cent tolerance for "in tune"), `stability_threshold_std` (max allowed standard deviation), `in_tolerance_percent_required` (default 0.80).
- **ToneAttempt**: A persisted record of one attempt at one tone. Contains: `target_note` (note name + octave), `actual_pitches[]` (time-stamped array of detected cents relative to target), `avg_deviation_ct` (mean of actual_pitches), `stability_std` (standard deviation of actual_pitches), `held_duration_ms` (total time pitch was within tolerance), `passed` (boolean — whether automatic advance criteria were met).
- **ToneSequence**: A named, reusable list of target notes tied to an instrument and skill level. Contains: `id`, `instrument` (e.g. "Bb Horn"), `level` (e.g. "Anfanger" | "Fortgeschritten"), `notes[]` (ordered array of note + octave strings), `display_name`.
- **ExerciseSettings**: User-configurable settings persisted across sessions. Contains: `hold_duration_sec`, `tolerance_ct`, `stability_threshold_std`, `reference_audio_enabled`, `reset_on_silence_after_ms`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pitch meter updates within 50ms of a pitch change — measurable by timing the UI update against a reference signal of known frequency change.
- **SC-002**: Automatic advance triggers correctly in ≥ 99% of cases when the player holds a tone within tolerance for the full target duration, as validated by automated tests using simulated pitch input streams.
- **SC-003**: Automatic advance is correctly blocked in ≥ 99% of cases when the player fails to meet the 80% in-tolerance criterion, as validated by automated tests using out-of-tolerance simulated input.
- **SC-004**: The stability graph renders at ≥ 30 fps during active pitch input without dropped frames on the target hardware (desktop and tablet form factors).
- **SC-005**: The synthesized reference tone is perceptibly warm (non-sine) and plays at the correct target pitch within ±1ct of the equal-tempered frequency, verifiable by running the generated audio through the pitch detector.
- **SC-006**: Per-tone attempt data is persisted to storage within 500ms of a tone completing, with no data loss on normal exercise exit.
- **SC-007**: All configurable settings (hold duration, tolerance, stability threshold) round-trip correctly through save and reload with no data corruption.
- **SC-008**: On first use with microphone permission denied, the exercise screen shows a human-readable error state rather than a blank or crashed UI — verifiable by a manual test with permission revoked.
