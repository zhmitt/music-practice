# Design: engineering-quality-hardening-v4

## Runtime ownership

Capture and drone ownership is reconciled against native status after a failed transition. Component destruction transfers cleanup to a durable coordinator instead of relying on component-local references.

## Audio data and error contract

Sample batches carry or recheck their active generation after the ring read; invalidated batches are discarded before analysis. Runtime errors cross Tauri as a stable tagged DTO rather than Rust's derived enum representation. Product UI consumes that status.

The background processing loop owns an explicit cancellation token and join path so graceful app teardown is testable.

## Persistence

Browser and SQLite session rows pass through the same semantic decoder. Read failure is distinguishable from an empty history, so transient failure preserves the existing view. Missing browser keys acknowledge prior read/partial-validation failures.

## Governance

Workflow checks run from an independent workflow and staged local hook. A pinned exhaustive schema validator supplements repository-specific rules. Archive evidence is structured, non-empty, exact-identity evidence, and staged archive paths derive the real change ID. DTO manifests include boundary field shapes. Dependency parity includes advisory identity and affected path, not package severity alone.
