#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
run_frontend=true
run_rust=true

case "${1:-}" in
  --frontend) run_rust=false ;;
  --rust) run_frontend=false ;;
  "") ;;
  *) echo "Usage: $0 [--frontend|--rust]" >&2; exit 2 ;;
esac

if "$run_frontend"; then
  cd "$repo_root/frontend"
  npm run check
  npm run lint
  npm run format:check
  npm run contract:check
  npm run build
  bash "$repo_root/workflow/scripts/web-route-smoke.sh"
  npm run test
fi

if "$run_rust"; then
  cd "$repo_root/frontend/src-tauri"
  cargo fmt --check
  cargo check
  cargo test
  cargo clippy -- -D warnings
fi

if "$run_frontend" && "$run_rust"; then
  cd "$repo_root"
  workflow/scripts/quality-gates-self-test.sh
fi
