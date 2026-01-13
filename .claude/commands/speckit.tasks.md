---
description: Generate an actionable, dependency-ordered tasks.md for the feature.
handoffs:
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list.

2. **Load design documents** from FEATURE_DIR:
   - **Required**: plan.md (tech stack, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md, contracts/, research.md, quickstart.md

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with priorities (P1, P2, P3)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - Generate tasks organized by user story
   - Generate dependency graph
   - Create parallel execution examples
   - Validate task completeness

4. **Generate tasks.md** using `.specify/templates/tasks-template.md`:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks
   - Phase 2: Foundational tasks (blocking prerequisites)
   - Phase 3+: One phase per user story (in priority order)
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow checklist format
   - Clear file paths for each task

5. **Report**: Output path to tasks.md and summary:
   - Total task count
   - Task count per user story
   - Parallel opportunities
   - Suggested MVP scope

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story for independent implementation.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:
1. **Checkbox**: ALWAYS start with `- [ ]`
2. **Task ID**: Sequential number (T001, T002...)
3. **[P] marker**: Include ONLY if parallelizable
4. **[Story] label**: REQUIRED for user story phase tasks only
5. **Description**: Clear action with exact file path

**Examples**:
- CORRECT: `- [ ] T001 Create project structure per implementation plan`
- CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- WRONG: `- [ ] Create User model` (missing ID and Story label)
- WRONG: `T001 [US1] Create model` (missing checkbox)

### Task Organization

1. **From User Stories** - PRIMARY ORGANIZATION
2. **From Contracts** - Map to serving user story
3. **From Data Model** - Map entities to stories
4. **From Setup/Infrastructure** - Setup and Foundational phases
