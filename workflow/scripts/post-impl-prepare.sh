#!/usr/bin/env bash

set -euo pipefail

requested_change=""
summary=""
evidence=""
notes=""
touch_only=false

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
    --summary)
      summary="${2:-}"
      if [[ -z "$summary" ]]; then
        echo "Missing value for --summary" >&2
        exit 1
      fi
      shift 2
      ;;
    --evidence)
      evidence="${2:-}"
      if [[ -z "$evidence" ]]; then
        echo "Missing value for --evidence" >&2
        exit 1
      fi
      shift 2
      ;;
    --notes)
      notes="${2:-}"
      if [[ -z "$notes" ]]; then
        echo "Missing value for --notes" >&2
        exit 1
      fi
      shift 2
      ;;
    --touch)
      touch_only=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$touch_only" != true && -z "$summary" ]]; then
  echo "Usage: post-impl-prepare.sh --summary \"...\" [--evidence \"...\"] [--notes \"...\"] [--change <change-id>]" >&2
  echo "       post-impl-prepare.sh --touch [--change <change-id>]" >&2
  exit 1
fi

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
  echo "No active changes found." >&2
  exit 1
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
timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
day_stamp="$(date '+%Y-%m-%d')"
tasks_file="$change_dir/tasks.md"
verification_file="$change_dir/verification.md"
report_file=""
task_total=0
task_complete=0
phase_state="in_progress"
next_step="Continue implementation"
status_label="checkpointed"

workflow/scripts/tasks-sync.sh >/dev/null 2>&1 || true

if [[ -f "$tasks_file" ]]; then
  task_total="$(count_matches '^- \[( |x|X)\]' "$tasks_file")"
  task_complete="$(count_matches '^- \[[xX]\]' "$tasks_file")"
fi

phase_output="$(workflow/scripts/phase-status.sh --change "$change_id" 2>/dev/null || true)"
if [[ -n "$phase_output" ]]; then
  phase_state="$(printf '%s\n' "$phase_output" | awk -F': ' '/^State:/ {print $2}')"
  next_step="$(printf '%s\n' "$phase_output" | awk -F': ' '/^Next:/ {print $2}')"
fi

if [[ "$task_total" -gt 0 && "$task_complete" -eq "$task_total" ]]; then
  status_label="implemented"
fi

report_file="$(find workflow/state/reports -maxdepth 1 -type f -name "*${change_id}*.md" | sort | head -n 1 || true)"
if [[ -z "$report_file" ]]; then
  report_file="workflow/state/reports/${day_stamp}-${change_id}.md"
fi

mkdir -p workflow/state/reports

if [[ ! -f "$verification_file" ]]; then
  cat > "$verification_file" <<EOF
# Verification: ${change_id}

## Current status

- State: ${phase_state}
- Tasks complete: ${task_complete}/${task_total}
- Created: ${timestamp}

## Automated checks

- Add relevant automated checks here.

## Manual checks

- Add relevant manual checks here.

## Notes

- Created by \`workflow/scripts/post-impl-prepare.sh\`
EOF
fi

if [[ ! -f "$report_file" ]]; then
  cat > "$report_file" <<EOF
# Report: ${change_id}

## Summary

Add a concise implementation summary here.

## Current state

- Phase state: ${phase_state}
- Tasks complete: ${task_complete}/${task_total}

## Evidence

- Add concrete evidence items here.

## Next step

- ${next_step}
EOF
fi

if [[ "$touch_only" == true ]]; then
  echo "Touched post-implementation artifacts for ${change_id}."
  echo "- ${verification_file}"
  echo "- ${report_file}"
  exit 0
fi

{
  echo
  echo "## ${timestamp}"
  echo
  echo "- Summary: ${summary}"
  echo "- Phase state: ${phase_state}"
  echo "- Tasks complete: ${task_complete}/${task_total}"
  if [[ -n "$evidence" ]]; then
    echo "- Evidence: ${evidence}"
  fi
  if [[ -n "$notes" ]]; then
    echo "- Notes: ${notes}"
  fi
} >> "$verification_file"

{
  echo
  echo "## ${timestamp}"
  echo
  echo "- Summary: ${summary}"
  echo "- Change: ${change_id}"
  echo "- Phase state: ${phase_state}"
  echo "- Tasks complete: ${task_complete}/${task_total}"
  if [[ -n "$evidence" ]]; then
    echo "- Evidence: ${evidence}"
  fi
  if [[ -n "$notes" ]]; then
    echo "- Notes: ${notes}"
  fi
  echo "- Next: ${next_step}"
} >> "$report_file"

{
  echo
  echo "## ${timestamp}"
  echo "- Change: ${change_id}"
  echo "- Status: ${status_label}"
  echo "- Summary: ${summary}"
  echo "- Evidence: ${verification_file}, ${report_file}"
  echo "- Next: ${next_step}"
} >> workflow/state/status.md

workflow/scripts/tasks-sync.sh >/dev/null 2>&1 || true

echo "Prepared post-implementation artifacts for ${change_id}."
echo "- ${verification_file}"
echo "- ${report_file}"
echo "- workflow/state/status.md"

if workflow/scripts/post-impl-check.sh --change "$change_id" >/dev/null 2>&1; then
  echo "Post-implementation check now passes for ${change_id}."
else
  echo "Post-implementation artifacts were prepared, but the change is not archive-ready yet."
fi
