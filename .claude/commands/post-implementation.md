---
description: Post-implementation orchestration - tests, docs, report.
---

## User Input

```text
$ARGUMENTS
```

## Outline

This command orchestrates the post-implementation workflow after all tasks are complete.

1. **Verify Implementation Complete**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/tasks.md`
   - Verify all tasks checked off
   - If incomplete tasks exist, report and stop

2. **Run Tests** (if configured):

   Check for test configuration and run:
   ```bash
   # Check for test runner
   if [ -f "package.json" ]; then
       pnpm test || npm test
   elif [ -f "pyproject.toml" ]; then
       pytest
   fi
   ```

   Report results:
   - Tests passed: Continue
   - Tests failed: Stop and report issues

3. **Generate User Tests**:
   - Run `/speckit.usertest` internally
   - Generate P0/P1/P2 test suites
   - Add to pending usertests

4. **Update Documentation**:

   Based on what changed:
   - Update .specify/memory/status.md
   - Update NEXT-SESSION.md
   - Update any API documentation

5. **Generate Completion Report**:

   ```markdown
   # Post-Implementation Report: [Feature]

   **Branch**: [branch]
   **Date**: [date]

   ## Implementation Summary

   ### Completed
   - [Task count] tasks completed
   - [File count] files created/modified
   - [Test count] tests (if applicable)

   ### Files Changed
   - `path/to/file1.ts` - [description]
   - `path/to/file2.ts` - [description]

   ## Test Results

   ### Automated Tests
   - Unit: [PASS/FAIL] ([count] tests)
   - Integration: [PASS/FAIL] ([count] tests)

   ### User Tests Generated
   - P0 (Critical): [count] tests
   - P1 (Important): [count] tests
   - P2 (Nice-to-have): [count] tests
   - Location: `.specify/specs/[branch]/usertests.md`

   ## Documentation Updated
   - [ ] .specify/memory/status.md
   - [ ] NEXT-SESSION.md
   - [ ] API docs (if applicable)

   ## Feature Status

   **Implementation**: COMPLETE
   **User Testing**: PENDING

   ## Next Steps for User

   1. Review user tests at `.specify/specs/[branch]/usertests.md`
   2. Execute P0 tests manually
   3. Execute P1 tests if time permits
   4. Report any failures as issues
   5. Deploy to test environment
   ```

6. **Update Working Memory**:
   - Add completion entry to status.md
   - Update NEXT-SESSION.md with new state
   - Mark feature as "Implementation Complete, Pending Testing"

7. **Commit Report**:
   - Stage all documentation changes
   - Commit with message: `docs: post-implementation report for [feature]`
