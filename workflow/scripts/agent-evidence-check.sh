#!/usr/bin/env bash
# Pre-commit advisory: warn (do not block) if no test-runner agent has
# run in the last 30 minutes when code files are staged. Also surface
# any CLAUDE_HOOKS_OFF bypasses recorded in the last 24 h.
#
# Non-blocking by design — the hard gate lives in
# .claude/hooks/gate-edit.sh (PreToolUse) and the existing
# post-impl-check in .git-hooks/pre-commit.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

evidence_dir=".workflow-evidence"
agents_log="$evidence_dir/agents.jsonl"
override_log="$evidence_dir/overrides.jsonl"
checker="$repo_root/.claude/hooks/check-agents-log.py"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1) Bypass surfacing (24 h lookback).
if [[ -f "$override_log" ]]; then
  recent=$(python3 - "$override_log" <<'PY' 2>/dev/null || echo 0
import json, sys, datetime, pathlib
p = pathlib.Path(sys.argv[1])
now = datetime.datetime.utcnow()
horizon = now - datetime.timedelta(hours=24)
count = 0
try:
    with p.open() as fh:
        for line in fh:
            try:
                rec = json.loads(line)
            except Exception:
                continue
            ts = rec.get("ts") or ""
            try:
                dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                continue
            if dt >= horizon:
                count += 1
except FileNotFoundError:
    pass
print(count)
PY
)
  if [[ "${recent:-0}" -gt 0 ]]; then
    printf "${YELLOW}⚠  %s CLAUDE_HOOKS_OFF bypass(es) recorded in last 24 h${NC}\n" "$recent" >&2
    printf "   See .workflow-evidence/overrides.jsonl\n" >&2
  fi
fi

# 2) test-runner advisory — only if code is staged.
staged_files="$(git diff --cached --name-only || true)"
code_files="$(echo "$staged_files" | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|py|rs|svelte|java|sh|swift|go)$' || true)"

if [[ -z "$code_files" ]]; then
  exit 0
fi

ok=0
if [[ -f "$agents_log" && -x "$checker" ]]; then
  ok=$(python3 "$checker" "$agents_log" 30 test-runner 2>/dev/null || echo 0)
fi

if [[ "$ok" != "1" ]]; then
  n=$(echo "$code_files" | wc -l | tr -d ' ')
  printf "${YELLOW}⚠  No test-runner agent run in last 30 min (staged code files: %s)${NC}\n" "$n" >&2
  printf "   Recommend: Agent(subagent_type=\"test-runner\", ...)\n" >&2
  printf "   Advisory only — commit will proceed.\n" >&2
else
  printf "${GREEN}✓ test-runner evidence found in last 30 min${NC}\n" >&2
fi

exit 0
