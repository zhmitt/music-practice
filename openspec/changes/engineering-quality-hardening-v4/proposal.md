# Proposal: engineering-quality-hardening-v4

## Why

A fresh read-only audit of the completed V3 commit reproduced residual defects at second-order boundaries: running owners do not always recover after a failed device transition, native and frontend runtime status can diverge, sample invalidation still has an interleaving window, component teardown can orphan leases, native history errors can erase visible state, and governance checks can bootstrap or archive fail-open.

## What changes

- reconcile running capture/drone owners after failed transitions and component teardown
- make audio runtime errors a stable serialized DTO consumed by product recovery UI
- make sample delivery generation-atomic and make the processing loop explicitly cancellable
- unify semantic validation and failure recovery across browser and SQLite persistence
- close workflow-validation bootstrap/schema gaps and strengthen archive evidence
- make archive commits pass local staged gates
- validate DTO field shapes and dependency advisory identities
- rename native build evidence so dashboards do not overstate WebView execution

## Impact

The change closes the newly reproduced post-V3 correctness gaps without replacing the existing architecture. Hardware, hosted GitHub, and GUI WebView execution remain explicit external evidence classes.
