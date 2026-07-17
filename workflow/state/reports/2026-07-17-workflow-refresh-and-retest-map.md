# Report: workflow-refresh-and-retest-map

## Summary

Refreshed the canonical workflow picture against the current repository state,
restored the local frontend toolchain so JS validation is green again, and
confirmed that the product is now blocked primarily by real Tauri validation
instead of missing local dependencies or new implementation breadth.

## Current state

- Date of refresh: 2026-07-17
- Active product changes: `2026-04-04-student-practice-journeys`,
  `2026-04-06-bb-horn-practice-pedagogy`
- Legacy implementation changes still open canonically:
  `2026-03-31-app-shell-foundation`, `2026-03-31-audio-pitch-engine`
- Workflow/tooling drift still present:
  `openspec-verification-toolchain` has full task completion but is still
  reported as `draft`
- Task registry was refreshed locally on 2026-07-17 and remains consistent with
  the current change landscape
- Local JS validation is reproducible again after restoring the frontend
  dependencies in this workspace

## Evidence

- `workflow/scripts/phase-status.sh --change 2026-03-31-app-shell-foundation`
  -> `draft`, `37/55`
- `workflow/scripts/phase-status.sh --change 2026-03-31-audio-pitch-engine`
  -> `draft`, `44/49`
- `workflow/scripts/phase-status.sh --change 2026-04-04-student-practice-journeys`
  -> `in_progress`, `12/14`
- `workflow/scripts/phase-status.sh --change 2026-04-06-bb-horn-practice-pedagogy`
  -> `in_progress`, `12/13`
- `workflow/scripts/phase-status.sh --change openspec-verification-toolchain`
  -> `draft`, `20/20`
- `cargo test` in `frontend/src-tauri`
  -> exit `0`, `26` passing tests
- `cargo check` in `frontend/src-tauri`
  -> exit `0`
- `test -d frontend/node_modules`
  -> initially `NODE_MODULES_MISSING`
- `npm ci` in `frontend`
  -> exit `0`, restored local frontend dependencies
- `npm run check` in `frontend`
  -> exit `0`, `svelte-check found 0 errors and 0 warnings`
- `npm run test` in `frontend`
  -> exit `0`, `7` test files and `119` tests passing
- `workflow/scripts/tasks-sync.sh --dry-run`
  -> reports `2` active changes, `3` draft changes, `1` ready-to-archive
  change, and `133/159` completed tasks
- `workflow/scripts/tasks-sync.sh --check`
  -> `Task registry is up to date.`
- `workflow/scripts/change-done.sh --change openspec-verification-toolchain`
  -> done pipeline passes with a non-blocking claim-evidence warning in the
  historical report

## Retest order

### Phase 1: Desktop shell + audio baseline

Run the real Tauri smoke path for:

- app launch
- microphone permission
- device selection
- live audio level
- live pitch detection
- persisted theme/language/settings

Primary queues:

- `2026-03-31-app-shell-foundation`
- `2026-03-31-audio-pitch-engine`

### Phase 2: Student journey UX retest

Retest the first-time learner flow and shell semantics:

- onboarding permission/signal/pitch/ready model
- Settings audio debug surface
- dashboard primary CTA
- guided-session control semantics
- Tone Lab page-start vs mode-start clarity
- Rhythm transport vs drill clarity
- Progress next-focus usefulness

Primary queue:

- `2026-04-04-student-practice-journeys`

### Phase 3: Bb horn pedagogy retest

Retest with a real `horn_bb` player after Phase 1 and Phase 2 are stable:

- written middle register choices
- drone usefulness
- mode-to-mode note-pool coherence
- remaining notation-model confusion

Primary queue:

- `2026-04-06-bb-horn-practice-pedagogy`

## Recommended next step

1. Run one focused Tauri baseline pass for the shell/audio foundation.
2. Then run the student-journey UX retest.
3. Finish with the Bb-horn pedagogy retest.
