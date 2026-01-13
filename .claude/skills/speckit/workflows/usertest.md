# Specify: User Tests

Generate user test suites for completed feature.

## Workflow

1. **Load**: spec.md, tasks.md, identify completed user stories

2. **Generate Test Suites**:

   ### P0: Critical Path (Must Pass)
   - Core functionality
   - Happy path scenarios
   - Essential user journeys

   ### P1: Important (Should Pass)
   - Edge cases
   - Error handling
   - Alternative flows

   ### P2: Nice-to-Have (Good to Pass)
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

   **Steps**:
   1. [Action 1]
   2. [Action 2]

   **Expected Result**:
   - [Expected outcome]

   **Actual Result**: [ ] PASS / [ ] FAIL
   ```

4. **Save**: `.specify/specs/[branch]/usertests.md`

5. **Update Tracking**: Add to `working-memory/pending-usertests.md`
   - Feature name
   - Test count by priority
   - Estimated time
   - Link to test file

6. **Report**: location, counts (P0/P1/P2), estimated time
