# Feature Specification: Onboarding Flow

**Feature Branch**: `004-onboarding`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "5-screen flow on first app launch. Sets up instrument profile, practice goals, and verifies microphone."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Complete Onboarding and Create Instrument Profile (Priority: P0)

A new user opens ToneTrainer for the first time. They are greeted by a full-screen welcome screen, then guided through selecting their instrument, experience level, and practice goals. At the end, their profile is persisted and they arrive at the Dashboard ready to practice. This is the critical first-run path that every new user will take.

**Why this priority**: Without a completed profile, the app cannot generate a tailored practice session. This is the gate to the core product value. All other features depend on a UserProfile existing.

**Independent Test**: Can be tested by launching a fresh app instance (cleared local SQLite database), completing all 5 screens, and verifying: (a) the Dashboard is shown after finishing, (b) the instrument chip in the header displays the selected instrument, (c) the local SQLite database contains a persisted UserProfile with the chosen values.

**Acceptance Scenarios**:

1. **Given** the app is launched for the first time (no `onboarding_completed` flag in local storage), **When** the app initializes, **Then** the onboarding overlay is shown fullscreen before any other UI is visible.
2. **Given** the user is on the Welcome screen, **When** they tap "Los geht's", **Then** they advance to Screen 2 (Instrument Selection).
3. **Given** the user is on Screen 2, **When** they tap an instrument card, **Then** the card renders with an accent border and accent background to indicate selection, and all other cards are deselected.
4. **Given** an instrument is selected, **When** the user taps "Weiter", **Then** they advance to Screen 3 (Experience Level).
5. **Given** the user is on Screen 3, **When** they tap an experience option, **Then** the radio control shows filled and the option card is highlighted in accent color.
6. **Given** an experience level is selected, **When** the user taps "Weiter", **Then** they advance to Screen 4 (Practice Goals).
7. **Given** the user is on Screen 4 and selects days per week and minutes per session, **When** they tap "Weiter", **Then** they advance to Screen 5 (Microphone + First Tone).
8. **Given** the user completes Screen 5, **When** they tap "Erste Session starten", **Then** the onboarding overlay closes, the `onboarding_completed` flag is written to the local SQLite database (via Tauri plugin), the UserProfile is persisted, and the Dashboard is displayed.
9. **Given** a UserProfile has been created, **When** the Dashboard renders, **Then** the instrument chip in the header shows the selected instrument name.

---

### User Story 2 — Microphone Permission and First Tone Detection (Priority: P0)

On Screen 5, the app requests microphone permission from the operating system and then listens for the user to play any note. When a note is detected, the UI shows real-time pitch feedback: the note name, frequency in Hz, a vertical pitch meter (green dot on a gradient track), and cents deviation. When the signal is stable and in range, a success banner appears and the CTA button becomes active. This is the "aha moment" — the user's first proof that the app is listening.

**Why this priority**: Pitch detection is the core technology of the entire product. If this moment fails or feels broken, the user will not trust the app. It must feel immediate and magical.

**Independent Test**: Can be tested by opening Screen 5 in isolation, granting mic permission, playing a single note, and verifying: (a) the note name and Hz display update within 50ms, (b) the vertical pitch dot moves in real time, (c) the cents value updates continuously, (d) the success banner "Alles funktioniert!" appears after a stable tone is detected, (e) the "Erste Session starten" button is only enabled after success.

**Acceptance Scenarios**:

1. **Given** the user arrives on Screen 5, **When** the screen loads, **Then** a "Mikrofon erlauben" button is shown and pitch detection is not yet active.
2. **Given** the user taps "Mikrofon erlauben", **When** the OS permission dialog resolves with "granted", **Then** the mic button disappears, the tone detection UI becomes visible, and audio analysis begins.
3. **Given** the OS permission dialog resolves with "denied", **When** the user sees Screen 5, **Then** a clear error message is shown explaining that microphone access is required, with a link or button to open system settings.
4. **Given** audio input is active, **When** the user plays any note, **Then** the note name (e.g. "G4"), frequency in Hz, and cents deviation update in real time (target: < 50ms latency).
5. **Given** audio input is active, **When** the user plays a note, **Then** the vertical pitch dot on the gradient meter moves to the position corresponding to the cents deviation (center = in tune, top = sharp, bottom = flat).
6. **Given** a stable tone is detected (pitch held within ±20 cents for at least 1 second), **When** the threshold is crossed, **Then** the success banner "Alles funktioniert!" appears with a green checkmark.
7. **Given** the success banner is visible, **When** the user taps "Erste Session starten", **Then** the onboarding completes and the Dashboard is shown.
8. **Given** no sound is detected for 10 seconds after mic is granted, **When** the user is still on Screen 5, **Then** a subtle instructional prompt remains visible ("Spiel einen beliebigen Ton") without showing an error state.

---

### User Story 3 — Navigate Back to Previous Screens (Priority: P1)

