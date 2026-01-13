# Specify: Tasks

Generate actionable, dependency-ordered task list.

## Workflow

1. **Setup**: Run `.specify/scripts/check-prerequisites.sh --json` → FEATURE_DIR, AVAILABLE_DOCS

2. **Load documents**:
   - **Required**: plan.md (tech stack), spec.md (user stories)
   - **Optional**: data-model.md, contracts/, research.md

3. **Generate tasks**:
   - Extract tech stack, user stories with priorities (P1, P2, P3)
   - Map entities/endpoints to user stories
   - Create dependency graph
   - Validate completeness

4. **Write tasks.md** using `.specify/templates/tasks-template.md`:
   - Phase 1: Setup
   - Phase 2: Foundational (blocking)
   - Phase 3+: Per user story (priority order)
   - Final: Polish & cross-cutting

5. **Report**: path, task count, parallel opportunities, MVP scope

## Task Format (REQUIRED)

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Components**:
- Checkbox: `- [ ]`
- Task ID: T001, T002...
- [P]: Only if parallelizable
- [Story]: Required for user story tasks

**Examples**:
- `- [ ] T001 Create project structure per plan`
- `- [ ] T012 [P] [US1] Create User model in src/models/user.py`

## Organization

1. From User Stories (PRIMARY)
2. From Contracts → map to story
3. From Data Model → map to story
4. Setup/Infrastructure → Setup phase
