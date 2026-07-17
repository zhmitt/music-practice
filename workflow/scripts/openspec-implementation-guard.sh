#!/usr/bin/env bash
set -euo pipefail

repo_root=${OPENSPEC_GUARD_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}
declared_change=""
mode="auto"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change) declared_change="${2:-}"; shift 2 ;;
    --mode) mode="${2:-}"; shift 2 ;;
    *) echo "Usage: $0 --change <id> [--mode auto|change|archive] < name-status.txt" >&2; exit 2 ;;
  esac
done
[[ "$mode" =~ ^(auto|change|archive)$ ]] || { echo "Invalid mode: $mode" >&2; exit 2; }

implementation=false
declared_artifact=false
deleted_active=false
added_archive=false
while IFS=$'\t' read -r first second third; do
  [[ -z "$first" ]] && continue
  if [[ "$first" =~ ^[ACDMRTUXB][0-9]*$ ]]; then
    status="$first"; paths=("$second"); [[ -n "$third" ]] && paths+=("$third")
  else
    status="M"; paths=("$first")
  fi
  for file in "${paths[@]}"; do
    [[ "$file" == "openspec/changes/$declared_change/"* ]] && declared_artifact=true
    [[ "$file" == "openspec/changes/$declared_change/"* && "$status" =~ ^(D|R) ]] && deleted_active=true
    [[ "$file" == "openspec/changes/archive/$declared_change/"* && "$status" =~ ^(A|R) ]] && added_archive=true
    case "$file" in frontend/*|src/*|app/*|packages/*|.github/workflows/*|workflow/scripts/*) implementation=true ;; esac
  done
done

if [[ ! "$declared_change" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
  "$implementation" && { echo "OpenSpec guard: implementation changes require OpenSpec-Change: <id>." >&2; exit 1; }
  echo "OpenSpec implementation guard passed."
  exit 0
fi

active_dir="$repo_root/openspec/changes/$declared_change"
archive_dir="$repo_root/openspec/changes/archive/$declared_change"
if [[ "$mode" == auto ]]; then
  [[ -d "$archive_dir" && ! -d "$active_dir" ]] && mode=archive || mode=change
fi

if [[ "$mode" == archive ]]; then
  [[ ! -d "$active_dir" && -d "$archive_dir" ]] || { echo "Archive guard: change must exist only in archive." >&2; exit 1; }
  "$deleted_active" && "$added_archive" || { echo "Archive guard: diff must move the declared active path into archive." >&2; exit 1; }
  [[ -f "$archive_dir/tasks.md" && -f "$archive_dir/verification.md" ]] || { echo "Archive guard: completion artifacts are missing." >&2; exit 1; }
  if grep -qE '^- \[ \]' "$archive_dir/tasks.md"; then echo "Archive guard: tasks remain incomplete." >&2; exit 1; fi
  find "$repo_root/workflow/state/reports" -type f -name "*$declared_change*.md" | grep -q . || { echo "Archive guard: workflow report missing." >&2; exit 1; }
  echo "OpenSpec archive guard passed."
  exit 0
fi

if "$implementation"; then
  [[ -d "$active_dir" ]] || { echo "OpenSpec guard: declared change is not active." >&2; exit 1; }
  registry_state=$(awk -v heading="### $declared_change" '
    $0 == heading { found=1; next } found && /^### / { exit }
    found && /^- State: / { sub(/^- State: /, ""); print; exit }
  ' "$repo_root/workflow/state/task-registry.md")
  [[ "$registry_state" == in_progress || "$registry_state" == ready_for_archive ]] || { echo "OpenSpec guard: invalid registry state: ${registry_state:-missing}." >&2; exit 1; }
  "$declared_artifact" || { echo "OpenSpec guard: diff must update openspec/changes/$declared_change/." >&2; exit 1; }
fi
echo "OpenSpec implementation guard passed."
