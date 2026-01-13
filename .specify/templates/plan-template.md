# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary

[Extract from feature spec: primary requirement + technical approach]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. Mark unknowns as NEEDS CLARIFICATION.
-->

**Language/Version**: [e.g., Python 3.11, TypeScript 5.x, or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., FastAPI, React, Express or NEEDS CLARIFICATION]
**Storage**: [if applicable, e.g., PostgreSQL, SQLite, files or N/A]
**Testing**: [e.g., pytest, vitest, jest or NEEDS CLARIFICATION]
**Target Platform**: [e.g., Web, Desktop, Mobile, CLI or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]
**Performance Goals**: [domain-specific or NEEDS CLARIFICATION]
**Constraints**: [domain-specific or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

[Gates determined based on constitution file]

- [ ] Specification-Driven: Spec exists and is complete
- [ ] Security-First: No hardcoded secrets, proper auth
- [ ] Modular: Clear boundaries, explicit dependencies
- [ ] Minimal Dependencies: Each justified
- [ ] Progressive Enhancement: Graceful degradation

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options.
-->

```text
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: [Document the selected structure]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., Extra dependency] | [current need] | [why simpler approach insufficient] |
