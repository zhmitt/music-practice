#!/usr/bin/env bash
# PreToolUse hook for Edit | Write | MultiEdit | NotebookEdit.
# Blocks code edits unless a Plan or Explore sub-agent has run in the
# last 4 hours. Whitelist (no gate): markdown, JSON/YAML/TOML/lock,
# openspec/, workflow/, docs/, .claude/, .git-hooks/,
# .workflow-evidence/, dotfiles, AGENTS.md / CLAUDE.md / …
#
# Override: CLAUDE_HOOKS_OFF=1 disables the gate but records the bypass
# in .workflow-evidence/overrides.jsonl.
#
# Exit codes: 0 → allow, 2 → BLOCK (stderr shown to model).

set -euo pipefail

repo_root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
evidence_dir="$repo_root/.workflow-evidence"
agents_log="$evidence_dir/agents.jsonl"
override_log="$evidence_dir/overrides.jsonl"
mkdir -p "$evidence_dir"

# Classify the file_path. classify outputs "<verdict>\t<rel_path>".
verdict_line=$(python3 "$repo_root/.claude/hooks/gate-edit.py" "$repo_root" 2>/dev/null || echo "allow\t")
verdict="${verdict_line%%	*}"
rel_path="${verdict_line#*	}"

if [[ "$verdict" != "gate" ]]; then
  exit 0
fi

# Override path.
if [[ "${CLAUDE_HOOKS_OFF:-0}" == "1" ]]; then
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  esc_path=$(printf '%s' "$rel_path" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read())[1:-1], end="")')
  printf '{"ts":"%s","gate":"edit","file":"%s","reason":"CLAUDE_HOOKS_OFF"}\n' \
    "$ts" "$esc_path" >> "$override_log"
  exit 0
fi

# Lookback: 4 h (240 min). Accept Plan OR Explore.
allowed=$(python3 "$repo_root/.claude/hooks/check-agents-log.py" "$agents_log" 240 Plan Explore 2>/dev/null || echo 0)

if [[ "$allowed" != "1" ]]; then
  cat >&2 <<EOF
BLOCKED by .claude/hooks/gate-edit.sh

File:    $rel_path
Reason:  no Plan or Explore sub-agent spawned in the last 4 h
         (log: .workflow-evidence/agents.jsonl)

This gate is intentionally hard. Spawn a Plan or Explore agent before
editing source code. Edits to *.md / *.json / openspec/ / workflow/ /
docs/ / .claude/ / config files are exempt automatically.

To unblock now:
  1) Spawn  Agent(subagent_type="Plan",    prompt="...")   ← preferred
     or    Agent(subagent_type="Explore", prompt="...")
  2) If the user has explicitly authorised a bypass, set
     CLAUDE_HOOKS_OFF=1 for the one Edit call. The bypass is logged in
     .workflow-evidence/overrides.jsonl and surfaced at the next
     pre-commit run.
EOF
  exit 2
fi

exit 0
