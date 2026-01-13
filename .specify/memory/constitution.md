# Project Constitution - {{PROJECT_NAME}}

## Core Principles

### I. Specification-Driven Development

**All features begin with specifications, not code.**

- Specifications define the "what" and "why" before "how"
- Features tracked in `.specify/specs/[###-feature-name]/`
- Specifications become executable through plans and tasks
- Code serves specifications, not the other way around
- Intent-driven development: natural language captures requirements

**Application**: Every feature starts with `/speckit.specify`

### II. Security-First Development

**Security is non-negotiable and built-in from the start.**

- **Authentication**: Proper auth mechanisms required
- **Secrets**: Never hardcoded, always environment variables
- **Dependencies**: Minimal, trusted, regularly audited
- **Data Protection**: Sensitive data encrypted or permission-restricted

**Application**: All external integrations follow security principles

### III. Modular Architecture

**Every module is self-contained and well-documented.**

- Modules have clear boundaries and responsibilities
- Each module exposes clear interfaces
- Inter-module dependencies explicitly documented
- Modules independently testable

**Application**: Code organized by feature/domain, not by layer

### IV. Working Memory & Session Continuity

**Knowledge persists across sessions through structured documentation.**

- **Constitution** (.specify/memory/constitution.md): Project principles
- **Specifications** (.specify/specs/): Feature requirements and plans
- **Working Memory** (working-memory/): Session logs and decisions
- **Git Commits**: Implementation history with meaningful messages

**Session Start Protocol**:
1. Read NEXT-SESSION.md for context
2. Read relevant feature spec for current work
3. Check git log for recent changes

### V. Test-Driven Development

**Tests validate behavior, not implementation details.**

- Test the "what", not the "how"
- Focus on user-facing behavior
- Tests serve as living documentation
- Coverage targets based on risk, not arbitrary numbers

**Application**: Critical paths require tests

### VI. Minimal Dependencies

**Reduce supply chain risk, avoid complexity.**

- Evaluate necessity before adding dependencies
- Prefer standard library when possible
- Document why each dependency is necessary
- Regular security updates

**Application**: New dependencies require justification

### VII. Progressive Enhancement

**Features enhance when available, degrade gracefully when absent.**

- Feature detection before use
- Fallbacks for critical functionality
- Informative error messages
- No silent failures

**Application**: System works with minimal configuration

## Development Workflow

### Feature Development Process

**1. Specify** (`/speckit.specify`)
- Create feature specification with user stories
- Define acceptance criteria
- Identify edge cases

**2. Clarify** (`/speckit.clarify`)
- Address ambiguities before planning
- Document assumptions and constraints

**3. Plan** (`/speckit.plan`)
- Technical architecture
- Data models and API contracts
- Research findings

**4. Tasks** (`/speckit.tasks`)
- Executable task breakdown
- Dependency management
- Parallelization opportunities

**5. Implement** (`/speckit.implement`)
- Follow the plan
- Validate against spec
- Update progress

### Git Workflow

- **Branches**: Feature branches from `main` (e.g., `001-feature-name`)
- **Commits**: Meaningful messages with story references
- **Pull Requests**: Required for all features

### Quality Gates

**Before Merge**:
- [ ] Tests pass
- [ ] Constitution compliance verified
- [ ] Documentation updated
- [ ] No hardcoded secrets

## Governance

### Constitution Authority

- **Supersedes**: All other documentation when in conflict
- **Amendments**: Require rationale and explicit decision
- **Compliance**: All features must verify alignment

### Amendment Process

1. **Proposal**: Document reason for amendment
2. **Review**: Evaluate impact on existing features
3. **Approval**: Explicit decision and commit
4. **Version**: Increment constitution version

### Complexity Justification

**YAGNI Principle**: "You Aren't Gonna Need It"

- Over-engineering must be explicitly justified
- Premature optimization avoided
- Features added based on actual need
- Abstractions created after 3rd use case, not before

---

**Version**: 1.0.0
**Created**: {{DATE}}
**Last Amended**: {{DATE}}
