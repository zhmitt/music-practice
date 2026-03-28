# Feature Specification: App Shell & Navigation

**Feature Branch**: `003-app-shell`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Tauri 2.0 project setup, Svelte frontend framework, navigation, theme system, and i18n"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - App Launches with Functional Shell (Priority: P0)

Leo opens ToneTrainer for the first time on his desktop. The app window appears with a 56px icon sidebar on the left, a 52px header bar at the top, and a main content area filling the rest of the screen. He can see the dashboard immediately — no loading screens, no setup wizards. The sidebar shows four navigation icons and a settings gear at the bottom. The mini-stats area at the bottom of the sidebar shows his streak count and average cent deviation.

**Why this priority**: Nothing else in the application works without this shell. Every other feature renders inside this structure. If the shell is broken, the product does not exist.

**Independent Test**: Launch the built Tauri app binary. Verify layout renders correctly with sidebar, header, and content area visible and correctly sized. Delivers a working, navigable application frame.

**Acceptance Scenarios**:

1. **Given** the app binary is launched, **When** the main window opens, **Then** a 56px-wide sidebar is visible on the left, a 52px-tall header bar is visible at the top, and the remaining area renders the dashboard view
2. **Given** the app is open, **When** the sidebar is inspected, **Then** it contains exactly four navigation items (Dashboard, Tone Lab, Rhythm, Progress) and a settings gear icon at the bottom
3. **Given** the app is open, **When** the sidebar mini-stats section is inspected, **Then** it shows a streak count and an average cent value, both labeled in uppercase in `--text-3` color
4. **Given** the app is open, **When** the header is inspected, **Then** it shows the current page title, today's date in locale format, the instrument chip (e.g. "Bb-Horn"), and the theme toggle button

---

### User Story 2 - Navigate Between the Four Main Views (Priority: P0)

Leo clicks each nav icon in the sidebar. The active view changes and the clicked icon highlights with the accent color and a left-edge indicator bar. The page title in the header updates to match the active view. No full-page reload occurs — navigation is instant, client-side.

**Why this priority**: The app is useless if users cannot move between its four sections. Navigation is a prerequisite for every other feature.

**Independent Test**: Click each of the four nav items in order. Verify the main content area changes view, the header title updates, and the active nav item is visually distinguished. All four views must be reachable.

**Acceptance Scenarios**:

1. **Given** the app is on the Dashboard view, **When** the user clicks the Tone Lab nav icon, **Then** the content area renders the Tone Lab view, the header title reads "Tone Lab", and the Tone Lab icon is highlighted with `--accent` color and a left-edge bar
2. **Given** any view is active, **When** the user clicks a different nav icon, **Then** the previously active icon returns to its default `--text-3` color and the new icon activates
3. **Given** any view is active, **When** the user navigates to a different view, **Then** the transition is immediate (no loading spinner, no visible flash)
4. **Given** the app is on any view, **When** the user presses Escape, **Then** the app navigates back to the Dashboard view

---

### User Story 3 - Dark / Light / Auto Theme Toggle with Persistence (Priority: P0)

Thomas opens ToneTrainer in the evening. His OS is in dark mode, so the app opens in dark theme automatically. He clicks the theme toggle button in the header and the app switches to light theme with a smooth 0.3s color transition — no hard flash. He closes and reopens the app and the light theme is still active. Later he sets theme to Auto and the app follows his OS setting again.

**Why this priority**: Thomas practices in the evening (dark) and during the day (light). The theme choice directly affects usability and is one of the first things a user notices. Persistence is essential — a preference that resets on every launch is not a preference.

**Independent Test**: Click the theme toggle three times (cycling Auto → Dark → Light → Auto or similar). Verify visual change, smooth transition, and that the selected theme is restored after app restart.

**Acceptance Scenarios**:

1. **Given** the system is in dark mode and theme is set to Auto, **When** the app launches, **Then** the `data-theme` attribute on `<html>` is `"dark"` and dark CSS tokens are active
2. **Given** the system is in light mode and theme is set to Auto, **When** the app launches, **Then** the `data-theme` attribute is `"light"` and light CSS tokens are active
3. **Given** any theme is active, **When** the user clicks the theme toggle button, **Then** the theme changes and all CSS custom properties update within 0.3s via the transition on `background` and `color`
4. **Given** the user has manually set the theme to Dark, **When** the app is closed and reopened, **Then** the Dark theme is restored regardless of OS preference
5. **Given** the theme is set to Auto, **When** the OS switches between dark and light mode at runtime, **Then** the app theme updates to match without requiring an app restart

---

### User Story 4 - Practice Session Opens as Fullscreen Overlay (Priority: P0)

Leo starts a session from the Dashboard. The entire app transitions to a fullscreen practice overlay. The sidebar and header disappear completely. Only the session content is visible. When he presses Escape or navigates back, the shell reappears in its prior state.

