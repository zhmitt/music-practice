---
description: Run project analysis for consistency between spec, plan, and implementation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load All Documents**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load `.specify/specs/[branch]/plan.md`
   - Load `.specify/specs/[branch]/tasks.md`
   - Load `.specify/memory/constitution.md`

2. **Consistency Checks**:

   ### Spec vs Plan
   - All user stories mapped to technical components?
   - All requirements addressed in plan?
   - No orphaned technical decisions?

   ### Plan vs Tasks
   - All planned components have tasks?
   - Task dependencies match plan structure?
   - No missing implementation steps?

   ### Tasks vs Implementation
   - Check completed tasks against actual code
   - Verify file paths exist
   - Validate implemented features match tasks

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

   ## Findings

   ### Errors (Must Fix)
   - [Issue 1]: [Description] - [Location]

   ### Warnings (Should Review)
   - [Warning 1]: [Description] - [Location]

   ### Passed Checks
   - [Check 1]: OK
   - [Check 2]: OK

   ## Recommendations
   1. [Action item 1]
   2. [Action item 2]
   ```

4. **Save Report**:
   - Write to `.specify/specs/[branch]/analysis.md`
   - Update progress.md with analysis results

5. **Next Steps**:
   - If errors: Must fix before proceeding
   - If warnings only: Review and proceed
   - If all passed: Ready for next phase
