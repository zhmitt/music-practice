#!/usr/bin/env python3
"""PreToolUse helper for Edit | Write | MultiEdit | NotebookEdit.

Reads the tool-use envelope from stdin, prints the staged file_path to
stdout if it should be gated, or empty string if whitelisted. The shell
wrapper interprets the result.
"""
from __future__ import annotations

import json
import sys

WHITELIST_EXT = {
    ".md", ".json", ".jsonc", ".yml", ".yaml", ".toml", ".txt",
    ".lock", ".env",
}
WHITELIST_PREFIX = (
    "openspec/", "workflow/", "docs/", ".claude/", ".git-hooks/",
    ".workflow-evidence/", ".gemini/", ".codex/", ".specify/",
)
WHITELIST_BASENAME = {
    "README.md", "LICENSE", "LICENSE.md", "CHANGELOG.md",
    "AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md",
    ".gitignore",
}
GATED_EXT = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".rs", ".svelte", ".java", ".sh", ".swift", ".go",
    ".rb", ".kt", ".c", ".cc", ".cpp", ".h", ".hpp",
}


def classify(path: str, repo_root: str) -> str:
    """Return 'gate' if the edit must be gated, 'allow' otherwise."""
    if not path:
        return "allow"
    rel = path
    if path.startswith(repo_root + "/"):
        rel = path[len(repo_root) + 1 :]
    # whitelist prefix
    for pref in WHITELIST_PREFIX:
        if rel.startswith(pref):
            return "allow"
    # whitelist basename
    base = rel.rsplit("/", 1)[-1]
    if base in WHITELIST_BASENAME or base.startswith(".env"):
        return "allow"
    # extension dispatch
    dot = rel.rfind(".")
    ext = rel[dot:] if dot >= 0 else ""
    if ext in WHITELIST_EXT:
        return "allow"
    if ext in GATED_EXT:
        return "gate"
    return "allow"  # unknown extension → don't gate


def main() -> int:
    if len(sys.argv) < 2:
        return 0
    repo_root = sys.argv[1]
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    file_path = (data.get("tool_input") or {}).get("file_path") or ""
    verdict = classify(file_path, repo_root)
    rel = file_path
    if file_path.startswith(repo_root + "/"):
        rel = file_path[len(repo_root) + 1 :]
    print(f"{verdict}\t{rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
