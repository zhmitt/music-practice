---
description: Systematic bug diagnosis via root cause investigation before fixing
---

# /debug - Systematic Bug Diagnosis

Spawns a Debugging Agent for structured root cause investigation. The agent diagnoses but does NOT fix — it returns a report that you (Tech Lead) use to delegate the fix via `/code`.

**Pattern**: Tech Lead → Debugging Agent (diagnosis) → Tech Lead → Coding Agent (fix)

## Usage

```bash
/debug "{bug description}"
```

## Examples

```bash
# With error message
/debug "Login returns 401 even with valid credentials since yesterday's deploy"

# With reproduction steps
/debug "Cart total shows NaN when applying discount code SUMMER2026"

# With stack trace reference
/debug "TypeError in user-service.ts:142 — Cannot read property 'email' of undefined"
```

## What You (Tech Lead) Provide

- Bug description (what happens vs. what should happen)
- Error logs or stack traces (if available)
- Reproduction steps (if known)
- When it started (if known) — helps narrow `git log` search

## What Debugging Agent Delivers

- Diagnosis report with:
  - Confirmed reproduction steps
  - Root cause identification with evidence
  - Affected files and components
  - Recommended fix approach
  - Test to add (that would have caught this)
- If 3+ fix attempts failed: Architectural concern flagged

## After Diagnosis

```
/debug "bug description"
  ↓
Debugging Agent returns diagnosis report
  ↓
You (Tech Lead) review diagnosis
  ↓
/code "Fix {root cause} in {files} — see diagnosis: {summary}"
  ↓
Coding Agent implements fix with test
  ↓
/review --auto (verify fix)
```

## When to Use

- Bug requires investigation (not obvious from error message)
- Previous fix attempts failed
- Bug spans multiple components
- Root cause is unclear

## When NOT to Use

- Obvious typo/syntax error → fix directly
- Error message tells you exactly what's wrong → `/code` directly
- Configuration issue → fix config directly
- Known bug with known fix → `/code` directly

## See Also

- `.claude/agents/debugging-agent.md` - Full agent documentation
- `/code` - For implementing the fix after diagnosis
- `/review --auto` - For verifying the fix
