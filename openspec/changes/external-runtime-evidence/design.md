# Design: external-runtime-evidence

## Native WebView smoke

The application exposes a test-only smoke route or startup mode that performs SQLite create/insert/read/update/delete through the actual Tauri SQL plugin in the WebView. It emits a machine-detectable success/failure signal and exits, while production startup remains unchanged.

## Hosted delivery

The committed branch is pushed normally. Workflow runs are observed through GitHub CLI. Branch protection is configured only after resolving the exact check names from successful runs.

## Audio hardware

The native smoke enumerates devices, starts capture and drone where safe, observes typed status, stops both, and records permission/device limitations. Acoustic correctness and permission prompts remain physical-user evidence if automation cannot satisfy them.

## macOS delivery

The bundle build proves application packaging and executable placement. Signing identity, hardened runtime, entitlements, and notarization are inspected and reported independently.
