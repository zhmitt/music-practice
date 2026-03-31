# Tasks: App Shell & Navigation Foundation

## Status: proposed

## Tasks

### 1. Initialize Tauri 2.0 + SvelteKit project
- [ ] Scaffold Tauri 2.0 project with `create-tauri-app` or manual setup
- [ ] Configure SvelteKit as the frontend framework
- [ ] Verify `cargo tauri dev` launches a window with SvelteKit content
- [ ] Add `tauri-plugin-sql` (SQLite) to Cargo.toml and tauri.conf.json
- [ ] Initialize SQLite database with `user_settings` table on first launch

### 2. Implement design tokens and global styles
- [ ] Create `src/lib/styles/tokens.css` with exact dark/light CSS custom properties from mockup
- [ ] Create `src/lib/styles/global.css` with Inter font, reset, body styles
- [ ] Verify token values match `.specify/specs/003-app-shell/spec.md` Design Tokens tables exactly

### 3. Implement theme system
- [ ] Create `src/lib/stores/theme.ts` Svelte store (auto/dark/light)
- [ ] Implement `data-theme` attribute switching on `<html>`
- [ ] Implement Auto mode: read `prefers-color-scheme`, listen for runtime changes
- [ ] Implement 0.3s CSS transition on theme change
- [ ] Persist theme preference to SQLite
- [ ] Restore theme on app launch before first paint (avoid flash)

### 4. Implement sidebar navigation (desktop)
- [ ] Create `Sidebar.svelte`: 56px wide, logo, 4 nav items, spacer, mini-stats, settings gear
- [ ] Implement active state: accent color + 3px left indicator bar
- [ ] Nav items navigate via SvelteKit routing
- [ ] Show sidebar only when viewport > 1024px

### 5. Implement bottom bar (tablet/mobile)
- [ ] Create `BottomBar.svelte`: 4 nav icons in horizontal bar
- [ ] Show bottom bar when viewport <= 1024px
- [ ] Same nav behavior as sidebar

### 6. Implement header bar
- [ ] Create `Header.svelte`: page title, date, instrument chip, theme toggle
- [ ] Page title updates reactively based on current route
- [ ] Date formatted in locale-appropriate format
- [ ] Instrument chip reads from settings store
- [ ] ThemeToggle cycles Auto → Dark → Light

### 7. Implement routing and placeholder views
- [ ] Set up SvelteKit routes: `/`, `/tonelab`, `/rhythm`, `/progress`
- [ ] Each view renders a placeholder card with the view name
- [ ] Navigation between views is instant (no full page reload)

### 8. Implement fullscreen session overlay
- [ ] Create `SessionOverlay.svelte`: position fixed, covers full viewport
- [ ] When active: sidebar and header are hidden
- [ ] Escape key closes overlay
- [ ] Overlay contains placeholder content for now

### 9. Implement keyboard shortcuts
- [ ] Global `keydown` listener in layout
- [ ] Space: toggle session pause (when session active)
- [ ] ArrowRight: advance (when session active)
- [ ] ArrowLeft: go back (when session active)
- [ ] R: repeat (when at exercise summary)
- [ ] Escape: close session or navigate to dashboard
- [ ] Suppress shortcuts when text input is focused

### 10. Scaffold i18n
- [ ] Create `src/lib/i18n/de.json` with all shell strings in German
- [ ] Create `src/lib/i18n/en.json` with all shell strings in English
- [ ] Create `src/lib/i18n/index.ts` with locale store and translation helper
- [ ] Wire all component strings through the i18n helper
- [ ] Persist language preference to SQLite

### 11. Verification
- [ ] App launches with `cargo tauri dev`
- [ ] All 4 views are navigable via sidebar
- [ ] Theme toggle cycles correctly with smooth transition
- [ ] Theme persists across app restart
- [ ] Sidebar → bottom bar transition at 1024px breakpoint
- [ ] Session overlay hides navigation chrome
- [ ] Keyboard shortcuts respond correctly
- [ ] All strings render in both DE and EN
- [ ] No hardcoded strings in component templates (grep verification)
- [ ] SQLite database initializes and stores/retrieves settings