After advancing past the Welcome screen, the user can navigate backwards through the onboarding steps. This allows them to correct a selection (e.g. chose the wrong instrument) without restarting. The step dot indicator at the bottom always reflects the current screen. Back navigation is not available on Screen 1 (Welcome).

**Why this priority**: Users make mistakes. Without back navigation, a wrong selection would either require completing onboarding incorrectly or finding a hidden reset. The cost of implementing back navigation is low and the friction it removes is real.

**Independent Test**: Can be tested by navigating to Screen 3 and tapping the back button, verifying the user lands on Screen 2 with their previous instrument selection intact. Verify the step dots update correctly on each back navigation.

**Acceptance Scenarios**:

1. **Given** the user is on Screen 2, 3, 4, or 5, **When** they tap the back button (top-left chevron), **Then** they return to the previous screen and their prior selection on that screen is preserved.
2. **Given** the user is on Screen 1 (Welcome), **When** the screen renders, **Then** no back button is visible.
3. **Given** the user navigates back from Screen 3 to Screen 2, changes their instrument, and then navigates forward again, **When** they reach Screen 4, **Then** the newly selected instrument is the one recorded in the in-progress profile state.
4. **Given** the user is on any screen, **When** looking at the step dots at the bottom, **Then** the active dot corresponds to the current screen number (dot for step N is pill-shaped and accent-colored; all others are small circles in muted border color).

---

### User Story 4 — Skip Onboarding for Returning Users Who Reset Data (Priority: P1)

