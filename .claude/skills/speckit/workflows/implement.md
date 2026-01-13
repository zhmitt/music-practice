# Specify: Implement

Execute implementation following tasks.md.

## Workflow

1. **Load Context**:
   ```bash
   git branch --show-current
   ```
   - Load tasks.md, spec.md, plan.md, constitution.md

2. **Identify State**:
   - Find uncompleted tasks
   - Identify current phase
   - Find next task(s)

3. **Implementation Loop**:

   For each task:
   1. Read task description and file path
   2. Check dependencies (previous tasks done?)
   3. Implement following constitution, plan, spec
   4. Mark task complete in tasks.md
   5. Update progress.md
   6. Commit if significant

4. **Phase Checkpoints**:
   - Validate all tasks in phase complete
   - Tests pass (if applicable)
   - Update progress.md

5. **Completion**:
   - Report: summary, files changed, next steps
   - Run `/post-implementation`

## Guidelines

### Code Quality
- Follow project conventions
- No hardcoded values
- Proper error handling
- Logging for key operations

### Security
- No secrets in code
- Input validation
- Proper auth/authz

### Testing
- Critical paths tested
- Edge cases covered

### Documentation
- Code comments where needed
- Update working-memory
