# Tasks: external-runtime-evidence

## Native runtime

- [x] implement actual WebView SQLite CRUD smoke mode and deterministic result capture
- [x] run the WebView SQLite smoke against the native application
- [x] implement or expose a safe native audio hardware smoke
- [x] run capture/device/drone status and teardown checks where hardware permits

## Hosted delivery

- [x] push the completed hardening commits to the configured remote
- [x] observe hosted CI and OpenSpec workflow results
- [x] inspect current main-branch protection
- [x] configure appropriate required checks without weakening existing protection

## macOS delivery

- [x] build a macOS application bundle
- [x] inspect bundle structure, entitlements, signing, and notarization readiness

## Evidence

- [x] document automated successes and irreducible credential/physical blockers
- [x] run canonical verification after harness changes
- [x] refresh canonical workflow state and reports
- [x] pass `workflow/scripts/change-done.sh --change external-runtime-evidence`
