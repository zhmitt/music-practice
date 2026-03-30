# `.specify` Retirement Plan — 2026-03-30

## Current Decision

Do not delete `.specify/` yet.

## Reason

- it still contains useful early capability breakdowns
- the repo is still pre-runtime, so historical product context matters
- the new workflow should survive normal work before the old tree is physically removed

## Retirement Path

1. stop all writes into `.specify/`
2. run normal work through `openspec/` and `workflow/`
3. extract only still-useful historical material later
4. archive or remove the rest in a separate cleanup wave
