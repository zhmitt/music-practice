---
description: Create or update the feature specification from a natural language feature description.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckit.specify` is the feature description.

Given that feature description:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract meaningful keywords
   - Create a 2-4 word short name that captures the essence
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Create a dashboard for analytics" → "analytics-dashboard"

2. **Check for existing branches before creating new one**:

   a. Fetch all remote branches:
      ```bash
      git fetch --all --prune
      ```

   b. Find the highest feature number across all sources:
      - Remote branches: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - Local branches: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - Specs directories: Check for directories matching `specs/[0-9]+-<short-name>`

   c. Determine the next available number (N+1)

   d. Run the script:
      ```bash
      .specify/scripts/create-new-feature.sh --json --number N+1 --short-name "your-short-name" "Feature description"
      ```

3. Load `.specify/templates/spec-template.md` to understand required sections.

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope
         - Multiple reasonable interpretations exist
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
    4. Fill User Scenarios & Testing section
    5. Generate Functional Requirements (each must be testable)
    6. Define Success Criteria (measurable, technology-agnostic)
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

5. Write the specification to SPEC_FILE using the template structure.

6. **Specification Quality Validation**: After writing, validate against checklist.

7. Report completion with branch name, spec file path, and readiness for next phase.

## Guidelines

### Quick Guidelines

- Focus on **WHAT** users need and **WHY**
- Avoid HOW to implement (no tech stack, APIs, code structure)
- Written for business stakeholders, not developers

### Success Criteria Guidelines

Success criteria must be:
1. **Measurable**: Include specific metrics
2. **Technology-agnostic**: No frameworks, languages, databases
3. **User-focused**: Outcomes from user/business perspective
4. **Verifiable**: Can be tested without knowing implementation

**Good examples**:
- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"

**Bad examples**:
- "API response time is under 200ms" (too technical)
- "React components render efficiently" (framework-specific)
