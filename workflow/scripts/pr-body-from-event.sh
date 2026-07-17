#!/usr/bin/env bash
set -euo pipefail

event_path=${GITHUB_EVENT_PATH:-}
if [[ -z "$event_path" || ! -f "$event_path" ]]; then
  echo "GITHUB_EVENT_PATH must name a readable GitHub event JSON file." >&2
  exit 1
fi

jq -r '.pull_request.body // ""' "$event_path"
