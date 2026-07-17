#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
"$repo_root/workflow/scripts/sqlite-capability-check.sh"
cd "$repo_root/frontend"
cargo tauri build --debug --no-bundle
target_dir=$(cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1 --no-deps | jq -r .target_directory)
binary="$target_dir/debug/tonetrainer"
[[ -x "$binary" ]] || { echo "Expected native debug application was not produced: $binary" >&2; exit 1; }
echo "Native Tauri build produced: $binary"
echo "Evidence boundary: WebView SQLite CRUD is NOT executed headlessly; physical app launch remains required."
