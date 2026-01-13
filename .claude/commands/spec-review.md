---
description: Validate specification from persona perspectives.
---

## User Input

```text
$ARGUMENTS
```

## Outline

This command validates a specification by reviewing it from the perspective of different user personas.

1. **Load Context**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load personas from `.claude/personas/` (if they exist)
   - Load `.specify/memory/constitution.md`

2. **Check for Personas**:

   If no personas exist:
   ```markdown
   ## Warning: No Personas Defined

   Run `/init-project` to define user personas for this project.

   Without personas, spec review will use generic perspectives:
   - End User
   - Administrator
   - Developer

   Continue with generic review? [Y/N]
   ```

3. **Persona-Based Review**:

   For each persona, review the spec asking:

   ### Usability
   - Can this persona accomplish their goals?
   - Is the flow intuitive for them?
   - What might confuse them?

   ### Completeness
   - Are all their use cases covered?
   - What edge cases affect them?
   - What's missing for their workflow?

   ### Pain Points
   - What friction points exist?
   - What would frustrate them?
   - What would delight them?

4. **Generate Review Report**:

   ```markdown
   # Spec Review: [Feature]

   **Date**: [date]
   **Reviewers**: [personas used]

   ## Summary
   - P0 Issues: [count]
   - P1 Issues: [count]
   - P2 Suggestions: [count]

   ## Review by Persona

   ### [Persona 1 Name]
   **Role**: [role description]

   **Positives**:
   - [What works well for this persona]

   **Issues**:
   - P0: [Critical issue]
   - P1: [Important issue]

   **Suggestions**:
   - [Improvement idea]

   ### [Persona 2 Name]
   ...

   ## Required Changes (P0)
   Must address before proceeding:
   1. [Issue and fix]

   ## Recommended Changes (P1)
   Should address:
   1. [Issue and fix]

   ## Nice-to-Have (P2)
   Consider for later:
   1. [Suggestion]

   ## Verdict
   [ ] APPROVED - Ready for /speckit.tasks
   [ ] NEEDS REVISION - Address P0 issues first
   ```

5. **Save Review**:
   - Write to `.specify/specs/[branch]/review.md`
   - Update progress.md with review status

6. **Next Steps**:
   - If approved: Ready for `/speckit.tasks`
   - If needs revision: Update spec, re-run review
