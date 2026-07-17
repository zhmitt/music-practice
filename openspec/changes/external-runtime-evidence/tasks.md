# Tasks: external-runtime-evidence

## Native runtime

- [x] implement actual WebView SQLite CRUD smoke mode and deterministic result capture
- [x] run the WebView SQLite smoke against the native application
- [x] implement or expose a safe native audio hardware smoke
- [x] run capture/device/drone status and teardown checks where hardware permits

## Hosted delivery

- [ ] push the completed hardening commits to the configured remote
- [ ] observe hosted CI and OpenSpec workflow results
- [ ] inspect current main-branch protection
- [ ] configure appropriate required checks without weakening existing protection

## macOS delivery

- [x] build a macOS application bundle
- [x] inspect bundle structure, entitlements, signing, and notarization readiness

## Evidence

- [ ] document automated successes and irreducible credential/physical blockers
- [ ] run canonical verification after harness changes
- [ ] refresh canonical workflow state and reports
- [ ] pass `workflow/scripts/change-done.sh --change external-runtime-evidence`
