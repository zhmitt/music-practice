# Specify (Main Orchestrator)

Detects current phase and guides next action.

## Workflow

1. **Detect State**:
   ```bash
   git branch --show-current
   ```
   Check for: spec.md, plan.md, tasks.md, implementation

2. **Determine Phase**:

   | State | Phase | Next Action |
   |-------|-------|-------------|
   | No spec | 0 | `/speckit.specify "{description}"` |
   | Spec only | 1 | `/speckit.plan` |
   | Spec + Plan | 2 | `/spec-review` or `/speckit.tasks` |
   | Spec + Plan + Tasks | 3 | `/speckit.implement` |
   | Implementation complete | 4 | `/post-implementation` |
   | Tests generated | 5 | Execute user tests |
   | All complete | 6 | Feature done! |

3. **Validate Compliance**: Constitution, working memory, progress

4. **Report Status**:
   ```markdown
   ## Current Status
   **Branch**: [branch]
   **Phase**: [N] - [Phase Name]
   **Compliance**: OK/WARN

   ## Documents
   - Spec: [exists/missing]
   - Plan: [exists/missing]
   - Tasks: [exists/missing]

   ## Next Step
   [Recommended command]
   ```

## Session Protocol

**Start**: Run `/specify` to check state, load context, get next action
**End**: Run `/specify` to validate updates, document next steps
