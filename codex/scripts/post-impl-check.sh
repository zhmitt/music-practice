#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

run_tests=false
args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --run-tests)
      run_tests=true
      shift
      ;;
    --working-tree)
      shift
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

if [[ ${#args[@]} -eq 0 ]]; then
  args+=(--staged)
fi

workflow/scripts/post-impl-check.sh "${args[@]}"

if [[ "$run_tests" == true ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    pnpm test:run
  elif command -v npm >/dev/null 2>&1; then
    npm test
  fi
fi

echo "✅ Post-implementation check passed."
