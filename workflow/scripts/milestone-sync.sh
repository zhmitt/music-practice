#!/usr/bin/env bash

set -euo pipefail

requested_change=""
summary=""
completed=""
remaining=""
next_step_override=""
evidence=""
notes=""

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
    --completed)
      completed="${2:-}"
      if [[ -z "$completed" ]]; then
        echo "Missing value for --completed" >&2
        exit 1
      fi
      shift 2
      ;;
    --remaining)
      remaining="${2:-}"
      if [[ -z "$remaining" ]]; then
        echo "Missing value for --remaining" >&2
        exit 1
      fi
      shift 2
      ;;
    --next)
      next_step_override="${2:-}"
      if [[ -z "$next_step_override" ]]; then
        echo "Missing value for --next" >&2
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
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$summary" ]]; then
  echo "Usage: milestone-sync.sh --summary \"...\" [--change <change-id>] [--completed \"...\"] [--remaining \"...\"] [--next \"...\"] [--evidence \"...\"] [--notes \"...\"]" >&2
  exit 1
fi

trimmed_summary="$(printf '%s' "$summary" | awk '{$1=$1; print}')"
if [[ ${#trimmed_summary} -lt 10 ]]; then
  echo "Summary is too short. Give a concise milestone summary." >&2
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

extract_carry_over_context() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 0
  fi

  awk '
    /^## Carry-Over Context$/ { keep=1 }
    keep { print }
  ' "$file"
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

workflow/scripts/tasks-sync.sh >/dev/null
workflow/scripts/post-impl-prepare.sh --touch --change "$change_id" >/dev/null

if [[ -f "$tasks_file" ]]; then
  task_total="$(count_matches '^- \[( |x|X)\]' "$tasks_file")"
  task_complete="$(count_matches '^- \[[xX]\]' "$tasks_file")"
fi

phase_output="$(workflow/scripts/phase-status.sh --change "$change_id" 2>/dev/null || true)"
if [[ -n "$phase_output" ]]; then
  phase_state="$(printf '%s\n' "$phase_output" | awk -F': ' '/^State:/ {print $2}')"
  next_step="$(printf '%s\n' "$phase_output" | awk -F': ' '/^Next:/ {print $2}')"
fi

if [[ "$phase_state" == "ready_for_verify" ]]; then
  phase_state="ready_for_archive"
  next_step="Archive the change into openspec/changes/archive/"
fi

if [[ -n "$next_step_override" ]]; then
  next_step="$next_step_override"
fi

if [[ "$task_total" -gt 0 && "$task_complete" -eq "$task_total" ]]; then
  status_label="implemented"
fi

if [[ -z "$completed" && "$task_total" -gt 0 && "$task_complete" -eq "$task_total" ]]; then
  completed="All tracked tasks are currently marked complete."
fi

if [[ -z "$remaining" && "$task_total" -gt 0 && "$task_complete" -lt "$task_total" ]]; then
  remaining="Complete the remaining tracked tasks."
fi

report_file="$(find workflow/state/reports -maxdepth 1 -type f -name "*${change_id}*.md" | sort | head -n 1 || true)"
if [[ -z "$report_file" ]]; then
  report_file="workflow/state/reports/${day_stamp}-${change_id}.md"
fi

carry_over_context="$(extract_carry_over_context workflow/state/NEXT-SESSION.md)"

{
  echo
  echo "## ${timestamp}"
  echo
  echo "- Summary: ${trimmed_summary}"
  echo "- Phase state: ${phase_state}"
  echo "- Tasks complete: ${task_complete}/${task_total}"
  if [[ -n "$completed" ]]; then
    echo "- Completed: ${completed}"
  fi
  if [[ -n "$remaining" ]]; then
    echo "- Remaining: ${remaining}"
  fi
  if [[ -n "$evidence" ]]; then
    echo "- Evidence: ${evidence}"
  fi
  if [[ -n "$notes" ]]; then
    echo "- Notes: ${notes}"
  fi
  echo "- Next: ${next_step}"
} >> "$verification_file"

{
  echo
  echo "## ${timestamp}"
  echo
  echo "- Summary: ${trimmed_summary}"
  echo "- Change: ${change_id}"
  echo "- Phase state: ${phase_state}"
  echo "- Tasks complete: ${task_complete}/${task_total}"
  if [[ -n "$completed" ]]; then
    echo "- Completed: ${completed}"
  fi
  if [[ -n "$remaining" ]]; then
    echo "- Remaining: ${remaining}"
  fi
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
  echo "- Summary: ${trimmed_summary}"
  if [[ -n "$completed" ]]; then
    echo "- Completed: ${completed}"
  fi
  if [[ -n "$remaining" ]]; then
    echo "- Remaining: ${remaining}"
  fi
  echo "- Evidence: ${verification_file}, ${report_file}"
  if [[ -n "$notes" ]]; then
    echo "- Notes: ${notes}"
  fi
  echo "- Next: ${next_step}"
} >> workflow/state/status.md

{
  echo "# Next Session"
  echo
  echo "**Last Updated:** ${timestamp}"
  echo
  echo "## Last Milestone"
  echo
  echo "- Change: ${change_id}"
  echo "- Summary: ${trimmed_summary}"
  echo "- State: ${phase_state}"
  echo "- Tasks complete: ${task_complete}/${task_total}"
  if [[ -n "$completed" ]]; then
    echo "- Completed: ${completed}"
  fi
  if [[ -n "$remaining" ]]; then
    echo "- Remaining: ${remaining}"
  fi
  echo
  echo "## Active Changes"
  echo
  for active_change_dir in "${active_changes[@]}"; do
    active_change_id="$(basename "$active_change_dir")"
    active_state="$(workflow/scripts/phase-status.sh --change "$active_change_id" | awk -F': ' '/^State:/ {print $2}')"
    active_next="$(workflow/scripts/phase-status.sh --change "$active_change_id" | awk -F': ' '/^Next:/ {print $2}')"
    if [[ "$active_change_id" == "$change_id" ]]; then
      active_next="$next_step"
    fi

    echo "- ${active_change_id}: ${active_state}"
    echo
    echo "  Next: ${active_next}"
    echo
  done
  echo "## Recommended Next Step"
  echo
  echo "- ${next_step}"
  if [[ -n "$carry_over_context" ]]; then
    echo
    printf '%s\n' "$carry_over_context"
  fi
} > workflow/state/NEXT-SESSION.md

workflow/scripts/tasks-sync.sh >/dev/null

echo "Milestone state updated for ${change_id}."
echo "- ${verification_file}"
echo "- ${report_file}"
echo "- workflow/state/status.md"
echo "- workflow/state/NEXT-SESSION.md"
echo "- workflow/state/task-registry.md"
