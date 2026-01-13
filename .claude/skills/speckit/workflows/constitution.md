# Specify: Constitution

Review constitution compliance for feature.

## Workflow

1. **Load**: `.specify/memory/constitution.md`, spec.md, plan.md

2. **Compliance Check**:

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

3. **Generate Report**:

   ```markdown
   # Constitution Compliance Report

   **Feature**: [branch]

   | Principle | Status | Notes |
   |-----------|--------|-------|
   | Spec-Driven | OK/WARN/FAIL | [details] |
   | Security-First | OK/WARN/FAIL | [details] |
   | ... | ... | ... |

   ## Violations (Must Fix)
   - [Violation]: [How to fix]

   ## Next Steps
   [Actions needed]
   ```

4. **Update**: Document in progress.md
