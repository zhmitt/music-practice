# Post-Hardening Engineering Quality Audit — 2026-07-17

## Baseline

The canonical verification suite passed in 18.6 seconds: Svelte check, blocking lint, format, 14-name contract check, production build, five HTTP route smokes, 128 frontend tests, Rust format/check, 30 Rust tests, and strict Clippy. Native `cargo run` launched the macOS process. `npm audit --omit=dev` reported seven advisories.

## Residual findings

1. ToneLab interprets a successful void drone start as inactive and subsequently skips stop.
2. Audio lifecycle can orphan leases during onboarding handoff, stop-during-acquire, and restart concurrency; stale auto-advance can mutate a new session.
3. Tauri SQL capabilities do not explicitly include execute although schema and writes use it.
4. PR body text is interpolated directly into a shell heredoc.
5. Audio failure tests bypass the production owner/build/play boundary; callbacks lack generations and acknowledgements are unbounded.
6. Persistence tracks one global retry and can clear an unresolved failure after an unrelated success; initialization and partial corruption are underreported.
7. OpenSpec guard accepts unrelated historical change paths; full local verify omits governance self-tests; contract evidence is name-only.
8. Seven dependency advisories remain untriaged by exposure and owner.

## Accepted priorities

The implementation order is: audible/runtime correctness, native persistence and CI security, production-boundary audio verification, then broader contract and dependency governance. Physical microphone, disconnect, and audible-output behavior remain explicit hardware evidence and are not inferred from unit tests.
