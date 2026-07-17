#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
guard="$repo_root/workflow/scripts/openspec-implementation-guard.sh"
fixture=$(mktemp -d)
temp_ts=""; temp_rust=""; temp_rust_types=""; event_file=""; body_file=""; marker=""
trap 'rm -rf "$fixture"; rm -f "$temp_ts" "$temp_rust" "$temp_rust_types" "$event_file" "$body_file" "$marker"' EXIT

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
[[ $(printf '%s\n' openspec/changes/archive/fixture-active/tasks.md | "$repo_root/workflow/scripts/openspec-changes-from-paths.sh") == fixture-active ]] || {
  echo "Archive-aware staged change derivation failed." >&2; exit 1
}
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
printf '%s\n' '- [x] verified task with evidence' > "$fixture/openspec/changes/archive/fixture-active/tasks.md"
cat > "$fixture/openspec/changes/archive/fixture-active/verification.md" <<'EOF'
## Automated checks
- fixture check: exit 0
## Notes
- deterministic fixture
EOF
cat > "$fixture/workflow/state/reports/fixture-active.md" <<'EOF'
# Report: fixture-active
## Evidence
- fixture check passed, exit 0
EOF
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
printf '%s\n' '- [x] verified task with evidence' > "$fixture/openspec/changes/archive/fixture-active/tasks.md"
printf '' > "$fixture/openspec/changes/archive/fixture-active/verification.md"
if printf 'R100\topenspec/changes/fixture-active/tasks.md\topenspec/changes/archive/fixture-active/tasks.md\n' \
  | run_guard --change fixture-active --mode archive >/dev/null 2>&1; then
  echo "Expected empty archive evidence to fail." >&2; exit 1
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
temp_rust_types=$(mktemp)
sed '/pub device_name: Option<String>,/d' "$repo_root/frontend/src-tauri/src/audio/types.rs" > "$temp_rust_types"
if TAURI_CONTRACT_RUST_TYPES_FILE="$temp_rust_types" "$repo_root/workflow/scripts/tauri-contract-check.sh" >/dev/null 2>&1; then
  echo "Expected Rust DTO field drift to fail." >&2; exit 1
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
if WORKFLOW_CHECK_ROOT="$fixture" "$repo_root/workflow/scripts/github-workflow-validate.sh" >/dev/null 2>&1; then
  echo "Expected malformed workflow semantics to fail." >&2; exit 1
fi
"$repo_root/workflow/scripts/sqlite-capability-check.sh" >/dev/null
audit_fixture="$fixture/audit.json"
python3 - "$repo_root/docs/dependency-audit.md" "$audit_fixture" <<'PY'
import json,re,sys
doc=open(sys.argv[1]).read(); inv=json.loads(re.search(r'<!-- audit-inventory:start -->\s*```json\s*(.*?)\s*```',doc,re.S).group(1))
v={}
for name,x in inv.items():
 via=[a[4:] if a.startswith('via:') else {'url':a,'source':a,'severity':x['severity']} for a in x['advisories']]
 v[name]={'severity':x['severity'],'via':via,'nodes':x['paths']}
json.dump({'vulnerabilities':v},open(sys.argv[2],'w'))
PY
"$repo_root/workflow/scripts/dependency-audit-check.py" "$audit_fixture" >/dev/null
python3 - "$audit_fixture" <<'PY'
import json,sys
p=sys.argv[1]; x=json.load(open(p)); x['vulnerabilities']['vite']['via'].append({'url':'https://example.invalid/new','source':'new','severity':'high'}); json.dump(x,open(p,'w'))
PY
if "$repo_root/workflow/scripts/dependency-audit-check.py" "$audit_fixture" >/dev/null 2>&1; then
  echo "Expected new same-package advisory to fail parity." >&2; exit 1
fi
echo "Quality gate negative tests passed."
