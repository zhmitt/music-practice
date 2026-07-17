#!/usr/bin/env python3
from pathlib import Path
import os, re, sys
root=Path(os.environ.get("OPENSPEC_GUARD_ROOT", Path(__file__).resolve().parents[2]))
cid=sys.argv[1] if len(sys.argv)==2 else ""
if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*",cid): raise SystemExit("Invalid archive change id")
d=root/"openspec/changes/archive"/cid
tasks=(d/"tasks.md").read_text(); verification=(d/"verification.md").read_text()
if not re.search(r"(?m)^- \[x\] .{10,}$",tasks) or re.search(r"(?m)^- \[ \]",tasks): raise SystemExit("Archive tasks are not completely evidenced")
for heading in ("## Automated checks","## Notes"):
    if heading not in verification: raise SystemExit(f"Archive verification missing {heading}")
if not re.search(r"(?m)exit 0|passed|PASS",verification,re.I): raise SystemExit("Archive verification lacks passing evidence")
reports=[]
for p in (root/"workflow/state/reports").glob("*.md"):
    if re.search(rf"(?m)^# Report: {re.escape(cid)}\s*$",p.read_text()): reports.append(p)
if len(reports)!=1: raise SystemExit(f"Expected exactly one identity-matched report, found {len(reports)}")
report=reports[0].read_text()
if "## Evidence" not in report or not re.search(r"(?m)exit 0|passed|PASS",report,re.I): raise SystemExit("Archive report lacks structured passing evidence")
print(f"Structured archive evidence passed: {cid}")
