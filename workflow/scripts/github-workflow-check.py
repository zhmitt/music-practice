#!/usr/bin/env python3
"""Fail-closed semantic checks for this repository's GitHub workflows."""
from pathlib import Path
import os
import subprocess
import re
import sys

root = Path(os.environ.get("WORKFLOW_CHECK_ROOT", Path(__file__).resolve().parents[2]))
errors: list[str] = []
allowed_permissions = {
    "actions", "checks", "contents", "deployments", "discussions", "id-token",
    "issues", "models", "packages", "pages", "pull-requests", "security-events",
    "statuses", "attestations",
}

paths = sorted((root / ".github/workflows").glob("*.yml")) + sorted((root / ".github/workflows").glob("*.yaml"))
for path in paths:
    text = path.read_text()
    syntax = subprocess.run(
        ["ruby", "-e", 'require "yaml"; YAML.safe_load(File.read(ARGV[0]), aliases: true)', str(path)],
        text=True, capture_output=True,
    )
    if syntax.returncode:
        errors.append(f"{path}: invalid YAML: {syntax.stderr.strip()}")
    lines = text.splitlines()
    if not re.search(r"(?m)^on:\s*$", text): errors.append(f"{path}: missing top-level on")
    if not re.search(r"(?m)^jobs:\s*$", text): errors.append(f"{path}: missing top-level jobs")
    if not re.search(r"(?m)^permissions:\s*$", text): errors.append(f"{path}: missing explicit permissions")
    in_permissions = False
    for number, line in enumerate(lines, 1):
        if line == "permissions:": in_permissions = True; continue
        if in_permissions and line and not line.startswith(" "): in_permissions = False
        if in_permissions:
            match = re.match(r"^  ([a-z-]+):", line)
            if match and match.group(1) not in allowed_permissions:
                errors.append(f"{path}:{number}: invalid permission key {match.group(1)}")
        uses = re.search(r"\buses:\s*([^\s#]+)", line)
        if uses and not re.search(r"@[0-9a-f]{40}$", uses.group(1)):
            errors.append(f"{path}:{number}: action is not pinned to a commit SHA")

ci = (root / ".github/workflows/ci.yml").read_text()
on_block = ci.split("permissions:", 1)[0]
for event in ("push:", "pull_request:"):
    if not re.search(rf"(?m)^  {event}$", on_block):
        errors.append(f"ci.yml: missing top-level {event[:-1]} trigger")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("GitHub workflow semantic schema checks passed.")
