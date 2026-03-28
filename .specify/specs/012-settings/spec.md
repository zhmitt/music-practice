# Feature Specification: Settings Panel

**Feature Branch**: `012-settings`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Slide-in settings panel from right side, accessible via gear icon. All app configuration in one place."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Change Instrument and Tuning Reference (Priority: P0)

A musician switches from Waldhorn in Bb to Doppelhorn F/Bb and adjusts the tuning reference to 440 Hz before starting a practice session. The instrument chip in the header immediately reflects the new selection, and the session's exercise suggestions and transposition display update accordingly.

**Why this priority**: The instrument and tuning reference are the foundational inputs for every audio analysis calculation in the app. If these are wrong, all pitch feedback is incorrect. Changing them must be possible instantly, without navigating away from the dashboard.

**Independent Test**: Open settings, change instrument to any other value, verify header chip updates and tuning stepper functions between 430 and 450 Hz.

**Acceptance Scenarios**:

1. **Given** settings panel is open and Waldhorn in Bb is selected, **When** user selects Doppelhorn F/Bb from the instrument dropdown, **Then** the instrument chip in the app header updates immediately and the display transposition toggle reflects the new instrument's transposition interval.

2. **Given** tuning is at 442 Hz, **When** user presses the minus stepper button six times, **Then** tuning reads 436 Hz and does not decrement below 430 Hz.

3. **Given** tuning is at 442 Hz, **When** user presses the plus stepper button eight times, **Then** tuning reads 450 Hz and does not increment above 450 Hz.

4. **Given** display is set to "Notiert (transponiert)", **When** user toggles to "Klingend (Konzerttonhöhe)", **Then** all note names in active exercises immediately render at concert pitch without requiring a restart.

---

### User Story 2 - Theme Selection with Immediate Effect (Priority: P0)

A user practicing in a dim room switches from Auto to Dark theme and immediately sees the interface transition without any page reload or flash of incorrect content.

**Why this priority**: Theme consistency is a prerequisite for comfortable use. Auto mode ensures the app integrates with OS-level accessibility settings, while explicit Dark/Light control is a common user expectation. Applying the theme in real time with a CSS transition is a core quality-of-experience requirement.

**Independent Test**: Open settings, cycle through Auto, Dark, and Light theme options, verify each transitions smoothly and that the `data-theme` attribute on the root element updates correctly.

**Acceptance Scenarios**:

1. **Given** theme is Auto and OS is in light mode, **When** user selects Dark, **Then** the interface transitions to dark theme within 300 ms and the selection persists after closing and reopening the panel.

2. **Given** theme is Dark, **When** user selects Auto, **Then** the interface adopts the OS preference immediately and updates if the OS theme changes while the app is open.

3. **Given** theme is Light, **When** user selects Dark, **Then** the transition uses the CSS `transition: background 0.3s, color 0.3s` pattern already defined in the design system tokens.

---

### User Story 3 - Microphone Selection and Inline Test (Priority: P1)

A user has multiple audio interfaces connected and needs to confirm that the correct microphone is selected and working before starting a practice session. They open settings, pick their USB audio interface from the dropdown, press "Mikrofon testen", and see real-time pitch feedback inline without leaving the settings panel.

**Why this priority**: Microphone misconfiguration is the most common reason pitch detection fails silently. The inline test eliminates a full round-trip through onboarding to diagnose audio issues.

**Independent Test**: Open settings, select a microphone device, press "Mikrofon testen", play a note, verify the inline pitch display activates and shows real-time note name and cent deviation.

**Acceptance Scenarios**:

1. **Given** multiple audio input devices are available, **When** user opens the Mikrofon dropdown, **Then** all available input devices are listed by name with the system default labeled as such.

2. **Given** a microphone is selected, **When** user presses "Mikrofon testen", **Then** the button transforms into an inline pitch result view identical in structure to onboarding screen 5 (note name, vertical pitch meter, cent display).

