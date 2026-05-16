#!/usr/bin/env python3
"""PostToolUse helper invoked by log-agent.sh.

Reads the PostToolUse JSON envelope from stdin and appends one JSONL
record per `Agent` tool call to the path passed as argv[1]. Silent on
failure — logging is observational and must never break the calling
tool.
"""
from __future__ import annotations

import datetime
import json
import os
import pathlib
import sys


def main() -> int:
    if len(sys.argv) < 2:
        return 0
    log_path = pathlib.Path(sys.argv[1])
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    if (data.get("tool_name") or "") != "Agent":
        return 0

    tool_input = data.get("tool_input") or {}
    tool_response = data.get("tool_response") or {}
    agent_id = ""
    if isinstance(tool_response, dict):
        agent_id = tool_response.get("agentId") or ""

    record = {
        "ts": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "agent": tool_input.get("subagent_type") or "general-purpose",
        "description": (tool_input.get("description") or "")[:200],
        "agent_id": agent_id,
        "session": os.environ.get("CLAUDE_SESSION_ID", str(os.getppid())),
    }

    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
