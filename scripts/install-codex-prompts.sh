#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"
target_dir="${codex_home}/prompts"
source_dir="${repo_root}/.codex/prompts-src"

mkdir -p "$target_dir"
cp "$source_dir"/opsx-*.md "$target_dir"/

echo "Installed Codex prompts into ${target_dir}"

