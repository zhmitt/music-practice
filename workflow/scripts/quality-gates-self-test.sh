#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
guard="$repo_root/workflow/scripts/openspec-implementation-guard.sh"
fixture=$(mktemp -d)
temp_ts=""; temp_rust=""; event_file=""; body_file=""; marker=""
trap 'rm -rf "$fixture"; rm -f "$temp_ts" "$temp_rust" "$event_file" "$body_file" "$marker"' EXIT

mkdir -p "$fixture/openspec/changes/fixture-active" "$fixture/openspec/changes/fixture-draft" \
  "$fixture/openspec/changes/archive" "$fixture/workflow/state/reports"
cat > "$fixture/workflow/state/task-registry.md" <<'EOF'
### fixture-active
- State: in_progress
### fixture-draft
- State: draft
EOF
touch "$fixture/openspec/changes/fixture-active/tasks.md" "$fixture/openspec/changes/fixture-draft/tasks.md"

run_guard() { OPENSPEC_GUARD_ROOT="$fixture" "$guard" "$@"; }
if printf 'M\tfrontend/src/example.ts\n' | run_guard --change fixture-active >/dev/null 2>&1; then
  echo "Expected implementation-only diff to fail." >&2; exit 1
fi
if printf 'M\tfrontend/src/example.ts\nM\topenspec/changes/fixture-draft/tasks.md\n' | run_guard --change fixture-active >/dev/null 2>&1; then
  echo "Expected unrelated change artifact to fail." >&2; exit 1
fi
if printf 'M\tfrontend/src/example.ts\nM\topenspec/changes/fixture-draft/tasks.md\n' | run_guard --change fixture-draft >/dev/null 2>&1; then
  echo "Expected Draft declaration to fail." >&2; exit 1
fi
printf 'M\tfrontend/src/example.ts\nM\topenspec/changes/fixture-active/tasks.md\n' | run_guard --change fixture-active >/dev/null

# Deterministic archive fixture: completed artifacts, report, and a rename diff.
mv "$fixture/openspec/changes/fixture-active" "$fixture/openspec/changes/archive/fixture-active"
printf '%s\n' '- [x] verified task' > "$fixture/openspec/changes/archive/fixture-active/tasks.md"
touch "$fixture/openspec/changes/archive/fixture-active/verification.md" \
  "$fixture/workflow/state/reports/fixture-active.md"
printf 'R100\topenspec/changes/fixture-active/tasks.md\topenspec/changes/archive/fixture-active/tasks.md\n' \
  | run_guard --change fixture-active --mode archive >/dev/null
if printf 'A\topenspec/changes/archive/fixture-active/tasks.md\n' | run_guard --change fixture-active --mode archive >/dev/null 2>&1; then
  echo "Expected archive without active-path deletion to fail." >&2; exit 1
fi
printf '%s\n' '- [ ] incomplete' > "$fixture/openspec/changes/archive/fixture-active/tasks.md"
if printf 'R100\topenspec/changes/fixture-active/tasks.md\topenspec/changes/archive/fixture-active/tasks.md\n' \
  | run_guard --change fixture-active --mode archive >/dev/null 2>&1; then
  echo "Expected incomplete archive to fail." >&2; exit 1
fi

event_file=$(mktemp); body_file=$(mktemp); marker=$(mktemp); rm -f "$marker"
jq -n --arg body $'OpenSpec-Change: fixture-active\nPRBODYEOF\ntouch '"$marker" '{pull_request:{body:$body}}' > "$event_file"
GITHUB_EVENT_PATH="$event_file" "$repo_root/workflow/scripts/pr-body-from-event.sh" > "$body_file"
grep -Fx PRBODYEOF "$body_file" >/dev/null
[[ ! -e "$marker" ]] || { echo "PR body executed as shell source." >&2; exit 1; }

temp_ts=$(mktemp)
sed 's/get_pitch: { args: undefined; result: TauriPitchResult | null }/get_pitch: { args: undefined; result: boolean }/' \
  "$repo_root/frontend/src/lib/types/tauri.ts" > "$temp_ts"
if TAURI_CONTRACT_TS_FILE="$temp_ts" "$repo_root/workflow/scripts/tauri-contract-check.sh" >/dev/null 2>&1; then
  echo "Expected TypeScript signature drift to fail." >&2; exit 1
fi

temp_rust=$(mktemp)
python3 - "$repo_root/frontend/src-tauri/src/lib.rs" "$temp_rust" <<'PY'
import sys
s=open(sys.argv[1]).read()
s=s.replace("// ── App Entry Point", "#[tauri::command]\nfn fixture_health() -> bool { true }\n\n// ── App Entry Point")
s=s.replace("            is_drone_playing,", "            is_drone_playing,\n            fixture_health,")
open(sys.argv[2], "w").write(s)
PY
if TAURI_CONTRACT_RUST_FILE="$temp_rust" "$repo_root/workflow/scripts/tauri-contract-check.sh" >/dev/null 2>&1; then
  echo "Expected unsupported exported handler to fail." >&2; exit 1
fi

"$repo_root/workflow/scripts/github-workflow-check.py" >/dev/null
mkdir -p "$fixture/.github/workflows"
cat > "$fixture/.github/workflows/ci.yml" <<'EOF'
name: broken
on:
  push:
permissions:
  contents: read
  pull_request:
jobs: {}
EOF
if WORKFLOW_CHECK_ROOT="$fixture" "$repo_root/workflow/scripts/github-workflow-check.py" >/dev/null 2>&1; then
  echo "Expected malformed workflow semantics to fail." >&2; exit 1
fi
"$repo_root/workflow/scripts/sqlite-capability-check.sh" >/dev/null
audit_fixture="$fixture/audit.json"
cat > "$audit_fixture" <<'EOF'
{"vulnerabilities":{"@sveltejs/kit":{"severity":"high"},"cookie":{"severity":"low"},"devalue":{"severity":"high"},"esbuild":{"severity":"low"},"postcss":{"severity":"moderate"},"svelte":{"severity":"moderate"},"vite":{"severity":"high"}}}
EOF
"$repo_root/workflow/scripts/dependency-audit-check.py" "$audit_fixture" >/dev/null
echo "Quality gate negative tests passed."
