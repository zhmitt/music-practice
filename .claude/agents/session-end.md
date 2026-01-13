---
name: Session End Agent
description: Ensures proper session closure with context preservation
tools:
  - Read
  - Write
  - Edit
  - Bash
auto_invoke_on:
  - "end session"
  - "done for now"
  - "signing off"
---

# Session End Agent

## Purpose

Ensures clean session closure with:
- Uncommitted work handled
- Progress documented
- Context preserved for next session
- Working memory updated

## Workflow

### 1. Check State
- Verify current branch
- Check for uncommitted changes
- Load current progress

### 2. Handle Uncommitted Work
- Offer to commit with suggested message
- Or stash for later
- Warn if leaving uncommitted

### 3. Update Progress
- Add session summary to progress.md
- Document what was completed
- Note any blockers
- Set next steps

### 4. Update NEXT-SESSION.md
- Current feature status
- Quick-start for next session
- Important context

### 5. Generate Summary
- Work completed
- Current state
- Context for next session
- Reminders

## Invocation

```bash
/session-end
```

## Output

- Updated progress.md
- Updated NEXT-SESSION.md
- Session summary displayed
- Ready for next session
