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
  staged_files="$(git diff --cached --name-only)"
  code_files="$(echo "$staged_files" | grep -E '\.(ts|tsx|js|jsx|py|rs|svelte|java|sh)$' || true)"

  if [[ -z "$code_files" ]]; then
    [[ "$quiet" == false ]] && echo "No staged code files detected."
    exit 0
  fi

  canonical_evidence="$(echo "$staged_files" | grep -E '^(openspec/changes/.+/(proposal|design|tasks|verification)\.md|openspec/specs/.+\.md|workflow/state/(status|task-registry|NEXT-SESSION)\.md|workflow/state/reports/.+\.md|docs/.+\.md)$' || true)"

  if [[ -z "$canonical_evidence" ]]; then
    {
      echo "Post-implementation staging check failed."
      echo "Code files are staged, but no canonical workflow evidence was staged."
      echo "Stage updates in openspec/, workflow/state/, or docs/ before committing."
    } >&2
    exit 1
  fi

  [[ "$quiet" == false ]] && echo "Staged post-implementation evidence detected."
  exit 0
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
  if [[ "$task_total" -eq 0 ]]; then
    missing+=("tasks.md contains no checklist items")
  elif [[ "$task_complete" -lt "$task_total" ]]; then
    missing+=("tasks are incomplete (${task_complete}/${task_total})")
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
  } >&2
  exit 1
fi

[[ "$quiet" == false ]] && echo "Post-implementation check passed for ${change_id}."
