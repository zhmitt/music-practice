---
description: Start the implementation of a feature following the tasks.md file.
handoffs:
  - label: Post Implementation
    agent: post-implementation
    prompt: Run post-implementation workflow
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load Context**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/tasks.md`
   - Load `.specify/specs/[branch]/spec.md` for acceptance criteria
   - Load `.specify/specs/[branch]/plan.md` for technical context
   - Load `.specify/memory/constitution.md` for compliance

2. **Identify Current State**:
   - Scan tasks.md for uncompleted tasks (unchecked boxes)
   - Identify the current phase
   - Find next task(s) to implement

3. **Implementation Loop**:

   For each task:
   a. Read task description and file path
   b. Check dependencies (previous tasks completed?)
   c. Implement the task following:
      - Constitution principles
      - Technical plan decisions
      - Spec acceptance criteria
   d. Mark task as complete in tasks.md
   e. Update progress.md with implementation notes
   f. Commit changes (if significant)

4. **Phase Checkpoints**:
   - After completing each phase, validate:
     - All tasks in phase completed
     - Tests pass (if applicable)
     - Ready for next phase
   - Update progress.md with checkpoint status

5. **Completion**:
   - When all tasks complete, report:
     - Implementation summary
     - Files created/modified
     - Next steps (post-implementation)

## Implementation Guidelines

### Code Quality
- Follow project conventions
- No hardcoded values
- Proper error handling
- Logging for key operations

### Security
- No secrets in code
- Input validation
- Proper authentication/authorization

### Testing
- Tests for critical paths
- Edge cases covered

### Documentation
- Code comments where needed
- Update working-memory status

## Post-Implementation

After all tasks complete, you MUST:
1. Run `/post-implementation` for:
   - Test execution
   - Documentation updates
   - Completion report
