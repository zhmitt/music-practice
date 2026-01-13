---
description: Generate user test suites for a completed feature.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load Feature Documents**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load `.specify/specs/[branch]/tasks.md`
   - Identify completed user stories

2. **Generate Test Suites**:

   For each user story, create test scenarios:

   ### P0: Critical Path Tests (Must Pass)
   - Core functionality
   - Happy path scenarios
   - Essential user journeys

   ### P1: Important Tests (Should Pass)
   - Edge cases
   - Error handling
   - Alternative flows

   ### P2: Nice-to-Have Tests (Good to Pass)
   - Performance
   - UX polish
   - Minor edge cases

3. **Test Format**:

   ```markdown
   ## Test: [Test Name]

   **Priority**: P0/P1/P2
   **User Story**: US[N]

   **Preconditions**:
   - [Setup step 1]
   - [Setup step 2]

   **Steps**:
   1. [Action 1]
   2. [Action 2]
   3. [Action 3]

   **Expected Result**:
   - [Expected outcome 1]
   - [Expected outcome 2]

   **Actual Result**: [ ] PASS / [ ] FAIL

   **Notes**:
   ```

4. **Save Test Suite**:
   - Write to `.specify/specs/[branch]/usertests.md`
   - Organize by priority (P0, P1, P2)
   - Include time estimates

5. **Update Tracking**:
   - Add entry to `working-memory/pending-usertests.md`
   - Include:
     - Feature name
     - Test count by priority
     - Estimated time
     - Link to test file

6. **Report**:
   - Test suite location
   - Test counts (P0, P1, P2)
   - Estimated execution time
   - Next steps for user
