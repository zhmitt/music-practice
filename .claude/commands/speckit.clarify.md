---
description: Identify ambiguous areas in a specification and generate targeted clarification questions.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load Context**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load `.specify/memory/constitution.md` for validation

2. **Analyze Specification**:
   - Scan for [NEEDS CLARIFICATION] markers
   - Identify implicit assumptions
   - Find ambiguous requirements
   - Check for missing edge cases
   - Validate completeness against template

3. **Generate Clarification Questions**:

   For each ambiguity found, generate:

   ```markdown
   ## Question [N]: [Topic]

   **Context**: [Quote relevant spec section]

   **What we need to know**: [Specific question]

   **Suggested Answers**:

   | Option | Answer | Implications |
   |--------|--------|--------------|
   | A      | [First option] | [What this means] |
   | B      | [Second option] | [What this means] |
   | C      | [Third option] | [What this means] |
   | Custom | Your own answer | [How to provide] |

   **Your choice**: _[Wait for user response]_
   ```

4. **Prioritize Questions**:
   - Maximum 5 targeted questions
   - Priority order: scope > security > user experience > technical
   - Skip questions with reasonable defaults

5. **Update Specification**:
   - After receiving answers, update spec.md
   - Remove [NEEDS CLARIFICATION] markers
   - Document assumptions made

6. **Report**:
   - Summary of clarifications resolved
   - Any remaining ambiguities
   - Readiness for planning phase

## Guidelines

### What to Clarify

- Feature scope boundaries
- User types and permissions
- Data retention requirements
- Security requirements
- Integration points

### What NOT to Clarify (Use Defaults)

- Standard error handling approaches
- Common UX patterns
- Industry-standard practices
- Technical implementation details