3. **Given** the mic test is active, **When** user plays a note on their instrument, **Then** the detected note name, octave, and cent deviation from equal temperament at the configured tuning reference update in real time at the same refresh rate as the main practice views.

4. **Given** microphone permission has not been granted, **When** user presses "Mikrofon testen", **Then** the OS permission prompt appears and, if denied, an inline error message explains how to grant access in system preferences.

---

### User Story 4 - Metronome and Drone Audio Configuration (Priority: P1)

A user finds the default click sound too sharp on their Bluetooth speaker and prefers a Holzblock sound. They also reduce the metronome volume while keeping the drone volume high for intonation exercises.

**Why this priority**: Audio preferences are highly environment-dependent (room acoustics, speaker type, headphones vs. open air). Separate volume controls are necessary because the drone is a sustained reference pitch while the metronome is a transient click — they serve different attention demands during practice.

**Independent Test**: Open settings, change metronome sound to each of the four options, move both volume sliders, verify changes persist and that metronome and drone volume are fully independent.

**Acceptance Scenarios**:

1. **Given** settings panel is open, **When** user selects "Holzblock" from the Metronom-Sound options, **Then** the next metronome tick played during a practice session uses the Holzblock sound.

2. **Given** Metronom-Lautstärke slider is at 80%, **When** user drags it to 20%, **Then** metronome ticks play at 20% volume while the drone at its current Drone-Lautstärke setting is unaffected.

3. **Given** both sliders are adjusted, **When** user closes and reopens the settings panel, **Then** both slider positions reflect the saved values.

---

### User Story 5 - Practice Goal Adjustment (Priority: P1)

A user's schedule changes mid-week and they want to reduce their practice target from 5 days per week to 4 days, and shorten session duration from 20 to 15 minutes. The dashboard goal indicator updates immediately.

**Why this priority**: Practice goals directly drive the session scheduler and the progress dashboard's weekly goal meter. Goals must be adjustable at any time, not locked to onboarding values.

**Independent Test**: Open settings, change practice days to 3 and session duration to 10 min, verify the dashboard weekly goal calculation updates on the next render.

**Acceptance Scenarios**:

1. **Given** practice goal is set to 5 days, **When** user taps the "4" pill in Tage pro Woche, **Then** the pill activates (accent color), the previous selection deactivates, and the change persists.

2. **Given** session duration is set to 20 min, **When** user selects "15", **Then** the dashboard's session card updates to show 15 min as the scheduled duration.

3. **Given** any goal pill is selected, **When** user closes the settings panel and reopens it, **Then** the previously selected pills are still shown as active.

---

### User Story 6 - Display Preferences (Priority: P1)

A beginner user switches rhythm notation from Noten to Blöcke to reduce reading overhead, and increases pitch tolerance to ±10 ct while they are still developing their intonation.

**Why this priority**: These preferences directly affect how difficult exercises feel. Blocking out inappropriate difficulty penalties or visual complexity for beginners is important for retention.

**Independent Test**: Open settings, toggle rhythm notation to Blöcke, change pitch tolerance to ±10 ct, verify both changes reflect in the next exercise started.

**Acceptance Scenarios**:

1. **Given** rhythm notation is set to "Noten", **When** user selects "Blöcke", **Then** rhythm exercises render in block notation on next load.

2. **Given** pitch tolerance is ±5 ct, **When** user selects ±10 ct from the dropdown, **Then** the pitch feedback thresholds in all pitch-detection-based exercises update to treat deviations up to 10 cents as acceptable.

3. **Given** display preferences are saved, **When** app is restarted, **Then** both rhythm notation style and pitch tolerance settings are restored.

---

### User Story 7 - Language Switch (Priority: P1)

A user whose OS is in German but who prefers the app in English switches the language to English. All UI strings, section labels, and button text immediately render in English without a restart.

