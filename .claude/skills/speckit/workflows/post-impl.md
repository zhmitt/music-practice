# Specify: Post-Implementation

Orchestrate post-implementation workflow.

## Workflow

1. **Verify Complete**:
   - Load tasks.md, verify all checked off
   - If incomplete: report and stop

2. **Run Tests**:
   ```bash
   # Check for test runner
   pnpm test || npm test || pytest
   ```
   - Passed: Continue
   - Failed: Stop and report

3. **Generate User Tests**: Run `/speckit.usertest`

4. **Update Documentation**:
   - working-memory/status.md
   - NEXT-SESSION.md
   - API docs (if applicable)

5. **Generate Report**:

   ```markdown
   # Post-Implementation Report: [Feature]

   **Branch**: [branch]
   **Date**: [date]

   ## Summary
   - [Task count] tasks completed
   - [File count] files changed
   - [Test count] tests

   ## Test Results
   - Unit: [PASS/FAIL] ([count])
   - Integration: [PASS/FAIL] ([count])

   ## User Tests Generated
   - P0: [count], P1: [count], P2: [count]
   - Location: `.specify/specs/[branch]/usertests.md`

   ## Feature Status
   **Implementation**: COMPLETE
   **User Testing**: PENDING

   ## Next Steps
   1. Review user tests
   2. Execute P0 tests
   3. Deploy to test environment
   ```

6. **Update Working Memory**:
   - Add completion entry to status.md
   - Update NEXT-SESSION.md
   - Mark "Implementation Complete, Pending Testing"

7. **Commit**: `docs: post-implementation report for [feature]`
