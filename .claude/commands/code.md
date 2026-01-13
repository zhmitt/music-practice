---
description: Delegate coding task to Developer Agent (Coding Agent)
---

# /code - Delegate Coding Task to Developer Agent

Spawns a Coding Agent (Developer) to implement a specific, well-scoped coding task.

**Pattern**: Tech Lead (Main Agent) → Developer (Coding Agent)

## Usage

```bash
/code {task_description}
```

## Examples

```bash
# Implement new method
/code "Add login() method to user-service.ts per spec"

# Fix bug
/code "Fix validation error in email field - should accept + characters"

# Add tests
/code "Add unit tests for UserService.create()"

# Refactor
/code "Extract validation logic into separate validator class"
```

## What You (Tech Lead) Provide

**Before invoking, prepare**:
- ✅ Clear task description
- ✅ Files to modify/create/read
- ✅ Acceptance criteria (checklist)
- ✅ Context (spec file, related code)
- ✅ Constraints (patterns to follow, dependencies)

**Recommended format**:
```yaml
Task: {clear description}
Type: feature | bug-fix | refactor | test
Priority: P0 | P1 | P2

Files:
  to_modify: [list]
  to_create: [list]
  to_read: [list for context]

Acceptance_Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2

Context:
  spec_file: {path to spec}
  related_code: {where to find patterns}

Constraints:
  - Use existing Config class
  - Error handling: Throw SpecificError
  - Timeout: 30s
```

## What Developer Agent Delivers

- ✅ Implemented feature/fix
- ✅ Unit tests (>90% coverage)
- ✅ Documentation
- ✅ Type safety
- ✅ Self-reviewed code
- ✅ Completion report

## After Developer Reports Completion

**Your (Tech Lead) responsibilities**:
1. Review code changes
2. Run integration tests
3. Commit changes (or request revisions)
4. Update working-memory
5. Continue with next task

## When to Use

- ✅ Clear, focused coding task (<500 lines)
- ✅ Task has well-defined acceptance criteria
- ✅ Architecture decisions already made
- ✅ Want to offload implementation details

## When NOT to Use

- ❌ Exploratory work → Use Explore agent
- ❌ Architecture decisions → You (Tech Lead) decide first
- ❌ Spec creation → Use /specify
- ❌ Deployment → Use deployment workflow
- ❌ Vague requirements → Clarify first

## Scope Guidelines

**Developer handles**:
- Implementation
- Unit tests
- Documentation
- Error handling
- Type safety

**You (Tech Lead) handle**:
- Architecture
- Spec changes
- Working-memory
- Git commits
- Integration
- Deployment

## Benefits

**For you (Tech Lead)**:
- Focus on high-level planning
- No context switching
- Spawn multiple agents in parallel
- Maintain quality oversight

**For project**:
- Faster implementation
- Better code quality
- Consistent documentation
- Clear separation of concerns

## Example Flow

```
You (Tech Lead):
  ├─ Plan feature → Break into 3 tasks
  ├─ /code "Task 1: Add Auth service"
  │   └─ Developer implements, tests, reports
  ├─ Review Task 1 → Commit
  ├─ /code "Task 2: Add User login"
  │   └─ Developer implements, tests, reports
  ├─ Review Task 2 → Commit
  └─ /code "Task 3: Integration tests"
      └─ Developer implements, tests, reports

  Final: Review all, update working-memory, deploy
```

## See Also

- `.claude/agents/coding-agent.md` - Full agent documentation
- `CLAUDE.md` - Workflow guidelines
