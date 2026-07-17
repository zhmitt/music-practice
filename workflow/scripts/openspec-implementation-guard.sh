#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
declared_change=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change) declared_change="${2:-}"; shift 2 ;;
    *) echo "Usage: $0 --change <active-change-id> < changed-files.txt" >&2; exit 2 ;;
  esac
done

files=()
while IFS= read -r file; do
  [[ -n "$file" ]] && files+=("$file")
done

implementation=false
declared_artifact=false
for file in "${files[@]}"; do
  [[ -n "$declared_change" && "$file" == "openspec/changes/$declared_change/"* ]] && declared_artifact=true
  case "$file" in
    frontend/*|src/*|app/*|packages/*|.github/workflows/*|workflow/scripts/*) implementation=true ;;
  esac
done

if "$implementation"; then
  if [[ ! "$declared_change" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
    echo "OpenSpec guard: implementation changes require an explicit 'OpenSpec-Change: <active-id>' declaration." >&2
    exit 1
  fi
  if [[ ! -d "$repo_root/openspec/changes/$declared_change" || "$declared_change" == "archive" ]]; then
    echo "OpenSpec guard: declared change is not active: $declared_change" >&2
    exit 1
  fi
  registry_state=$(awk -v heading="### $declared_change" '
    $0 == heading { found=1; next }
    found && /^### / { exit }
    found && /^- State: / { sub(/^- State: /, ""); print; exit }
  ' "$repo_root/workflow/state/task-registry.md")
  if [[ "$registry_state" != "in_progress" && "$registry_state" != "ready_for_archive" ]]; then
    echo "OpenSpec guard: declared change must be in_progress or ready_for_archive in workflow/state/task-registry.md (found: ${registry_state:-missing})." >&2
    exit 1
  fi
  if ! "$declared_artifact"; then
    echo "OpenSpec guard: diff must update the declared change openspec/changes/$declared_change/." >&2
    exit 1
  fi
fi

echo "OpenSpec implementation guard passed."
