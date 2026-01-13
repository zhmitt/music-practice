# Specify: Analyze

Check consistency between spec, plan, and implementation.

## Workflow

1. **Load**: spec.md, plan.md, tasks.md, constitution.md

2. **Consistency Checks**:

   ### Spec vs Plan
   - All user stories mapped to components?
   - All requirements addressed?
   - No orphaned decisions?

   ### Plan vs Tasks
   - All components have tasks?
   - Dependencies match structure?
   - No missing steps?

   ### Tasks vs Implementation
   - Completed tasks have code?
   - File paths exist?
   - Features match tasks?

   ### Constitution Compliance
   - Security principles followed?
   - Modular architecture maintained?
   - Documentation up to date?

3. **Generate Report**:

   ```markdown
   # Consistency Analysis Report

   **Branch**: [branch]
   **Date**: [date]

   ## Summary
   - Total checks: [N]
   - Passed: [N]
   - Warnings: [N]
   - Errors: [N]

   ## Errors (Must Fix)
   - [Issue]: [Description] - [Location]

   ## Warnings (Should Review)
   - [Warning]: [Description]

   ## Recommendations
   1. [Action item]
   ```

4. **Save**: `.specify/specs/[branch]/analysis.md`

5. **Next**:
   - Errors: Fix before proceeding
   - Warnings: Review and proceed
   - All passed: Ready for next phase
