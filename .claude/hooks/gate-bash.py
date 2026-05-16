#!/usr/bin/env python3
"""PreToolUse helper for the Bash tool.

Reads the tool-use envelope from stdin, prints 'block\\t<reason>' if the
command tries to bypass hooks (--no-verify / -n / --no-gpg-sign /
-c core.hooksPath=) or 'allow\\t' otherwise.
"""
from __future__ import annotations

import json
import re
import sys

# `git commit ... --no-verify` or `git commit ... -n` (short flag).
RE_COMMIT_BYPASS = re.compile(
    r"(?:^|\s)git\s+commit\b[^|;&]*\s(?:--no-verify|-n)(?:\s|$)"
)
# `git push ... --no-verify`.
RE_PUSH_BYPASS = re.compile(
    r"(?:^|\s)git\s+push\b[^|;&]*\s--no-verify(?:\s|$)"
)
# `git -c core.hooksPath=...` (override hooks dir) or `--no-gpg-sign`.
RE_CONFIG_BYPASS = re.compile(
    r"git\s+(?:-c\s+core\.hooksPath=|commit[^|;&]*\s--no-gpg-sign)"
)


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        print("allow\t")
        return 0
    command = (data.get("tool_input") or {}).get("command") or ""
    if RE_COMMIT_BYPASS.search(command):
        print("block\t--no-verify on git commit")
    elif RE_PUSH_BYPASS.search(command):
        print("block\t--no-verify on git push")
    elif RE_CONFIG_BYPASS.search(command):
        print("block\tcore.hooksPath= or --no-gpg-sign bypass")
    else:
        print("allow\t")
    return 0


if __name__ == "__main__":
    sys.exit(main())
