# Proposal: external-runtime-evidence

## Why

The quality hardening changes are locally complete, but the remaining confidence boundaries require execution outside unit and host-only tests: a real Tauri WebView must exercise SQLite, GitHub must accept and run the workflows, branch protection must enforce them, macOS audio must be probed through the native application, and an application bundle must be produced and inspected.

## What changes

- add an automated native WebView SQLite CRUD smoke harness
- push the verified commits and capture hosted GitHub Actions evidence
- inspect and configure branch protection with required quality checks
- add and run an instrumented native audio hardware smoke
- build and inspect a macOS application bundle; report signing/notarization separately
- keep every external or interactive boundary explicit

## Impact

This change upgrades the evidence from host/unit confidence to real delivery and runtime confidence without weakening permission, credential, or physical-interaction boundaries.
