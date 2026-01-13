# Specify: Create Specification

Create feature specification from natural language description.

## Input

Feature description from user (after `/speckit.specify`).

## Workflow

1. **Generate short name** (2-4 words, action-noun format)
   - "add user authentication" → "user-auth"

2. **Check for existing branches**:
   ```bash
   git fetch --all --prune
   git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'
   ```

3. **Create feature**:
   ```bash
   .specify/scripts/create-new-feature.sh --json --number N+1 --short-name "name" "Description"
   ```

4. **Load template**: `.specify/templates/spec-template.md`

5. **Execute**:
   - Parse description, extract: actors, actions, data, constraints
   - For unclear aspects: mark `[NEEDS CLARIFICATION: question]` (max 3)
   - Fill User Scenarios, Functional Requirements, Success Criteria
   - Write to SPEC_FILE

6. **Validate** against template checklist

7. **Report**: branch name, spec path, readiness

## Guidelines

- Focus on **WHAT** users need and **WHY**
- Avoid HOW (no tech stack, APIs, code structure)
- Written for business stakeholders

**Success Criteria**:
- Measurable (specific metrics)
- Technology-agnostic
- User-focused
- Verifiable

**Good**: "Users can complete checkout in under 3 minutes"
**Bad**: "API response time is under 200ms"