**Why this priority**: The practice session is the core product loop. It must feel immersive and distraction-free. If the sidebar is visible during practice, the UI philosophy ("clean, focused, like a good practice room") is violated.

**Independent Test**: Trigger the practice session overlay from the Dashboard. Verify sidebar and header are not rendered or are hidden. Press Escape and verify the shell returns to its prior state.

**Acceptance Scenarios**:

1. **Given** the Dashboard is active, **When** a practice session is started, **Then** the sidebar and header are no longer visible and the session overlay fills the full window
2. **Given** a practice session is active, **When** the user presses Escape, **Then** the session overlay closes and the app returns to the Dashboard with sidebar and header visible
3. **Given** a practice session overlay is open, **When** the Space key is pressed, **Then** the session pauses or resumes (key is handled by the session layer, not the shell)

---

### User Story 5 - Responsive Layout: Tablet and Mobile Fallback (Priority: P1)

A user opens ToneTrainer on a tablet with an 800px-wide screen. The sidebar is replaced by a bottom navigation bar. The four main nav items are visible as icons in the bottom bar. The header remains but may adjust. On a phone at 480px, the same bottom bar layout applies.

**Why this priority**: The primary target is desktop, but the app must not break on smaller screens. A student may use a tablet at their music stand. This is not the core experience but it must be functional.

**Independent Test**: Resize the app window to 900px wide and verify the sidebar is replaced by a bottom bar. Resize to 600px and verify the same. Navigation between views must still work.

**Acceptance Scenarios**:

1. **Given** the window width is greater than 1024px, **When** the layout renders, **Then** the 56px icon sidebar is displayed on the left and no bottom bar is present
2. **Given** the window width is between 768px and 1024px, **When** the layout renders, **Then** the sidebar is hidden and a bottom navigation bar appears at the bottom of the screen with the four main nav icons
3. **Given** the window width is less than 768px, **When** the layout renders, **Then** the bottom navigation bar is displayed (same as tablet)
4. **Given** a bottom bar is active, **When** the user taps a nav icon, **Then** the view changes identically to clicking the desktop sidebar

---

### User Story 6 - Keyboard Shortcuts for Desktop Navigation (Priority: P1)

Thomas keeps his hands on his horn while practicing. He presses the right arrow key to advance to the next step. He presses Space to pause mid-session. He presses R to repeat an exercise. He never needs to touch the mouse during a session. When not in a session, pressing Escape returns him to the Dashboard.

**Why this priority**: Keyboard control enables hands-free operation during practice, which is a real workflow constraint — the user is holding an instrument.

**Independent Test**: Open the app, navigate to a session, and use only keyboard shortcuts to pause, advance, repeat, and exit. All actions must work without mouse input.

**Acceptance Scenarios**:

1. **Given** a practice session is active, **When** Space is pressed, **Then** the session pauses if playing or resumes if paused
2. **Given** a practice session is active, **When** Arrow Right is pressed, **Then** the session advances to the next step
3. **Given** a practice session is active, **When** Arrow Left is pressed, **Then** the session returns to the previous step (if one exists)
4. **Given** a practice session is active, **When** R is pressed, **Then** the current exercise repeats from the beginning
5. **Given** any view is active (not in a session), **When** Escape is pressed, **Then** the app navigates to the Dashboard
6. **Given** a practice session is active, **When** Escape is pressed, **Then** the session closes and the app returns to the Dashboard

---

### User Story 7 - i18n: German Default and English Language Switch (Priority: P1)

Frau Meier opens the app settings and switches the language from German (default) to English. All visible strings in the UI — nav labels (visible on hover or in bottom bar), header titles, button labels — switch to English immediately. She switches back to German and they revert. The language preference is persisted.

**Why this priority**: The product targets German-speaking students and teachers as the primary audience, but i18n must be built in from the start to avoid expensive retrofitting later. English is required as a secondary language from Phase 1.

**Independent Test**: Open Settings, switch language to English, navigate through all four main views. Verify all string labels are in English. Switch back to German and verify reversion. Restart app and verify language persists.

**Acceptance Scenarios**:

1. **Given** a fresh installation, **When** the app launches, **Then** all UI strings are in German (e.g., nav items show "Üben", "Fortschritt")
2. **Given** the language is set to English in Settings, **When** the app re-renders, **Then** all UI strings switch to English without requiring an app restart
3. **Given** the language is set to English, **When** the app is closed and reopened, **Then** English remains the active language
4. **Given** any language is active, **When** a string is needed for a UI element, **Then** it is loaded from an externalized string resource file (not hardcoded inline)

---

### User Story 8 - Window State Persistence (Priority: P2)

