---
description: Main workflow orchestrator - detects phase, validates compliance, guides next steps.
---

## User Input

```text
$ARGUMENTS
```

## Outline

This is the main workflow command that orchestrates the spec-driven development process.

1. **Detect Current State**:

   ```bash
   git branch --show-current
   ```

   Check what exists:
   - Is there a spec? `.specify/specs/[branch]/spec.md`
   - Is there a plan? `.specify/specs/[branch]/plan.md`
   - Is there tasks? `.specify/specs/[branch]/tasks.md`
   - Is there implementation? Check for source files

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

3. **Validate Compliance**:

   - Constitution alignment
   - Working memory up to date
   - Progress documented
   - Session protocol followed

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
   - Implementation: [status]

   ## Next Step
   [Recommended command to run]

   ## Warnings
   [Any compliance issues to address]
   ```

5. **Guide Next Action**:
   - Provide the exact command to run
   - Explain what it will do
   - Note any prerequisites

## Session Protocol

### At Session Start

Run `/specify` to:
1. Check current branch
2. Load working memory context
3. Identify where you left off
4. Get next action recommendation

### At Session End

Run `/specify` to:
1. Validate all updates complete
2. Check working memory current
3. Document next steps
4. Prepare for next session
