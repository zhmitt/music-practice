#!/usr/bin/env bash

set -euo pipefail

requested_branch=""

usage() {
  cat <<'EOF'
Usage:
  workflow/scripts/worktree-doctor.sh
  workflow/scripts/worktree-doctor.sh --branch <branch>

Reports:
  - repo root and current cwd
  - workspace mode (primary, manual git worktree, tool-managed workspace)
  - current branch or detached HEAD
  - clean/dirty status
  - all known worktrees for the repo
  - optional ownership for a queried branch
  - active OpenSpec changes when available
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      requested_branch="${2:-}"
      if [[ -z "$requested_branch" ]]; then
        echo "Missing value for --branch" >&2
        exit 1
      fi
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Not inside a git repository." >&2
  exit 1
}
cd "$repo_root"

cwd="$(pwd -P)"
git_dir="$(git rev-parse --absolute-git-dir)"
common_dir_raw="$(git rev-parse --git-common-dir)"
if [[ "$common_dir_raw" = /* ]]; then
  common_dir="$common_dir_raw"
else
  common_dir="$(cd "$repo_root/$common_dir_raw" && pwd)"
fi
head_branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
head_commit="$(git rev-parse --short HEAD)"

if [[ -n "$head_branch" ]]; then
  head_display="$head_branch"
else
  head_display="DETACHED (${head_commit})"
fi

dirty_entries="$(git status --porcelain | wc -l | tr -d ' ')"
if [[ "$dirty_entries" == "0" ]]; then
  status_display="clean"
else
  status_display="dirty (${dirty_entries} entries)"
fi

if [[ -d "$repo_root/.git" ]]; then
  workspace_mode="primary workspace"
elif [[ "$repo_root" == "$HOME/.codex/worktrees/"* || "$repo_root" == "$HOME/.claude/worktrees/"* || "$repo_root" == "$HOME/.gemini/worktrees/"* ]]; then
  workspace_mode="tool-managed workspace"
else
  workspace_mode="manual git worktree"
fi

echo "Repo root: ${repo_root}"
echo "Current cwd: ${cwd}"
echo "Workspace mode: ${workspace_mode}"
echo "HEAD: ${head_display}"
echo "Status: ${status_display}"
echo "Git dir: ${git_dir}"
echo "Common dir: ${common_dir}"
echo
echo "Worktrees:"

branch_query="${requested_branch:-$head_branch}"
branch_owner_path=""
branch_owner_count=0
current_worktree_path=""
entry_path=""
entry_head=""
entry_branch=""

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ -z "$line" ]]; then
    if [[ -n "$entry_path" ]]; then
      if [[ -n "$entry_branch" ]]; then
        branch_name="${entry_branch#refs/heads/}"
      else
        branch_name="DETACHED"
      fi

      marker=""
      if [[ "$entry_path" == "$repo_root" ]]; then
        marker=" [current]"
        current_worktree_path="$entry_path"
      fi

      echo "- ${entry_path} => ${branch_name}${marker}"

      if [[ -n "$branch_query" && "$branch_name" == "$branch_query" ]]; then
        branch_owner_count=$((branch_owner_count + 1))
        branch_owner_path="$entry_path"
      fi
    fi

    entry_path=""
    entry_head=""
    entry_branch=""
    continue
  fi

  case "$line" in
    worktree\ *)
      entry_path="${line#worktree }"
      ;;
    HEAD\ *)
      entry_head="${line#HEAD }"
      ;;
    branch\ *)
      entry_branch="${line#branch }"
      ;;
  esac
done < <(git worktree list --porcelain && printf '\n')

if [[ -n "$branch_query" ]]; then
  echo
  echo "Branch query: ${branch_query}"
  if [[ "$branch_owner_count" == "0" ]]; then
    echo "Branch status: free"
  elif [[ "$branch_owner_count" == "1" ]]; then
    if [[ "$branch_owner_path" == "$repo_root" ]]; then
      echo "Branch status: owned"
      echo "Owner path: ${branch_owner_path}"
    else
      echo "Branch status: owned elsewhere"
      echo "Owner path: ${branch_owner_path}"
    fi
  else
    echo "Branch status: conflicting ownership (${branch_owner_count} worktrees)"
  fi
fi

if [[ -d "$repo_root/openspec/changes" ]]; then
  active_changes=()
  while IFS= read -r line; do
    active_changes+=("$line")
  done < <(find "$repo_root/openspec/changes" -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)
  echo
  echo "Active changes:"
  if [[ ${#active_changes[@]} -eq 0 ]]; then
    echo "- none"
  else
    for change_dir in "${active_changes[@]}"; do
      change_id="$(basename "$change_dir")"
      if [[ -f "$repo_root/workflow/scripts/phase-status.sh" ]]; then
        state="$(bash "$repo_root/workflow/scripts/phase-status.sh" --change "$change_id" | awk -F': ' '/^State:/ {print $2}')"
        next_step="$(bash "$repo_root/workflow/scripts/phase-status.sh" --change "$change_id" | awk -F': ' '/^Next:/ {print $2}')"
        if [[ -n "$state" || -n "$next_step" ]]; then
          echo "- ${change_id}: ${state:-unknown}"
          if [[ -n "$next_step" ]]; then
            echo "  Next: ${next_step}"
          fi
        else
          echo "- ${change_id}"
        fi
      else
        echo "- ${change_id}"
      fi
    done
  fi
fi

echo
echo "Close guidance:"
if [[ "$workspace_mode" == "primary workspace" ]]; then
  echo "- Primary workspace detected; do not remove this checkout."
elif [[ "$dirty_entries" != "0" ]]; then
  echo "- Dirty linked worktree; checkpoint or clean it before removal."
elif [[ -z "$head_branch" ]]; then
  echo "- Detached linked worktree; reattach a branch before removal."
elif [[ -f "$repo_root/workflow/scripts/worktree-close.sh" ]]; then
  echo "- Linked worktree is a removal candidate via workflow/scripts/worktree-close.sh --summary \"...\" --remove"
else
  echo "- Linked worktree looks removable once you are ready; no workflow/scripts/worktree-close.sh found here."
fi
