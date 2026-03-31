# Proposal: App Shell & Navigation Foundation

## Why

The repository contains a complete product spec, 12 feature specs, and 6 HTML/CSS mockups — but no runtime code. Every future implementation change (pitch detection, exercises, progress tracking) needs a running application to land in. Without the shell, nothing else can ship.

The first implementation change must:

- establish the concrete runtime stack (Tauri 2.0 + SvelteKit + Rust)
- provide the navigation and layout chrome that all feature views render inside
- implement the theme system so all subsequent views inherit dark/light support
- set up local persistence (SQLite) so user data can be stored from day one
- scaffold i18n so no hardcoded strings accumulate in later changes

## What Changes

- Initialize a Tauri 2.0 desktop application with a Rust backend and SvelteKit frontend
- Implement the app layout: 56px icon sidebar (desktop), bottom bar (tablet/mobile), 52px header
- Implement client-side routing between 4 placeholder views (Dashboard, Tone Lab, Rhythm, Progress)
- Implement the fullscreen practice session overlay (hides sidebar/header)
- Implement the theme system (Auto/Dark/Light) with exact CSS tokens from the mockups
- Set up SQLite via Tauri plugin for local data persistence
- Scaffold i18n with German (default) and English string files
- Implement keyboard shortcuts (Space, Arrow keys, Escape, R)
- Implement responsive breakpoints (sidebar > 1024px, bottom bar 768-1024px and below)

## Impact

- The repo transitions from product-definition-only to a runnable desktop application
- All subsequent feature changes have a concrete host to land in
- No product behavior ships yet — views contain placeholder content only
- The mockup HTML/CSS serves as the visual contract; the implementation must match the design tokens exactly

## References

- Legacy feature spec: `.specify/specs/003-app-shell/spec.md`
- Capability spec: `openspec/specs/practice-companion-foundation/spec.md`
- Visual contract: `mockup/index.html` (dashboard + session overlay, dark/light theme)
- Product spec: `docs/product-spec.md` (sections 4b, 10)
