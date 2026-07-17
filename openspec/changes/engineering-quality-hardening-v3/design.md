# Design: engineering-quality-hardening-v3

## Decisions

### Recoverable frontend ownership

Audio ownership is a state machine whose handles remain attributable until the matching native transition succeeds. Restart failure marks capture unavailable and allows a later acquire/restart to recover. Final-stop failure retains retryable ownership/recovery state.

### Cleanup is best-effort and complete

ToneLab cleanup attempts every owned-resource release, aggregates failures, and never lets one rejected command skip later cleanup. Drone starts carry a generation invalidated by mode and lifecycle changes.

### Native teardown and runtime state

Command acknowledgement timeouts do not imply resource-lifetime bounds. Owner shutdown must avoid an unconditional synchronous join after a known timeout. Runtime interruption is exposed as typed status, and samples from a stopped generation cannot update analysis.

### Contracts start from exported surfaces

The `generate_handler!` list is the canonical Tauri command inventory. Every listed handler must have exactly one parseable Rust signature and one matching frontend signature.

### Governance uses deterministic fixtures

Self-tests create isolated fixture state. Archive validation explicitly accepts a completed change moved from the active tree into the archive and rejects unrelated deletion or missing completion evidence.

### Evidence boundaries

Repository tests prove deterministic behavior. Hosted GitHub acceptance, physical audio devices, and packaged WebView SQLite access remain named evidence classes and may not be inferred from mocks or host tools.
