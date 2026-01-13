# Specify: Clarify

Identify ambiguities and generate clarification questions.

## Workflow

1. **Load**: spec.md, constitution.md

2. **Analyze**:
   - Scan for `[NEEDS CLARIFICATION]` markers
   - Identify implicit assumptions
   - Find ambiguous requirements
   - Check missing edge cases

3. **Generate Questions** (max 5):

   ```markdown
   ## Question [N]: [Topic]

   **Context**: [Quote relevant spec section]
   **What we need to know**: [Specific question]

   **Suggested Answers**:
   | Option | Answer | Implications |
   |--------|--------|--------------|
   | A | [Option 1] | [What this means] |
   | B | [Option 2] | [What this means] |
   | C | [Option 3] | [What this means] |

   **Your choice**: _[Wait for response]_
   ```

4. **Prioritize**: scope > security > UX > technical

5. **Update spec.md** after receiving answers

## Clarify

- Feature scope boundaries
- User types and permissions
- Data retention
- Security requirements
- Integration points

## Use Defaults For

- Standard error handling
- Common UX patterns
- Industry-standard practices
- Technical implementation details
