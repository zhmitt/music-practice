# Specify: Plan

Create technical implementation plan from specification.

## Workflow

1. **Setup**: Run `.specify/scripts/setup-plan.sh --json` → FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH

2. **Load context**: FEATURE_SPEC, `.specify/memory/constitution.md`, IMPL_PLAN template

3. **Execute**:
   - Fill Technical Context (mark unknowns "NEEDS CLARIFICATION")
   - Fill Constitution Check
   - Evaluate gates (ERROR if violations)
   - Phase 0: Generate research.md
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Re-evaluate Constitution Check

4. **Report**: branch, IMPL_PLAN path, artifacts

## Phases

### Phase 0: Research

For each NEEDS CLARIFICATION → research task

**Output**: `research.md` with decisions, rationale, alternatives

### Phase 1: Design

**Prerequisites**: research.md complete

1. **data-model.md**: entities, fields, relationships, validation
2. **contracts/**: API endpoints from requirements
3. **quickstart.md**: how to run, test scenarios

## Rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
