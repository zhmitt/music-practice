# Verification: Migrate music-practice to OpenSpec Hybrid

## Checks

- `workflow/scripts/tasks-sync.sh`
- `workflow/scripts/tasks-sync.sh --check`
- `workflow/scripts/phase-status.sh`
- `workflow/scripts/post-impl-check.sh --staged`
- `workflow/scripts/session-close.sh --summary "..."`
- `bash -n workflow/scripts/phase-status.sh workflow/scripts/tasks-sync.sh workflow/scripts/post-impl-check.sh workflow/scripts/session-close.sh`
- `bash -n .git-hooks/pre-commit codex/scripts/phase-detect.sh codex/scripts/tasks-sync.sh codex/scripts/post-impl-check.sh codex/scripts/session-close.sh`
- `python3 -c 'import json,sys; json.load(open(".claude/settings.json")); json.load(open(".gemini/settings.json"))'`

## Result

The canonical OpenSpec workflow is active, the compatibility layers route into it, and the legacy `.specify` tree is frozen instead of remaining an operational dependency.
