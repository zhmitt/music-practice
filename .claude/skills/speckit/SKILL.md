# SpecKit Skill

Spec-Driven Development workflow for feature implementation.

## Auto-Trigger Keywords

- "implement feature", "neue feature", "add feature"
- "create spec", "write specification"
- "plan implementation", "technical plan"

## Entry Point

Run `/specify` to detect current phase and get next action.

## Workflow Phases

```
Phase 0: No Spec      → /speckit.specify "{description}"
Phase 1: Spec Only    → /speckit.plan
Phase 2: Planned      → /spec-review (persona validation)
Phase 3: Reviewed     → /speckit.tasks
Phase 4: Tasked       → /speckit.implement
Phase 5: Implemented  → /post-implementation
Phase 6: Tested       → Feature complete!
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `/specify` | Detect phase, guide next step |
| `/speckit.specify "{desc}"` | Create specification |
| `/speckit.plan` | Create technical plan |
| `/speckit.tasks` | Generate task list |
| `/speckit.implement` | Execute implementation |
| `/speckit.clarify` | Clarify spec requirements |
| `/speckit.analyze` | Consistency analysis |
| `/speckit.checklist` | Implementation checklist |
| `/speckit.constitution` | Constitution compliance |
| `/speckit.usertest` | Generate user tests |
| `/spec-review` | Persona-based review |
| `/post-implementation` | Post-impl workflow |

## Core Principle

**NO code without spec** (unless < 20 lines bug fix)

## Resources

- Templates: `.specify/templates/`
- Specs: `.specify/specs/{feature-id}/`
- Constitution: `.specify/memory/constitution.md`
