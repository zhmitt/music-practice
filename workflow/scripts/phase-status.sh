#!/usr/bin/env bash

set -euo pipefail

json_output=false
requested_change=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)
      json_output=true
      shift
      ;;
    --change)
      requested_change="${2:-}"
      if [[ -z "$requested_change" ]]; then
        echo "Missing value for --change" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

count_matches() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    { rg -N "$pattern" "$file" || true; } | wc -l | tr -d ' '
  else
    grep -Ec "$pattern" "$file" || true
  fi
}

active_changes=()
while IFS= read -r line; do
  active_changes+=("$line")
done < <(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

if [[ ${#active_changes[@]} -eq 0 ]]; then
  if [[ "$json_output" == true ]]; then
    cat <<EOF
{
  "change": "",
  "state": "no_change",
  "next_step": "Create or activate a change in openspec/changes/",
  "tasks_total": 0,
  "tasks_complete": 0
}
EOF
  else
    echo "Change: none"
    echo "State: no_change"
    echo "Tasks: 0/0"
    echo "Next: Create or activate a change in openspec/changes/"
  fi
  exit 0
fi

change_dir=""
if [[ -n "$requested_change" ]]; then
  change_dir="openspec/changes/$requested_change"
  if [[ ! -d "$change_dir" ]]; then
    echo "Active change not found: $requested_change" >&2
    exit 1
  fi
elif [[ ${#active_changes[@]} -gt 1 ]]; then
  echo "Multiple active changes detected. Use --change <change-id>." >&2
  exit 1
else
  change_dir="${active_changes[0]}"
fi

change_id="$(basename "$change_dir")"
proposal_exists=false
design_exists=false
tasks_exists=false
verification_exists=false
report_exists=false
status_entry_exists=false
tasks_total=0
tasks_complete=0

[[ -f "$change_dir/proposal.md" ]] && proposal_exists=true
[[ -f "$change_dir/design.md" ]] && design_exists=true
[[ -f "$change_dir/tasks.md" ]] && tasks_exists=true
[[ -f "$change_dir/verification.md" ]] && verification_exists=true

if find workflow/state/reports -type f -name "*${change_id}*.md" | grep -q .; then
  report_exists=true
fi

if [[ -f workflow/state/status.md ]] && grep -Fq "Change: ${change_id}" workflow/state/status.md; then
  status_entry_exists=true
fi

if [[ "$tasks_exists" == true ]]; then
  tasks_total="$(count_matches '^- \[( |x|X)\]' "$change_dir/tasks.md")"
  tasks_complete="$(count_matches '^- \[[xX]\]' "$change_dir/tasks.md")"
fi

state="draft"
next_step="Complete proposal.md"

if [[ "$proposal_exists" != true ]]; then
  state="draft"
  next_step="Complete proposal.md"
elif [[ "$design_exists" != true ]]; then
  state="ready_for_design"
  next_step="Write design.md"
elif [[ "$tasks_exists" != true ]]; then
  state="ready_for_tasks"
  next_step="Write tasks.md"
elif [[ "$tasks_total" -eq 0 || "$tasks_complete" -lt "$tasks_total" ]]; then
  state="in_progress"
  next_step="Complete remaining tasks"
elif [[ "$verification_exists" != true || "$report_exists" != true || "$status_entry_exists" != true ]]; then
  state="ready_for_verify"
  next_step="Add verification.md and workflow evidence"
else
  state="ready_for_archive"
  next_step="Archive the change into openspec/changes/archive/"
fi

if [[ "$json_output" == true ]]; then
  cat <<EOF
{
  "change": "${change_id}",
  "state": "${state}",
  "next_step": "${next_step}",
  "tasks_total": ${tasks_total},
  "tasks_complete": ${tasks_complete}
}
EOF
else
  echo "Change: ${change_id}"
  echo "State: ${state}"
  echo "Tasks: ${tasks_complete}/${tasks_total}"
  echo "Next: ${next_step}"
fi
