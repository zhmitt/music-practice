#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
port=${TONETRAINER_SMOKE_PORT:-4173}
base_url="http://127.0.0.1:${port}"
preview_log=$(mktemp -t tonetrainer-preview.XXXXXX)

cleanup() {
  if [[ -n "${preview_pid:-}" ]]; then
    kill "$preview_pid" 2>/dev/null || true
    wait "$preview_pid" 2>/dev/null || true
  fi
  rm -f "$preview_log"
}
trap cleanup EXIT

cd "$repo_root/frontend"
npm run preview -- --host 127.0.0.1 --port "$port" >"$preview_log" 2>&1 &
preview_pid=$!

for _ in {1..40}; do
  if /usr/bin/curl --silent --fail --output /dev/null "$base_url/"; then
    break
  fi
  sleep 0.25
done
for route in / /progress /rhythm /teacher /tonelab; do
  status=$(/usr/bin/curl --silent --output /dev/null --write-out '%{http_code}' "$base_url$route")
  if [[ "$status" != 200 ]]; then
    echo "Route smoke failed: $route returned $status" >&2
    cat "$preview_log" >&2
    exit 1
  fi
  echo "route-smoke $route HTTP $status"
done
