# Specify: Spec Review

Validate specification from persona perspectives.

## Workflow

1. **Load**: spec.md, personas from `.claude/personas/`, constitution.md

2. **Check Personas**:
   - If none: Use generic (End User, Administrator, Developer)
   - Offer to run `/init-project` for custom personas

3. **Persona-Based Review**:

   For each persona:

   ### Usability
   - Can they accomplish goals?
   - Is flow intuitive?
   - What might confuse them?

   ### Completeness
   - All use cases covered?
   - What edge cases affect them?
   - What's missing for their workflow?

   ### Pain Points
   - What friction exists?
   - What would frustrate them?
   - What would delight them?

4. **Generate Report**:

   ```markdown
   # Spec Review: [Feature]

   **Date**: [date]
   **Reviewers**: [personas]

   ## Summary
   - P0 Issues: [count]
   - P1 Issues: [count]
   - P2 Suggestions: [count]

   ## Review by Persona

   ### [Persona Name]
   **Role**: [description]

   **Positives**: [What works]
   **Issues**: P0: [Critical], P1: [Important]
   **Suggestions**: [Ideas]

   ## Required Changes (P0)
   1. [Issue and fix]

   ## Recommended Changes (P1)
   1. [Issue and fix]

   ## Verdict
   [ ] APPROVED - Ready for /speckit.tasks
   [ ] NEEDS REVISION - Address P0 first
   ```

5. **Save**: `.specify/specs/[branch]/review.md`

6. **Next**:
   - Approved: `/speckit.tasks`
   - Needs revision: Update spec, re-run
