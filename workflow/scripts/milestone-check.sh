#!/usr/bin/env bash

set -euo pipefail

requested_change=""
staged_mode=false
range_spec=""
mode="enforce"
quiet=false

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
    --staged)
      staged_mode=true
      shift
      ;;
    --range)
      range_spec="${2:-}"
      if [[ -z "$range_spec" ]]; then
        echo "Missing value for --range" >&2
        exit 1
      fi
      shift 2
      ;;
    --mode)
      mode="${2:-}"
      if [[ "$mode" != "warn" && "$mode" != "enforce" ]]; then
        echo "Invalid value for --mode: $mode" >&2
        exit 1
      fi
      shift 2
      ;;
    --quiet)
      quiet=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$staged_mode" == true && -n "$range_spec" ]]; then
  echo "Use either --staged or --range, not both." >&2
  exit 1
fi

if [[ "$staged_mode" != true && -z "$range_spec" ]]; then
  echo "Usage: milestone-check.sh (--staged | --range \"<git-range>\") [--change <change-id>] [--mode warn|enforce] [--quiet]" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

emit_issue() {
  local message="$1"
  if [[ "$mode" == "warn" ]]; then
    echo "$message" >&2
    return 0
  fi

  echo "$message" >&2
  return 1
}

list_changed_files() {
  if [[ "$staged_mode" == true ]]; then
    git diff --cached --name-only
  else
    git diff --name-only "$range_spec"
  fi
}

changed_files="$(list_changed_files)"
implementation_files="$(printf '%s\n' "$changed_files" | grep -E '(^src/|^tests/|^scripts/|^workflow/scripts/|(^|/)(Dockerfile|Makefile)$|\.([jt]sx?|mjs|cjs|json|py|rs|go|java|kt|swift|rb|php|sh|bash|zsh|fish|ya?ml|toml|ini|cfg|conf|sql|css|scss|sass|less|html|svelte|vue)$)' || true)"

if [[ -z "$implementation_files" ]]; then
  [[ "$quiet" == false ]] && echo "No implementation files detected in scope."
  exit 0
fi

active_changes=()
while IFS= read -r line; do
  active_changes+=("$line")
done < <(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

if [[ ${#active_changes[@]} -eq 0 ]]; then
  [[ "$quiet" == false ]] && echo "No active changes to evaluate."
  exit 0
fi

change_id=""
if [[ -n "$requested_change" ]]; then
  if [[ ! -d "openspec/changes/$requested_change" ]]; then
    echo "Active change not found: $requested_change" >&2
    exit 1
  fi
  change_id="$requested_change"
elif [[ ${#active_changes[@]} -gt 1 ]]; then
  emit_issue "Milestone check could not choose an active change. Re-run with --change <change-id>." || exit 1
  exit 0
else
  change_id="$(basename "${active_changes[0]}")"
fi

missing=()

if ! printf '%s\n' "$changed_files" | grep -Eq "^openspec/changes/${change_id}/verification\.md$"; then
  missing+=("openspec/changes/${change_id}/verification.md")
fi

if ! printf '%s\n' "$changed_files" | grep -Eq '^workflow/state/status\.md$'; then
  missing+=("workflow/state/status.md")
fi

if ! printf '%s\n' "$changed_files" | grep -Eq '^workflow/state/NEXT-SESSION\.md$'; then
  missing+=("workflow/state/NEXT-SESSION.md")
fi

if ! printf '%s\n' "$changed_files" | grep -Eq "^workflow/state/reports/.*${change_id}.*\.md$"; then
  missing+=("workflow/state/reports/*${change_id}*.md")
fi

if printf '%s\n' "$changed_files" | grep -Eq '^openspec/changes/[^/]+/tasks\.md$'; then
  if ! printf '%s\n' "$changed_files" | grep -Eq '^workflow/state/task-registry\.md$'; then
    missing+=("workflow/state/task-registry.md")
  fi
fi

if ! workflow/scripts/tasks-sync.sh --check >/dev/null 2>&1; then
  missing+=("workflow/state/task-registry.md (generated output is stale)")
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  message_file="$(mktemp)"
  {
    echo "Canonical milestone check failed for ${change_id}."
    echo "Implementation changes were detected, but canonical milestone updates are missing or stale:"
    for item in "${missing[@]}"; do
      echo "- ${item}"
    done
    echo
    echo "Run: workflow/scripts/milestone-sync.sh --change ${change_id} --summary \"<what changed>\""
  } > "$message_file"
  emit_issue "$(cat "$message_file")" || { rm -f "$message_file"; exit 1; }
  rm -f "$message_file"
  exit 0
fi

[[ "$quiet" == false ]] && echo "Canonical milestone state is in sync for ${change_id}."
