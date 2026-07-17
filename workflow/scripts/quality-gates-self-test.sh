#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
guard="$repo_root/workflow/scripts/openspec-implementation-guard.sh"
active_change="engineering-quality-hardening-followup"
temp_ts=""
temp_rust=""

if printf '%s\n' frontend/src/lib/example.ts | "$guard" --change "$active_change" >/dev/null 2>&1; then
  echo "Expected implementation-only diff to fail." >&2
  exit 1
fi

if printf '%s\n' frontend/src/lib/example.ts openspec/changes/2026-03-31-app-shell-foundation/tasks.md \
  | "$guard" --change "$active_change" >/dev/null 2>&1; then
  echo "Expected unrelated historical change artifact to fail." >&2
  exit 1
fi

if printf '%s\n' frontend/src/lib/example.ts openspec/changes/2026-03-31-app-shell-foundation/tasks.md \
  | "$guard" --change 2026-03-31-app-shell-foundation >/dev/null 2>&1; then
  echo "Expected registry Draft change declaration to fail." >&2
  exit 1
fi

printf '%s\n' frontend/src/lib/example.ts "openspec/changes/$active_change/tasks.md" \
  | "$guard" --change "$active_change" >/dev/null
# A fully verified change must remain admissible while its PR is merged.
printf '%s\n' frontend/src/lib/example.ts openspec/changes/engineering-quality-hardening/tasks.md \
  | "$guard" --change engineering-quality-hardening >/dev/null
printf '%s\n' docs/architecture.md | "$guard" >/dev/null

event_file=$(mktemp)
body_file=$(mktemp)
injection_marker=$(mktemp)
rm -f "$injection_marker"
trap 'rm -f "$event_file" "$body_file" "$injection_marker" "$temp_ts" "$temp_rust"' EXIT
jq -n --arg body $'OpenSpec-Change: engineering-quality-hardening-followup\nPRBODYEOF\ntouch '"$injection_marker" \
  '{pull_request:{body:$body}}' > "$event_file"
GITHUB_EVENT_PATH="$event_file" "$repo_root/workflow/scripts/pr-body-from-event.sh" > "$body_file"
grep -Fx 'PRBODYEOF' "$body_file" >/dev/null
if [[ -e "$injection_marker" ]]; then
  echo "PR body content executed as shell source." >&2
  exit 1
fi
[[ $("$repo_root/workflow/scripts/openspec-change-from-body.sh" "$body_file") == "$active_change" ]]

temp_ts=$(mktemp)
sed 's/get_pitch: { args: undefined; result: TauriPitchResult | null }/get_pitch: { args: undefined; result: boolean }/' \
  "$repo_root/frontend/src/lib/types/tauri.ts" > "$temp_ts"
if TAURI_CONTRACT_TS_FILE="$temp_ts" "$repo_root/workflow/scripts/tauri-contract-check.sh" >/dev/null 2>&1; then
  echo "Expected command drift to fail." >&2
  exit 1
fi

temp_rust=$(mktemp)
sed 's/device_name: Option<String>/device_name: String/' \
  "$repo_root/frontend/src-tauri/src/lib.rs" > "$temp_rust"
if TAURI_CONTRACT_RUST_FILE="$temp_rust" "$repo_root/workflow/scripts/tauri-contract-check.sh" >/dev/null 2>&1; then
  echo "Expected Rust argument signature drift to fail." >&2
  exit 1
fi

"$repo_root/workflow/scripts/sqlite-capability-check.sh" >/dev/null

for package in '@sveltejs/kit' cookie devalue esbuild postcss svelte vite; do
  grep -F "\`$package\`" "$repo_root/docs/dependency-audit.md" >/dev/null || {
    echo "Dependency triage is missing current advisory package: $package" >&2
    exit 1
  }
done

echo "Quality gate negative tests passed."
