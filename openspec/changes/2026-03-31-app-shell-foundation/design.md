# Design: App Shell & Navigation Foundation

## Architecture Decision

**Runtime Stack**: Tauri 2.0 + SvelteKit + Rust

- Tauri 2.0: native desktop (macOS, Windows, Linux) + future iOS/Android via same codebase
- SvelteKit: minimal runtime overhead, direct DOM updates ideal for real-time audio UI
- Rust backend: required for real-time audio processing (CPAL, YIN) in later changes
- SQLite via `tauri-plugin-sql`: local-first, no account required, sync-ready architecture for future teacher platform

## Layout Architecture

```
┌────────────────────────────────────────────────────────┐
│ Tauri Window                                           │
├────┬───────────────────────────────────────────────────┤
│    │ Header (52px)                                     │
│ S  ├───────────────────────────────────────────────────┤
│ i  │                                                   │
│ d  │ <slot /> — routed view content                   │
│ e  │                                                   │
│ b  │ Dashboard | ToneLab | Rhythm | Progress           │
│ a  │                                                   │
│ r  │                                                   │
│    │                                                   │
│56px│                                                   │
├────┴───────────────────────────────────────────────────┤
```

Practice Session: fullscreen overlay (z-index above shell), hides sidebar + header.

## Responsive Strategy

| Breakpoint | Sidebar | Bottom Bar | Header |
|---|---|---|---|
| > 1024px | 56px icon sidebar | hidden | visible |
| 768–1024px | hidden | visible | visible |
| < 768px | hidden | visible | visible |

## Theme System

`data-theme` attribute on `<html>` element. Three modes:

- **Auto**: follows `prefers-color-scheme` media query, reacts to OS changes at runtime
- **Dark**: forced dark regardless of OS
- **Light**: forced light regardless of OS

CSS custom properties defined in `:root` / `[data-theme="dark"]` / `[data-theme="light"]` blocks. Exact token values from `mockup/index.html` are the contract — see `.specify/specs/003-app-shell/spec.md` Design Tokens section for the full table.

Theme preference persisted in SQLite. 0.3s CSS transition on theme change.

## Routing

SvelteKit client-side routing. Four routes:

| Route | View | Nav Label (DE) | Nav Label (EN) |
|---|---|---|---|
| `/` | Dashboard | Üben | Practice |
| `/tonelab` | Tone Lab | Tone Lab | Tone Lab |
| `/rhythm` | Rhythmus | Rhythmus | Rhythm |
| `/progress` | Fortschritt | Fortschritt | Progress |

Settings: slide-in panel overlay, not a route.
Practice Session: fullscreen overlay, not a route.

## i18n Approach

- `$lib/i18n/de.json` and `$lib/i18n/en.json` as flat key-value JSON files
- Svelte store `$locale` drives the active language
- All component strings reference the store, no hardcoded text
- Language preference persisted in SQLite

## SQLite Schema (Initial)

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Simple key-value for Phase 1. Structured tables for sessions/progress come in later changes.

## Keyboard Shortcuts

Handled at the app shell level via a global `keydown` listener:

| Key | Context | Action |
|---|---|---|
| Space | Session active | Pause / Resume |
| ArrowRight | Session active | Next tone / advance |
| ArrowLeft | Session active | Previous tone (if possible) |
| R | Session summary | Repeat exercise |
| Escape | Session active | Close session (with confirm) |
| Escape | Any view (no session) | Navigate to Dashboard |

Shortcuts are suppressed when a text input is focused.

## File Structure (Target)

```
src-tauri/
  src/
    main.rs              — Tauri entry point
    lib.rs               — Tauri commands
  tauri.conf.json        — Tauri config
  Cargo.toml
src/
  lib/
    components/
      Sidebar.svelte
      Header.svelte
      BottomBar.svelte
      ThemeToggle.svelte
      SessionOverlay.svelte
    i18n/
      de.json
      en.json
      index.ts
    stores/
      theme.ts
      navigation.ts
      settings.ts
    styles/
      tokens.css          — Design tokens (dark + light)
      global.css
  routes/
    +layout.svelte        — Shell layout (sidebar + header + slot)
    +page.svelte           — Dashboard
    tonelab/+page.svelte   — Tone Lab (placeholder)
    rhythm/+page.svelte    — Rhythm (placeholder)
    progress/+page.svelte  — Progress (placeholder)
static/
  fonts/                   — Inter font files
package.json
svelte.config.js
vite.config.ts
```
