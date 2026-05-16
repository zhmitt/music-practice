#!/usr/bin/env python3
"""Helper: prints '1' to stdout if the agents.jsonl log contains a
record for one of the requested agent types within the given lookback
window. Used by gate-edit.sh and pre-commit advisory.

Usage:
    check-agents-log.py <log_path> <minutes> <agent1> [agent2 ...]
"""
from __future__ import annotations

import datetime
import json
import pathlib
import sys


def main() -> int:
    if len(sys.argv) < 4:
        print(0)
        return 0
    log_path = pathlib.Path(sys.argv[1])
    try:
        minutes = int(sys.argv[2])
    except ValueError:
        print(0)
        return 0
    wanted = set(sys.argv[3:])
    now = datetime.datetime.utcnow()
    horizon = now - datetime.timedelta(minutes=minutes)

    if not log_path.exists():
        print(0)
        return 0

    found = 0
    try:
        with log_path.open(encoding="utf-8") as fh:
            for line in fh:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                if (rec.get("agent") or "") not in wanted:
                    continue
                ts = rec.get("ts") or ""
                try:
                    dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
                except Exception:
                    continue
                if dt >= horizon:
                    found = 1
                    break
    except OSError:
        pass

    print(found)
    return 0


if __name__ == "__main__":
    sys.exit(main())
