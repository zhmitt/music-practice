#!/usr/bin/env bash

set -euo pipefail

requested_change=""
quiet=false
staged_mode=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change)
      requested_change="${2:-}"
      if [[ -z "$requested_change" ]]; then
        echo "Missing value for --change" >&2
        exit 1
      fi
      shift 2
      ;;
    --quiet)
      quiet=true
      shift
      ;;
    --staged)
      staged_mode=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

if [[ "$staged_mode" == true ]]; then
  # Auto-derive --change from staged openspec/changes/<id>/ paths
  # when caller didn't pass --change explicitly. Avoids "multiple active
  # changes" deadlock when many changes are in flight simultaneously.
  if [[ -z "$requested_change" ]]; then
    derived_changes="$(git diff --cached --name-only 2>/dev/null \
      | grep -oE '^openspec/changes/[A-Za-z0-9][A-Za-z0-9._-]*' \
      | sed 's|openspec/changes/||' \
      | sort -u)"
    derived_count="$(printf '%s\n' "$derived_changes" | grep -cv '^$' || true)"
    if [[ "$derived_count" == "1" ]]; then
      requested_change="$derived_changes"
    fi
  fi

  milestone_args=(--staged --mode enforce)
  if [[ -n "$requested_change" ]]; then
    milestone_args+=(--change "$requested_change")
  fi
  if [[ "$quiet" == true ]]; then
    milestone_args+=(--quiet)
  fi
  workflow/scripts/milestone-check.sh "${milestone_args[@]}"
  exit $?
fi

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
  [[ "$quiet" == false ]] && echo "No active changes to verify."
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
tasks_file="$change_dir/tasks.md"
verification_file="$change_dir/verification.md"
missing=()

if [[ ! -f "$tasks_file" ]]; then
  missing+=("tasks.md is missing")
else
  task_total="$(count_matches '^- \[( |x|X)\]' "$tasks_file")"
  task_complete="$(count_matches '^- \[[xX]\]' "$tasks_file")"
  task_user_action_pending="$(count_matches '^- \[ \].*\((User-Action — pending|User-Action -- pending|pending CI run|out of scope|P3 follow-up|out-of-scope)\)' "$tasks_file")"
  task_effective_complete="$((task_complete + task_user_action_pending))"
  if [[ "$task_total" -eq 0 ]]; then
    missing+=("tasks.md contains no checklist items")
  elif [[ "$task_effective_complete" -lt "$task_total" ]]; then
    missing+=("tasks are incomplete (${task_complete} done + ${task_user_action_pending} user-action / ${task_total} total)")
  fi
fi

if [[ ! -f "$verification_file" ]]; then
  missing+=("verification.md is missing")
fi

if ! grep -Fq "Change: ${change_id}" workflow/state/status.md 2>/dev/null; then
  missing+=("workflow/state/status.md has no entry for ${change_id}")
fi

if ! find workflow/state/reports -type f -name "*${change_id}*.md" | grep -q .; then
  missing+=("workflow/state/reports has no report for ${change_id}")
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  {
    echo "Post-implementation check failed for ${change_id}:"
    for item in "${missing[@]}"; do
      echo "- ${item}"
    done
    echo ""
    echo "Next:"
    echo "Run workflow/scripts/post-impl-prepare.sh --summary \"...\" to scaffold or update the canonical evidence."
  } >&2
  exit 1
fi

[[ "$quiet" == false ]] && echo "Post-implementation check passed for ${change_id}."
exit 0
