#!/usr/bin/env bash
# PostToolUse hook for the `Agent` tool.
# Appends one JSONL record per sub-agent spawn to
# .workflow-evidence/agents.jsonl via .claude/hooks/log-agent.py.
#
# stdin: PostToolUse envelope JSON.

set -euo pipefail

repo_root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
evidence_dir="$repo_root/.workflow-evidence"
mkdir -p "$evidence_dir"

python3 "$repo_root/.claude/hooks/log-agent.py" "$evidence_dir/agents.jsonl" 2>/dev/null || true
exit 0