**Why this priority**: The app targets an international audience from launch. The language setting must not require a restart since the codebase is i18n-ready from the start.

**Independent Test**: Open settings, switch language from Deutsch to English, verify all visible settings labels and section headings update to English.

**Acceptance Scenarios**:

1. **Given** language is Deutsch, **When** user selects English from the Sprache dropdown, **Then** all UI strings in the settings panel and app shell update immediately.

2. **Given** language is English, **When** user closes settings and navigates to any view, **Then** all strings in that view are in English.

3. **Given** language is switched, **When** app is restarted, **Then** the selected language is preserved.

---

### User Story 8 - Settings Panel Open/Close Behavior (Priority: P1)

A user opens the settings panel, makes changes, and closes it by pressing Escape. The panel slides out smoothly and they are returned to exactly the view they were on.

**Why this priority**: The panel interaction pattern must be frictionless. No save button, no confirmation for normal changes, clean close behavior via both keyboard and pointer.

**Independent Test**: Open settings via gear icon, verify slide-in animation, close via X button, close via Escape key, close via backdrop click — all must dismiss the panel without data loss.

**Acceptance Scenarios**:

1. **Given** settings panel is closed, **When** user clicks the gear icon, **Then** the blurred backdrop fades in and the panel slides in from the right using a cubic-bezier ease-out transition (0.35 s).

2. **Given** settings panel is open, **When** user presses the Escape key, **Then** the panel slides out and the backdrop fades out.

3. **Given** settings panel is open, **When** user clicks the blurred backdrop outside the panel, **Then** the panel closes.

4. **Given** any setting was changed, **When** panel is closed by any method, **Then** no explicit save is required — changes are already persisted.

---

### User Story 9 - Data Reset with Confirmation (Priority: P2)

A user wants to reset all practice history and start fresh. They press "Daten zurücksetzen", see a confirmation dialog explaining that all data will be permanently deleted, and must actively confirm before anything is deleted.

**Why this priority**: This is a destructive, irreversible action. The confirmation dialog must be a hard gate — accidental taps must never trigger a reset.

**Independent Test**: Press "Daten zurücksetzen", verify confirmation dialog appears with cancel and confirm buttons, verify cancel does nothing, verify confirm executes the reset and closes settings.

**Acceptance Scenarios**:

1. **Given** settings panel is open, **When** user presses "Daten zurücksetzen", **Then** a modal confirmation dialog opens with a title, a description of what will be deleted, a "Abbrechen" button, and a red "Zurücksetzen" button.

2. **Given** confirmation dialog is open, **When** user presses "Abbrechen", **Then** dialog closes, no data is deleted, and settings panel remains open.

3. **Given** confirmation dialog is open, **When** user presses the red "Zurücksetzen" button, **Then** all user data (settings, history, streaks) is deleted, the app returns to the onboarding flow, and the confirmation dialog closes.

4. **Given** confirmation dialog is open, **When** user presses Escape, **Then** dialog closes without deleting any data.

---

### User Story 10 - Data Export Placeholder (Priority: P2)

A user sees a "Daten exportieren" button in settings and, when pressed, gets an inline explanation that export functionality is coming in a future version rather than a broken or hidden button.

**Why this priority**: Hiding future features creates surprise when they appear. A visible-but-explained placeholder sets expectation and signals roadmap intent without blocking current functionality.

**Independent Test**: Press "Daten exportieren", verify informational message appears (not an error), verify no data operation occurs.

**Acceptance Scenarios**:

1. **Given** settings panel is open, **When** user presses "Daten exportieren", **Then** an inline informational message appears below the button explaining the feature is planned for Phase 2.

2. **Given** the export explanation is shown, **When** user presses any other control or closes settings, **Then** the message dismisses without requiring explicit close.

---

### Edge Cases

