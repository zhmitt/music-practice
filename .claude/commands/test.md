---
description: Run automated technical tests with structured reporting.
---

# /test - Run Automated Tests

Runs technical tests (unit/integration/e2e) via the Test Runner Agent.

## Usage

```bash
/test
```

## Expected Flow

1. Detect test framework from project files
2. Execute available test suites
3. Parse pass/fail counts and coverage
4. Return a structured report with blocking failures

## Notes

- Use after implementation and before `/post-implementation`
- Any failing test is a hard blocker

