---
description: Review and validate constitution compliance for a feature.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load Constitution**:
   - Read `.specify/memory/constitution.md`
   - Parse all principles and requirements

2. **Load Feature Documents**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load `.specify/specs/[branch]/plan.md` (if exists)
   - Scan implementation files (if any)

3. **Compliance Check**:

   For each constitution principle:

   ### I. Specification-Driven Development
   - [ ] Spec exists before code
   - [ ] Spec defines what/why, not how
   - [ ] User stories prioritized

   ### II. Security-First Development
   - [ ] No hardcoded secrets
   - [ ] Auth mechanisms defined
   - [ ] Data protection considered

   ### III. Modular Architecture
   - [ ] Clear boundaries
   - [ ] Explicit dependencies
   - [ ] Independently testable

   ### IV. Working Memory & Session Continuity
   - [ ] Progress tracked
   - [ ] Decisions documented
   - [ ] Session protocol followed

   ### V. Test-Driven Development
   - [ ] Critical paths have tests
   - [ ] Tests validate behavior

   ### VI. Minimal Dependencies
   - [ ] Each dependency justified
   - [ ] Alternatives considered

   ### VII. Progressive Enhancement
   - [ ] Graceful degradation
   - [ ] Feature detection used

4. **Generate Report**:

   ```markdown
   # Constitution Compliance Report

   **Feature**: [branch]
   **Date**: [date]

   ## Compliance Summary

   | Principle | Status | Notes |
   |-----------|--------|-------|
   | Spec-Driven | OK/WARN/FAIL | [details] |
   | Security-First | OK/WARN/FAIL | [details] |
   | Modular | OK/WARN/FAIL | [details] |
   | Working Memory | OK/WARN/FAIL | [details] |
   | Test-Driven | OK/WARN/FAIL | [details] |
   | Minimal Deps | OK/WARN/FAIL | [details] |
   | Progressive | OK/WARN/FAIL | [details] |

   ## Violations

   ### Must Fix
   - [Violation 1]: [How to fix]

   ### Should Address
   - [Issue 1]: [Recommendation]

   ## Next Steps
   [Actions needed before proceeding]
   ```

5. **Update Progress**:
   - Document compliance check in progress.md
   - Note any violations and their resolution
