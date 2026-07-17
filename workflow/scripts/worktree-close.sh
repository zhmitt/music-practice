#!/usr/bin/env bash

set -euo pipefail

summary=""
requested_change=""
remove_mode=false

usage() {
  cat >&2 <<'EOF'
Usage:
  workflow/scripts/worktree-close.sh --summary "..."
  workflow/scripts/worktree-close.sh --summary "..." --remove --change <change-id>

Behavior:
  - Always runs workflow/scripts/session-close.sh first.
  - Without --remove, records a clean handover and leaves the worktree in place.
  - With --remove, refuses to remove a dirty worktree or the primary workspace.
  - With --remove, runs post-implementation checks for the requested change, or for the
    only active change when exactly one active change exists.
EOF
}

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
    --change)
      requested_change="${2:-}"
      if [[ -z "$requested_change" ]]; then
        echo "Missing value for --change" >&2
        exit 1
      fi
      shift 2
      ;;
    --remove)
      remove_mode=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$summary" ]]; then
  usage
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

workflow/scripts/session-close.sh --summary "$summary"

if [[ "$remove_mode" != true ]]; then
  echo "Worktree parked. Session state updated; no removal requested."
  exit 0
fi

if [[ -d "$repo_root/.git" ]]; then
  echo "Refusing to remove the primary workspace. Use this script from a linked git worktree only." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to remove a dirty worktree. Commit, stash, or clean the worktree first." >&2
  exit 1
fi

current_branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
if [[ -z "$current_branch" ]]; then
  echo "Refusing to remove a detached-HEAD worktree. Reattach the branch first." >&2
  exit 1
fi

change_to_check="$requested_change"
if [[ -z "$change_to_check" && -d openspec/changes ]]; then
  active_changes=()
  while IFS= read -r line; do
    active_changes+=("$line")
  done < <(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

  if [[ ${#active_changes[@]} -eq 1 ]]; then
    change_to_check="$(basename "${active_changes[0]}")"
  elif [[ ${#active_changes[@]} -gt 1 ]]; then
    echo "Multiple active changes detected. Pass --change <change-id> when using --remove." >&2
    exit 1
  fi
fi

if [[ -n "$change_to_check" ]]; then
  workflow/scripts/post-impl-check.sh --change "$change_to_check"
fi

if upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)"; then
  ahead_count="$(git rev-list --count "${upstream_ref}..HEAD")"
  if [[ "$ahead_count" != "0" ]]; then
    echo "Warning: ${current_branch} is ahead of ${upstream_ref} by ${ahead_count} commit(s)." >&2
    echo "The worktree will still be removed because the branch ref remains local." >&2
  fi
fi

common_dir="$(git rev-parse --git-common-dir)"

cd /
git --git-dir="$common_dir" worktree remove "$repo_root"
git --git-dir="$common_dir" worktree prune >/dev/null 2>&1 || true

echo "Removed linked worktree ${repo_root} (branch ${current_branch})."
