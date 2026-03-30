#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --feature)
      if [[ -z "${2:-}" ]]; then
        echo "Missing value for --feature" >&2
        exit 1
      fi
      args+=(--change "$2")
      shift 2
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

exec workflow/scripts/tasks-sync.sh "${args[@]}"
