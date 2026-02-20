---
description: Execute persona-based UX validation workflow.
---

# /persona-test - Persona Validation

Runs user testing from a specific persona perspective.

## Usage

```bash
/persona-test {persona-name}
```

## Expected Flow

1. Load persona profile from `.claude/personas/`
2. Execute exploratory + scenario-based validation
3. Record usability gaps and assumption mismatches
4. Produce prioritized findings (P0/P1/P2)

## Notes

- Use before release for user-facing features
- Prefer personas defined via `/init-project`

