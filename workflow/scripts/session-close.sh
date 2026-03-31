#!/usr/bin/env bash

set -euo pipefail

summary=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --summary)
      summary="${2:-}"
      if [[ -z "$summary" ]]; then
        echo "Missing value for --summary" >&2
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
  echo "Usage: session-close.sh --summary \"...\"" >&2
  exit 1
fi

trimmed_summary="$(printf '%s' "$summary" | awk '{$1=$1; print}')"
if [[ ${#trimmed_summary} -lt 20 ]]; then
  echo "Summary is too short. Give a concise handover with what changed and what is next." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

workflow/scripts/tasks-sync.sh >/dev/null

timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
active_changes=()
while IFS= read -r line; do
  active_changes+=("$line")
done < <(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

{
  echo
  echo "## ${timestamp}"
  echo "- Summary: ${trimmed_summary}"
  if [[ ${#active_changes[@]} -eq 0 ]]; then
    echo "- Change: none"
    echo "- State: no_change"
  else
    for change_dir in "${active_changes[@]}"; do
      change_id="$(basename "$change_dir")"
      state="$(workflow/scripts/phase-status.sh --change "$change_id" | awk -F': ' '/^State:/ {print $2}')"
      next_step="$(workflow/scripts/phase-status.sh --change "$change_id" | awk -F': ' '/^Next:/ {print $2}')"
      echo "- Change: ${change_id}"
      echo "- State: ${state}"
      echo "- Next: ${next_step}"
    done
  fi
} >> workflow/state/status.md

{
  echo "# Next Session"
  echo
  echo "**Last Updated:** ${timestamp}"
  echo
  echo "## Last Summary"
  echo
  echo "${trimmed_summary}"
  echo
  echo "## Active Changes"
  echo
  if [[ ${#active_changes[@]} -eq 0 ]]; then
    echo "- none"
    echo
    echo "## Recommended Next Step"
    echo
    echo "- Create or activate a change in openspec/changes/"
  else
    for change_dir in "${active_changes[@]}"; do
      change_id="$(basename "$change_dir")"
      state="$(workflow/scripts/phase-status.sh --change "$change_id" | awk -F': ' '/^State:/ {print $2}')"
      next_step="$(workflow/scripts/phase-status.sh --change "$change_id" | awk -F': ' '/^Next:/ {print $2}')"
      echo "- ${change_id}: ${state}"
      echo
      echo "  Next: ${next_step}"
      echo
    done
  fi
} > workflow/state/NEXT-SESSION.md

echo "Session state updated."