- What happens when no microphone input devices are detected? The Mikrofon dropdown should show "Kein Mikrofon gefunden" as a disabled option and "Mikrofon testen" should be disabled.
- What happens when a previously selected audio device is disconnected? On next open of settings, the device list refreshes and the previously selected device is shown as "(nicht verbunden)" until re-selected.
- What happens when the tuning stepper is pressed while an exercise is active? The change takes effect immediately; the pitch engine receives the updated reference frequency within the current processing frame.
- What happens when instrument is changed while a practice session is in progress? The session should complete using the previous instrument's settings to avoid mid-session confusion; a banner informs the user the change takes effect at the next session start.
- What happens when only one language is available? The language dropdown is shown but disabled.
- What happens when the settings panel is opened on a screen narrower than 380 px? The panel spans the full viewport width instead of the fixed 380 px.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The settings panel MUST slide in from the right edge of the viewport as a fixed overlay, 380 px wide, covering the full viewport height.
- **FR-002**: The settings panel MUST be openable via the gear icon in the sidebar (bottom position) and closeable via the X button, the Escape key, or a click on the blurred backdrop.
- **FR-003**: All setting changes MUST auto-save immediately with no explicit "Save" button required.
- **FR-004**: The Instrument section MUST provide a dropdown for selecting one of eight instruments: Waldhorn in Bb, Waldhorn in F, Doppelhorn F/Bb, Trompete in Bb, Klarinette in Bb, Flöte, Posaune, Oboe.

  Note: In Phase 1, only Waldhorn in Bb and Waldhorn in F have dedicated InstrumentProfiles (spec 001). All other instruments use a generic profile with appropriate transposition offset but without instrument-specific partial weighting. The instrument selector shows all 8 options; instruments without dedicated profiles display a subtle "(Basis-Profil)" indicator.

- **FR-005**: The tuning reference MUST be adjustable via a +/- stepper between 430 Hz and 450 Hz inclusive, with a default of 442 Hz and a step size of 1 Hz.
- **FR-006**: The Anzeige toggle MUST offer exactly two states: "Notiert" (transposed, instrument default) and "Klingend" (concert pitch).
- **FR-007**: The Tage pro Woche pill selector MUST offer exactly: 3, 4, 5, 6, 7. Exactly one pill MUST be active at all times.
- **FR-008**: The Session-Dauer pill selector MUST offer exactly: 10, 15, 20, 30 (minutes). Exactly one pill MUST be active at all times.
- **FR-009**: The Mikrofon dropdown MUST enumerate all available audio input devices from the system audio API and allow selecting one as the active input.
- **FR-010**: The "Mikrofon testen" button MUST trigger inline real-time pitch detection display within the settings panel, reusing the pitch feedback component from onboarding screen 5.
- **FR-011**: The Metronom-Sound selector MUST offer: Klick, Holzblock, Rimshot, Leise.
- **FR-012**: Phase 1: Only "Bläser (synth.)" is available as drone sound. The selector is present but shows only this option. Additional options (Sinuston, Orgel, real samples) are planned for Phase 2. This aligns with the product spec decision: "Kein Sinuston (zu steril), keine Orgel (zu kirchlich)" for Phase 1.
- **FR-013**: Metronome volume and drone volume MUST be independently configurable via separate sliders.
- **FR-014**: The Rhythmus-Notation radio toggle MUST offer: Noten (default), Blöcke.
- **FR-015**: The Pitch-Toleranz dropdown MUST offer: ±3 ct, ±5 ct (default), ±10 ct.
- **FR-016**: The Theme segmented control MUST offer: Auto, Dark, Light. "Auto" MUST follow the OS `prefers-color-scheme` media query. Theme changes MUST apply immediately using CSS transitions.
- **FR-017**: The Sprache dropdown MUST offer: Deutsch (default), English. Language change MUST apply immediately without app restart.
- **FR-018**: A read-only version string MUST be displayed in the App section.
- **FR-019**: "Daten exportieren" MUST be present and MUST display an informational placeholder message on press, performing no data operation. It MUST NOT be hidden or removed.
- **FR-020**: "Daten zurücksetzen" MUST show a confirmation dialog before any data is deleted. The confirmation dialog MUST require active positive confirmation (a visually distinct destructive action button) and MUST offer a cancel path.
- **FR-021**: The settings panel MUST NOT include any account, login, push notification, or in-app purchase controls.
- **FR-022**: All user settings MUST be persisted to the local SQLite database (consistent with spec 003 FR-021) immediately on change and restored on app start.

