#!/usr/bin/env python3
"""Compare npm audit's normalized package inventory with documented triage."""
from datetime import date
from pathlib import Path
import json, re, sys

root = Path(__file__).resolve().parents[2]
doc = (root / "docs/dependency-audit.md").read_text()
match = re.search(r"Next review:\s*(\d{4}-\d{2}-\d{2})", doc)
if not match: raise SystemExit("Dependency triage lacks a Next review date.")
if date.fromisoformat(match.group(1)) < date.today(): raise SystemExit("Dependency triage review date has expired.")
if not re.search(r"Owner for all entries:\s*[^.]+", doc): raise SystemExit("Dependency triage lacks an owner.")

documented = {}
for line in doc.splitlines():
    row = re.match(r"\|\s*`([^`]+)`\s*\|\s*(Low|Moderate|High|Critical)\s*\|(.+?)\|(.+?)\|", line)
    if row:
        package, severity, exposure, remediation = row.groups()
        if len(exposure.strip()) < 20 or len(remediation.strip()) < 20:
            raise SystemExit(f"Incomplete triage fields for {package}.")
        documented[package] = severity.lower()

if len(sys.argv) != 2: raise SystemExit(f"Usage: {sys.argv[0]} <npm-audit.json>")
audit = json.load(open(sys.argv[1]))
actual = {name: value["severity"].lower() for name, value in audit.get("vulnerabilities", {}).items()}
if actual != documented:
    print("Dependency audit/triage inventory mismatch.", file=sys.stderr)
    print("audit:", json.dumps(actual, sort_keys=True), file=sys.stderr)
    print("docs: ", json.dumps(documented, sort_keys=True), file=sys.stderr)
    sys.exit(1)
print(f"Dependency triage matches normalized audit inventory ({len(actual)} packages).")
