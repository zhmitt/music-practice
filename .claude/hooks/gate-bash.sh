#!/usr/bin/env bash
# PreToolUse hook for the Bash tool.
# Blocks `git commit --no-verify`, `git commit -n`, `git push --no-verify`,
# `git -c core.hooksPath=...`, and `--no-gpg-sign` unless
# CLAUDE_HOOKS_OFF=1 is explicitly set.
#
# Exit codes: 0 → allow, 2 → BLOCK.

set -euo pipefail

repo_root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
evidence_dir="$repo_root/.workflow-evidence"
override_log="$evidence_dir/overrides.jsonl"
mkdir -p "$evidence_dir"

verdict_line=$(python3 "$repo_root/.claude/hooks/gate-bash.py" 2>/dev/null || echo "allow\t")
verdict="${verdict_line%%	*}"
reason="${verdict_line#*	}"

if [[ "$verdict" != "block" ]]; then
  exit 0
fi

if [[ "${CLAUDE_HOOKS_OFF:-0}" == "1" ]]; then
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  esc_reason=$(printf '%s' "$reason" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read())[1:-1], end="")')
  printf '{"ts":"%s","gate":"bash","reason":"%s","override":"CLAUDE_HOOKS_OFF"}\n' \
    "$ts" "$esc_reason" >> "$override_log"
  exit 0
fi

cat >&2 <<EOF
BLOCKED by .claude/hooks/gate-bash.sh

Reason: $reason

Pre-commit hooks exist for a reason — they enforce post-implementation
evidence and gate sub-agent usage. Do NOT bypass them without explicit
user authorisation.

If the user has authorised the bypass:
  CLAUDE_HOOKS_OFF=1 <command>
The bypass is logged in .workflow-evidence/overrides.jsonl and surfaced
at the next pre-commit run.

If a hook is failing, fix the underlying issue instead of bypassing.
EOF
exit 2