A user who has previously completed onboarding but resets their data (via Settings > "Daten zurücksetzen") will be shown the onboarding flow again on next app launch. A user who has already completed onboarding and has not reset data will never see the onboarding overlay again. Additionally, a developer or power user can manually trigger the onboarding overlay from the header button labeled "Onboarding zeigen" (visible in the mockup's debug header area).

**Why this priority**: The `onboarding_completed` flag guards the first-run experience. If data is reset, the flag must be cleared so the full setup can be repeated with a fresh profile. Without this, a user who resets data would face an empty profile with no way to reconfigure.

**Independent Test**: Can be tested by: (a) completing onboarding normally — close and reopen the app — verify onboarding does NOT appear; (b) trigger data reset in Settings — reopen the app — verify onboarding DOES appear.

**Acceptance Scenarios**:

1. **Given** the user has previously completed onboarding (`onboarding_completed = true` in local storage), **When** the app launches, **Then** the onboarding overlay is not shown and the Dashboard is displayed directly.
2. **Given** the user triggers "Daten zurücksetzen" in Settings and confirms the action, **When** the local SQLite database is cleared, **Then** the `onboarding_completed` flag is also cleared.
3. **Given** the local SQLite database has been cleared, **When** the app is next launched, **Then** the onboarding overlay is displayed from Screen 1.

---

### User Story 5 — Change Instrument Mid-Onboarding (Priority: P2)

The instrument grid on Screen 2 allows re-selection at any time while the user remains on that screen. Tapping a different instrument card deselects the previous one and selects the new one. No confirmation is required. This behavior is identical to a standard single-select group.

**Why this priority**: This is inherent behavior of a single-select card grid and requires no special logic beyond standard exclusivity. It is listed explicitly to document expected behavior.

**Independent Test**: Can be tested by selecting "Waldhorn in Bb" then tapping "Trompete in Bb" and verifying only the Trompete card has the selected state applied.

**Acceptance Scenarios**:

1. **Given** the user has selected "Waldhorn in Bb" on Screen 2, **When** they tap "Trompete in Bb", **Then** the Waldhorn card loses its selected state and the Trompete card gains it.
2. **Given** no instrument is selected, **When** the user taps "Weiter", **Then** the button is disabled or shows an inline validation message — the user cannot advance without a selection.

---

### Edge Cases

- What happens when the app is closed during onboarding before completion? The in-progress state is not persisted between sessions. On next launch, onboarding restarts from Screen 1.
- What happens when microphone permission is revoked by the OS after being granted mid-onboarding? The audio stream stops; Screen 5 should display the permission error state and allow the user to try again or open system settings.
- What happens when the device has no microphone (unlikely for target platform, but possible in emulator/test)? The mic request fails; the app should show a clear error on Screen 5 explaining no audio device was found.
- What happens when the user taps "Weiter" very rapidly on Screen 4 without selecting any pills? Both selectors (days and minutes) must have a default pre-selected value so the user can always proceed; no selection should not be a valid state.
- What happens on very small viewport heights (e.g. < 600px)? The onboarding container must be scrollable within the overlay so no content is clipped.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the onboarding overlay fullscreen on first app launch when no `onboarding_completed` flag is present in the local SQLite database.
- **FR-002**: System MUST NOT display the onboarding overlay on subsequent launches when `onboarding_completed` flag is `true` in the local SQLite database.
- **FR-003**: System MUST display exactly 5 screens in sequence: Welcome, Instrument Selection, Experience Level, Practice Goals, Microphone + First Tone.
- **FR-004**: System MUST show step indicator dots at the bottom of the overlay, with the active step rendered as a pill (wider, accent color) and inactive steps as small circles (muted border color).
- **FR-005**: System MUST allow backward navigation from Screens 2–5 using a back button; Screen 1 MUST NOT show a back button.
- **FR-006**: System MUST preserve in-progress selections when the user navigates back and then forward again within the same onboarding session.
- **FR-007**: System MUST display 8 instrument options in a 2-column grid on Screen 2: Waldhorn in Bb (default pre-selected), Waldhorn in F, Doppelhorn F/Bb, Trompete in Bb, Klarinette in Bb, Flöte, Posaune, Oboe.
- **FR-008**: System MUST enforce single selection on the instrument grid; selecting one card deselects all others.
- **FR-009**: System MUST display 4 experience level options as full-width card-style radio buttons on Screen 3: Gerade angefangen (< 6 Monate), Anfänger (6 Monate – 2 Jahre), Fortgeschritten (2 – 5 Jahre), Erfahren (5+ Jahre).
- **FR-010**: System MUST display two pill selector groups on Screen 4: days per week (options: 3, 4, 5, 6, 7) and minutes per session (options: 10, 15, 20, 30). Both MUST have a default value pre-selected so the user can always advance without making an explicit choice.
- **FR-011**: System MUST show the note "Du kannst das jederzeit ändern." on Screen 4.
- **FR-012**: System MUST request microphone permission on Screen 5 only when the user explicitly taps the mic permission button (not automatically on screen load).
- **FR-013**: System MUST begin real-time pitch detection immediately after microphone permission is granted.
- **FR-014**: System MUST display the following in real time during pitch detection on Screen 5: detected note name with octave (e.g. "G4"), frequency in Hz, vertical pitch meter (gradient track + dot at cents position), cents deviation value.
- **FR-015**: System MUST display a success state ("Alles funktioniert!") and enable the "Erste Session starten" CTA after a stable tone is detected (held within ±20 cents for at least 1 second).
- **FR-016**: System MUST enable the "Erste Session starten" button only after the success state has been reached.
- **FR-017**: System MUST persist the completed UserProfile to the local SQLite database (via Tauri plugin) when the user taps "Erste Session starten".
- **FR-018**: System MUST write `onboarding_completed = true` to the local SQLite database (via Tauri plugin) when the user taps "Erste Session starten".
- **FR-019**: System MUST display a microphone permission denied error state when the OS denies the mic request, with guidance on how to re-enable it in system settings.
- **FR-020**: System MUST constrain onboarding content to a maximum width of 480px, centered horizontally, to preserve readability on wide screens.
- **FR-021**: System MUST render correctly in both dark and light themes using the established CSS token system.
- **FR-022**: System MUST externalize all user-visible strings (labels, headings, CTAs, hint text) through the i18n layer — no hardcoded strings in component logic. Both German (default) and English translations MUST be provided.
- **FR-023**: System MUST clear the `onboarding_completed` flag when the user triggers "Daten zurücksetzen" in Settings.
- **FR-024**: System MUST be scrollable within the overlay on viewports shorter than the content height, to prevent clipping on small screens.

### Key Entities

- **UserProfile**: Represents the configured instrument profile for the user. Key attributes: `instrument` (enum of 8 supported instruments), `experience_level` (enum: beginner_new | beginner | intermediate | experienced), `practice_days_per_week` (integer: 3–7), `session_duration_minutes` (integer: 10 | 15 | 20 | 30), `tuning_reference_hz` (float, default 442 — set post-onboarding in Settings), `display_transposition` (enum: notated | concert, default notated — set post-onboarding in Settings). Created at the end of onboarding; editable at any time via Settings.
- **OnboardingState**: Represents the lifecycle of the onboarding flow. Key attributes: `completed` (boolean, persisted in local SQLite database), `current_step` (integer 1–5, transient — not persisted between app launches). When `completed` is false or absent, onboarding is shown on launch. When `completed` is true, onboarding is skipped.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete all 5 onboarding screens and arrive at the Dashboard in under 90 seconds (excluding time spent actually playing a note on Screen 5).
- **SC-002**: Pitch detection on Screen 5 displays a note name and Hz value within 50ms of sound onset, as measured by the difference between audio input timestamp and UI update timestamp.
- **SC-003**: The onboarding overlay renders without layout clipping or overflow at viewport heights of 600px and above, and scrolls gracefully below 600px.
- **SC-004**: All 5 screens render correctly in both dark and light themes with no hardcoded color values — all colors reference the CSS token system.
- **SC-005**: All user-visible strings on all 5 screens render from the i18n translation layer, with verified German and English translations for every key.
- **SC-006**: After completing onboarding, the UserProfile values stored in the local SQLite database exactly match the selections made by the user during the flow (verified by reading the database after completing the flow in a test).
- **SC-007**: After completing onboarding and relaunching the app, the onboarding overlay does not appear (verified by checking for `onboarding_completed` flag and absence of overlay in DOM).
- **SC-008**: Back navigation preserves prior selections: navigating back from Screen 3 to Screen 2 and forward again without changing anything results in the same instrument value being stored as before the round-trip.
