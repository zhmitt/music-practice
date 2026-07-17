# Tasks: engineering-quality-hardening-v3

## CI and governance

- [x] repair pull-request CI and add workflow schema validation
- [x] derive Tauri contract coverage from all exported handlers and add negative tests
- [x] replace live-change governance fixtures with deterministic fixtures
- [x] add explicit archive-change validation and positive/negative tests
- [x] normalize dependency audit inventory and validate triage parity

## Frontend correctness

- [x] make failed audio restart recoverable without false-active leases
- [x] retain retryable ownership after failed final release and handle failures at consumers
- [x] complete ToneLab cleanup after drone-stop failure
- [x] invalidate stale drone starts during mode changes
- [x] clear recovered persistence read/validation failures
- [x] prevent stopped PlayAlong countdowns from acquiring audio
- [x] enforce documented semantic persistence invariants

## Rust audio correctness

- [x] prevent known-wedged owners from causing an unconditional shutdown join
- [x] expose typed capture/drone runtime failure status to Tauri and frontend contracts
- [x] prevent buffered samples from updating analysis after capture interruption
- [x] distinguish missing output device from missing microphone
- [x] add owner timeout, interruption, stale-sample, and status tests

## Native and delivery evidence

- [x] add the strongest automatable packaged Tauri SQLite CRUD smoke available in this workspace
- [x] document hosted CI, branch protection, physical audio, and packaged runtime residual evidence

## Verification

- [x] run focused failing-before/passing-after tests for every bug-fix group
- [x] run canonical verification and all governance negative tests
- [x] refresh reports, status, handoff, and task registry
- [x] pass `workflow/scripts/change-done.sh --change engineering-quality-hardening-v3`