### Key Entities

- **UserSettings**: Represents the full persisted configuration for a single user. Attributes: `instrument` (enum), `tuning_hz` (integer, 430–450), `display_transposition` (enum: notated | concert), `practice_days` (integer, 3–7), `session_duration_min` (integer: 10 | 15 | 20 | 30), `theme` (enum: auto | dark | light), `language` (enum: de | en), `metronome_sound` (enum: klick | holzblock | rimshot | leise), `metronome_volume` (float, 0.0–1.0), `drone_sound` (enum: bläser — Phase 1 only; sinuston | orgel reserved for Phase 2), `drone_volume` (float, 0.0–1.0), `rhythm_notation` (enum: noten | blöcke), `pitch_tolerance_ct` (integer: 3 | 5 | 10), `selected_mic_device_id` (string | null).

- **AudioDevice**: Represents a system audio input device discovered at runtime. Attributes: `id` (string, platform device identifier), `name` (string, human-readable label), `is_default` (boolean). Not persisted — enumerated fresh each time the settings panel opens.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can open the settings panel, change their instrument, and close the panel in under 10 seconds — panel open latency is under 50 ms from click to animation start.
- **SC-002**: Theme transition from any value to any other value completes within 350 ms including the CSS animation (no flash of unstyled content, no layout shift).
- **SC-003**: All settings changes are written to persistent storage within 100 ms of the user interaction that triggered them.
- **SC-004**: The inline microphone test begins producing pitch readings within 500 ms of the user pressing "Mikrofon testen" (assuming microphone permission is already granted).
- **SC-005**: The "Daten zurücksetzen" confirmation dialog prevents accidental resets — users must take two explicit actions (press button + press destructive confirmation) before any data is deleted.
- **SC-006**: All 13 `UserSettings` fields are correctly restored from persistent storage after an app restart, with no field reverting to a default.
- **SC-007**: The settings panel renders correctly at viewport widths from 320 px to 2560 px without horizontal overflow or clipped controls.

---

## Visual Reference

The mockup at `/mockup/settings.html` is the authoritative visual specification. Key measurements and token values extracted from it:

- Panel width: 380 px (full width on viewports narrower than 380 px)
- Panel animation: `transform: translateX(100%)` to `translateX(0)`, duration 0.35 s, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Backdrop: `rgba(0,0,0,0.4)` with `backdrop-filter: blur(4px)`, opacity transition 0.3 s
- Panel z-index: 101 (backdrop: 100, confirmation dialog: 300)
- Section separator: 1 px `var(--border-subtle)` with 4 px margin
- Section label: 9 px, weight 700, uppercase, letter-spacing 1.2 px, `var(--text-3)`
- Row label: 12 px, weight 500, `var(--text-2)`
- Pill active state: `var(--accent-soft)` background, `var(--accent-2)` text, `rgba(99,102,241,0.2)` border
- Slider thumb: 14 px diameter, `var(--accent)` fill, `var(--accent-soft)` ring
- Theme segmented control: 3-button group with `var(--bg-solid)` active background inside `var(--surface)` container
- Danger button: transparent background, `var(--red)` text, `var(--red-soft)` on hover
- Confirmation dialog: 320 px max-width, `border-radius: 16px`, `padding: 28px`, z-index 300

Design system tokens (Dark / Light) are defined in the mockup's `<style>` block and MUST be consumed from the shared theme token layer — no hardcoded color values in the settings component.
