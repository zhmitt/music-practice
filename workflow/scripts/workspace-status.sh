#!/usr/bin/env bash

set -euo pipefail

json_output=false
requested_branch=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)
      json_output=true
      shift
      ;;
    --branch)
      requested_branch="${2:-}"
      if [[ -z "$requested_branch" ]]; then
        echo "Missing value for --branch" >&2
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

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "Not inside a git worktree." >&2
  exit 1
fi

common_git_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
primary_workspace=""
if [[ -n "$common_git_dir" ]]; then
  primary_workspace="$(cd "${common_git_dir}/.." && pwd)"
fi

classify_mode() {
  local path="$1"

  if [[ -n "$primary_workspace" && "$path" == "$primary_workspace" ]]; then
    echo "primary-workspace"
  elif [[ "$path" == "$HOME/.codex/worktrees/"* || "$path" == "$HOME/.claude/"* || "$path" == "$HOME/.gemini/"* ]]; then
    echo "tool-managed"
  else
    echo "manual-git-worktree"
  fi
}

current_branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
if [[ -z "$current_branch" ]]; then
  current_branch="DETACHED"
fi

current_dirty="clean"
if [[ -n "$(git status --porcelain)" ]]; then
  current_dirty="dirty"
fi

entries=()
current_worktree=""
entry_head=""
entry_branch=""

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ -z "$line" ]]; then
    if [[ -n "$current_worktree" ]]; then
      if [[ -z "$entry_branch" ]]; then
        entry_branch="DETACHED"
      fi
      entries+=("${current_worktree}"$'	'"${entry_branch}"$'	'"${entry_head}")
    fi
    current_worktree=""
    entry_head=""
    entry_branch=""
    continue
  fi

  case "$line" in
    worktree\ *)
      current_worktree="${line#worktree }"
      ;;
    HEAD\ *)
      entry_head="${line#HEAD }"
      ;;
    branch\ refs/heads/*)
      entry_branch="${line#branch refs/heads/}"
      ;;
  esac
done < <(git worktree list --porcelain; printf '
')

branch_owner_path=""
branch_owner_mode=""
branch_owner_head=""

for entry in "${entries[@]}"; do
  IFS=$'	' read -r worktree_path worktree_branch worktree_head <<< "$entry"
  if [[ -n "$requested_branch" && "$worktree_branch" == "$requested_branch" ]]; then
    branch_owner_path="$worktree_path"
    branch_owner_mode="$(classify_mode "$worktree_path")"
    branch_owner_head="$worktree_head"
    break
  fi
done

if [[ "$json_output" == true ]]; then
  printf '{
'
  printf '  "current_worktree": "%s",
' "$repo_root"
  printf '  "current_mode": "%s",
' "$(classify_mode "$repo_root")"
  printf '  "current_branch": "%s",
' "$current_branch"
  printf '  "current_dirty": "%s",
' "$current_dirty"
  if [[ -n "$requested_branch" ]]; then
    printf '  "requested_branch": "%s",
' "$requested_branch"
    if [[ -n "$branch_owner_path" ]]; then
      printf '  "requested_branch_status": "owned",
'
      printf '  "requested_branch_owner_path": "%s",
' "$branch_owner_path"
      printf '  "requested_branch_owner_mode": "%s",
' "$branch_owner_mode"
      printf '  "requested_branch_owner_head": "%s",
' "$branch_owner_head"
    else
      printf '  "requested_branch_status": "free",
'
      printf '  "requested_branch_owner_path": "",
'
      printf '  "requested_branch_owner_mode": "",
'
      printf '  "requested_branch_owner_head": "",
'
    fi
  fi
  printf '  "worktrees": [
'
  for i in "${!entries[@]}"; do
    IFS=$'	' read -r worktree_path worktree_branch worktree_head <<< "${entries[$i]}"
    comma=","
    if [[ "$i" -eq $(( ${#entries[@]} - 1 )) ]]; then
      comma=""
    fi
    printf '    {"path":"%s","mode":"%s","branch":"%s","head":"%s"}%s
'       "$worktree_path" "$(classify_mode "$worktree_path")" "$worktree_branch" "$worktree_head" "$comma"
  done
  printf '  ]
'
  printf '}
'
  exit 0
fi

echo "Workspace: $repo_root"
echo "Mode: $(classify_mode "$repo_root")"
echo "Branch: $current_branch"
echo "Status: $current_dirty"
echo
echo "Known worktrees:"
for entry in "${entries[@]}"; do
  IFS=$'	' read -r worktree_path worktree_branch worktree_head <<< "$entry"
  echo "- Path: $worktree_path"
  echo "  Mode: $(classify_mode "$worktree_path")"
  echo "  Branch: $worktree_branch"
  echo "  Head: $worktree_head"
done

if [[ -n "$requested_branch" ]]; then
  echo
  echo "Branch query: $requested_branch"
  if [[ -n "$branch_owner_path" ]]; then
    echo "Branch status: owned"
    echo "Owner path: $branch_owner_path"
    echo "Owner mode: $branch_owner_mode"
    echo "Owner head: $branch_owner_head"
  else
    echo "Branch status: free"
  fi
fi