Thomas resizes and repositions the ToneTrainer window to the right side of his monitor. He closes the app. When he reopens it, the window is in the same position and size as he left it.

**Why this priority**: Desktop apps that reset their window size and position on every launch feel unpolished. This is a quality-of-life feature, not a functional blocker.

**Independent Test**: Resize the window to a non-default size and drag it to a new position. Close and reopen the app. Verify the window dimensions and position match the prior session.

**Acceptance Scenarios**:

1. **Given** the user has resized the app window, **When** the app is closed and reopened, **Then** the window opens at the same size
2. **Given** the user has moved the app window, **When** the app is closed and reopened, **Then** the window opens at the same screen position
3. **Given** the persisted window position is off-screen (e.g., monitor was disconnected), **When** the app launches, **Then** it falls back to a default centered position

---

### Edge Cases

- What happens when the OS theme changes while the app has the theme set to Auto and a session is active? The theme must update without disrupting the session state.
- How does the system handle a missing or corrupted local storage entry for theme preference? Fall back to Auto (OS preference).
- What happens if the app window is closed mid-session (via the OS close button)? The session state must be saved before exit so it can be resumed or summarized on next launch.
- What happens when the language setting references a string key that does not exist in the translation file? Fall back to the German string; if German is also missing, show the key name as a visible error string (never a blank UI element).
- What happens when keyboard shortcuts conflict with OS-level shortcuts (e.g., some systems capture Space)? Tauri's window focus must be claimed on session start. Document known conflicts.
- What happens if SQLite initialization fails at app start? The app must display an error state and prevent data loss — no silent failure.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST initialize a Tauri 2.0 desktop application with a Rust backend and a SvelteKit frontend
- **FR-002**: The system MUST render a 56px-wide icon sidebar on the left side of the window when the viewport width is greater than 1024px
- **FR-003**: The system MUST render a bottom navigation bar in place of the sidebar when the viewport width is between 768px and 1024px, or below 768px
- **FR-004**: The sidebar MUST contain exactly four primary navigation items: Dashboard (Üben), Tone Lab, Rhythm (Rhythmus), and Progress (Fortschritt)
- **FR-005**: The sidebar MUST display a settings gear icon at the bottom, separated from the nav items by a spacer
- **FR-006**: The sidebar MUST display a mini-stats section showing streak count and average cent deviation, always visible above the settings gear
- **FR-007**: The header bar MUST display the current page title, today's date in locale-appropriate format, the active instrument chip, and the theme toggle button
- **FR-008**: The system MUST support three theme modes: Auto (follows OS `prefers-color-scheme`), Dark, and Light
- **FR-009**: Theme changes MUST apply a 0.3s CSS transition on `background` and `color` properties — no hard flash
- **FR-010**: The selected theme mode MUST be persisted in SQLite (consistent with FR-021) and restored on next app launch
- **FR-011**: In Auto mode, the system MUST react to OS-level theme changes at runtime without requiring an app restart
- **FR-012**: The CSS design system MUST use the exact custom property tokens defined in the mockup for both dark and light themes (see Design Tokens section)
- **FR-013**: The system MUST support client-side routing between the four main views with no full page reload
- **FR-014**: Navigating to a view MUST update the header page title and highlight the corresponding nav item with `--accent` color and a 3px left-edge indicator bar
- **FR-015**: The practice session overlay MUST hide the sidebar and header and fill the full window when active
- **FR-016**: Pressing Escape MUST close the practice session overlay and return to the Dashboard
- **FR-017**: The system MUST implement the following keyboard shortcuts: Space (pause/resume session), Arrow Right (next step), Arrow Left (previous step), Escape (back to Dashboard / close session), R (repeat exercise)
- **FR-018**: All user-visible strings MUST be externalized into locale resource files; no UI strings may be hardcoded in component templates
- **FR-019**: The system MUST ship with German (de) and English (en) locale files; German MUST be the default
- **FR-020**: Language selection MUST be accessible from Settings and persisted across sessions
- **FR-021**: The system MUST persist all application data using SQLite via the Tauri SQLite plugin
- **FR-022**: The system MUST persist window size and position on close and restore them on next launch (P2)
- **FR-023**: If a persisted window position is outside the current screen bounds, the system MUST fall back to a centered default position

### Key Entities

- **AppState**: Represents the runtime state of the shell. Attributes: `current_view` (enum: Dashboard | ToneLab | Rhythm | Progress), `theme` (enum: Auto | Dark | Light), `language` (enum: de | en), `instrument_profile` (reference to active instrument config), `session_active` (boolean)
- **NavigationItem**: Represents a single entry in the sidebar or bottom bar. Attributes: `id` (string), `icon` (SVG component reference), `label_key` (i18n string key), `route` (string path)
- **ThemePreference**: Persisted user preference for theme. Attributes: `mode` (Auto | Dark | Light), stored in SQLite as part of UserSettings (consistent with FR-021)
- **WindowState**: Persisted window dimensions and position. Attributes: `width` (integer px), `height` (integer px), `x` (integer px), `y` (integer px), stored via Tauri window state plugin or SQLite

