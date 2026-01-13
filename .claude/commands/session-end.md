---
description: Clean session end with context persistence and cleanup guidance.
---

## User Input

```text
$ARGUMENTS
```

## Outline

This command ensures proper session closure with context preserved for the next session.

1. **Verify Current State**:
   - Read current branch: `git branch --show-current`
   - Check `git status` for uncommitted changes
   - Load current feature progress

2. **Check for Uncommitted Work**:

   If uncommitted changes exist:
   ```markdown
   ## Warning: Uncommitted Changes

   The following files have uncommitted changes:
   - [file1]
   - [file2]

   **Options**:
   1. Commit now with message: "[suggested message]"
   2. Stash changes for later
   3. Continue without committing (not recommended)
   ```

3. **Update Progress**:
   - Load `.specify/specs/[branch]/progress.md`
   - Add session summary entry:

   ```markdown
   ### [DATE] - Session End

   **Completed**:
   - [Task/item completed]
   - [Task/item completed]

   **In Progress**:
   - [Task that was started but not finished]

   **Blockers**:
   - [Any blockers encountered]

   **Next Session**:
   - [What to do next]
   ```

4. **Update NEXT-SESSION.md**:
   - Update `.specify/memory/NEXT-SESSION.md`
   - Set current feature status
   - Document quick-start for next session

5. **Working Memory Sync**:
   - Update `working-memory/status.md` if exists
   - Ensure all decisions documented
   - Check for any open questions

6. **Generate Session Summary**:

   ```markdown
   # Session End Summary

   **Date**: [date]
   **Branch**: [branch]
   **Duration**: [if trackable]

   ## Work Completed
   - [Summary of what was done]

   ## Current State
   - **Phase**: [current phase]
   - **Progress**: [X]% complete
   - **Next Task**: [next task description]

   ## Files Modified
   - [list of changed files]

   ## Context for Next Session

   **Quick Start**:
   ```bash
   git checkout [branch]
   cat .specify/memory/NEXT-SESSION.md
   /specify
   ```

   **Continue With**:
   [Specific next action]

   ## Reminders
   - [Any important notes for next session]
   ```

7. **Final Commit**:
   - Stage documentation updates
   - Commit: `docs: session end - [brief summary]`

8. **Cleanup Suggestions**:
   - Close any open files
   - Note any background processes to stop
   - Remind about any pending reviews
