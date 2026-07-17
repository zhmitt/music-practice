#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

exec cargo run \
  --quiet \
  --manifest-path "$repo_root/frontend/src-tauri/Cargo.toml" \
  --example audio_hardware_smoke \
  -- \
  --acknowledge-microphone-access \
  --duration-ms "${TONETRAINER_AUDIO_SMOKE_MS:-3000}"