---

## Design Tokens

The following CSS custom properties MUST be implemented exactly as specified for the dark and light themes. These values are non-negotiable — they are the visual contract of the design system.

### Dark Theme (`[data-theme="dark"]`)

| Token | Value |
|---|---|
| `--bg` | `#08080c` |
| `--bg-solid` | `#0e0e14` |
| `--surface` | `rgba(255,255,255,0.03)` |
| `--surface-2` | `rgba(255,255,255,0.05)` |
| `--surface-hover` | `rgba(255,255,255,0.07)` |
| `--border` | `rgba(255,255,255,0.06)` |
| `--border-subtle` | `rgba(255,255,255,0.04)` |
| `--text` | `#ededf0` |
| `--text-2` | `rgba(255,255,255,0.45)` |
| `--text-3` | `rgba(255,255,255,0.2)` |
| `--accent` | `#6366f1` |
| `--accent-2` | `#818cf8` |
| `--accent-soft` | `rgba(99,102,241,0.1)` |
| `--accent-softer` | `rgba(99,102,241,0.06)` |
| `--green` | `#34d399` |
| `--green-soft` | `rgba(52,211,153,0.08)` |
| `--amber` | `#fbbf24` |
| `--amber-soft` | `rgba(251,191,36,0.08)` |
| `--red` | `#f87171` |
| `--red-soft` | `rgba(248,113,113,0.08)` |
| `--shadow-sm` | `none` |
| `--shadow-md` | `none` |

### Light Theme (`[data-theme="light"]`)

| Token | Value |
|---|---|
| `--bg` | `#f5f5f7` |
| `--bg-solid` | `#ffffff` |
| `--surface` | `rgba(0,0,0,0.02)` |
| `--surface-2` | `rgba(0,0,0,0.04)` |
| `--surface-hover` | `rgba(0,0,0,0.06)` |
| `--border` | `rgba(0,0,0,0.06)` |
| `--border-subtle` | `rgba(0,0,0,0.04)` |
| `--text` | `#1a1a2e` |
| `--text-2` | `rgba(0,0,0,0.45)` |
| `--text-3` | `rgba(0,0,0,0.25)` |
| `--accent` | `#6366f1` |
| `--accent-2` | `#5558e8` |
| `--accent-soft` | `rgba(99,102,241,0.08)` |
| `--accent-softer` | `rgba(99,102,241,0.04)` |
| `--green` | `#16a34a` |
| `--green-soft` | `rgba(22,163,74,0.06)` |
| `--amber` | `#d97706` |
| `--amber-soft` | `rgba(217,119,6,0.06)` |
| `--red` | `#dc2626` |
| `--red-soft` | `rgba(220,38,38,0.06)` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)` |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |

### Layout Constants

| Constant | Value |
|---|---|
| Sidebar width (desktop) | `56px` |
| Header height | `52px` |
| Nav item size | `40px × 40px` |
| Logo size | `32px × 32px`, `border-radius: 9px` |
| Active nav left-bar | `3px wide, 16px tall, --accent color` |
| Card border-radius | `16px` |
| Body font | `Inter, -apple-system, system-ui, sans-serif` |
| Desktop breakpoint | `> 1024px` |
| Tablet breakpoint | `768px – 1024px` |
| Mobile breakpoint | `< 768px` |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Tauri app binary launches and renders the full shell layout (sidebar + header + content) within 2 seconds on a standard developer machine
- **SC-002**: Navigating between any two views via the sidebar takes less than 100ms (perceived as instant)
- **SC-003**: Theme toggle applies the visual change within 300ms (the CSS transition duration)
- **SC-004**: After setting a theme preference and restarting the app, the correct theme is restored on 100% of launches
- **SC-005**: All 7 keyboard shortcuts (Space, Arrow Right, Arrow Left, Escape, R) are handled correctly in the appropriate app context with zero missed events during a 10-minute practice session simulation
- **SC-006**: The responsive layout switches correctly at both breakpoints (1024px and 768px) with zero layout overflow or broken elements
- **SC-007**: A new locale string can be added to both de and en resource files and appears correctly in the UI without modifying any component code
- **SC-008**: Zero hardcoded UI strings exist in any Svelte component template (verified by grep for unlocalized string literals in display positions)
- **SC-009**: The SQLite database initializes successfully on first launch and all AppState fields can be written and read back correctly
- **SC-010**: Window position and size are restored correctly after restart in 100% of test cases where the window was within screen bounds
