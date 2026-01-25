# Project Constitution - {{PROJECT_NAME}}

**Version**: 2.0
**Last Amended**: 2026-01-25
**Next Review**: 2026-07-25 (6-month cycle)
**Status**: Active

---

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
- **Working Memory** (.specify/memory/): Session logs and decisions
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

---

### VIII. Domain-Specific First Principle (Example)

**Placeholder for domain-specific core principle**

This section demonstrates how to add a domain-specific principle that supersedes general guidelines when applicable to your project domain.

**Examples by domain:**
- **Legal Tech**: "Attorney-Client Privilege Protection" - All communications treated as privileged, no logging of case details
- **Healthcare**: "HIPAA Compliance First" - Protected Health Information (PHI) encrypted at rest and in transit
- **Finance**: "PCI-DSS Compliance" - Credit card data never stored, tokenization required
- **E-Commerce**: "Customer Data Sovereignty" - Data residency follows customer location regulations

**Application**: Replace this placeholder with your domain-specific principle after `/init-project`

---

### IX. Platform Strategy

**Multi-platform development approach**

Define primary and distribution platforms to optimize development velocity and deployment strategy.

**Recommended Patterns:**

**Web First, Desktop Follow**:
- Primary: Progressive Web App (PWA) with Vite/Next.js
- Distribution: Electron or Tauri desktop wrapper
- Shared: Types, utilities, business logic
- Why: Fastest iteration, single codebase, cross-platform deployment

**Mobile First, Web Responsive**:
- Primary: React Native / Flutter
- Distribution: Responsive web (React/Vue)
- Shared: API contracts, design system
- Why: Mobile-optimized UX, progressive web enhancement

**API First, Client Agnostic**:
- Primary: FastAPI / Express / Go
- Distribution: Multiple clients (web, mobile, CLI, integrations)
- Shared: OpenAPI spec, SDK generation
- Why: Flexibility, scalability, clear contracts

**Application**: Define your platform strategy in this section after `/init-project`

---

### X. External AI Verification

**Using external AI advisors for validation**

Leverage multiple AI models for critical business logic verification and domain-specific validation.

**Patterns:**

**Second Opinion on Critical Logic**:
- Use external AI (e.g., Gemini, GPT-4) to verify complex calculations
- Example: Legal cost calculations verified by Gemini with domain context
- Example: Medical diagnosis algorithms reviewed by specialized AI

**Domain-Specific Validation**:
- Legal: Contract clause analysis with legal AI models
- Medical: Diagnosis validation with medical AI advisors
- Finance: Risk calculations verified by financial AI
- Technical: Architecture decisions reviewed by specialized coding AI

**External Perspective**:
- Challenge assumptions with different AI models
- Catch blind spots in architecture decisions
- Verify compliance with domain standards

**Implementation**:
```yaml
When to use:
  - Critical business logic (financial calculations, legal determinations)
  - High-risk decisions (architecture changes, security implementations)
  - Domain expertise gaps (specialized knowledge areas)

How to use:
  1. Implement logic in primary system (Claude)
  2. Verify with external AI (Gemini, GPT-4, specialized models)
  3. Compare outputs and resolve discrepancies
  4. Document verification in ADR or spec
```

**Application**: Use external verification for critical logic, document in Architecture Decision Records

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

**How to amend the constitution:**

1. **Proposal with Rationale**
   - Document WHY amendment is needed
   - Provide examples of current pain points
   - Propose new or modified principle

2. **Impact Review**
   - What changes in the codebase?
   - Which features are affected?
   - Who needs to be informed?
   - What documentation updates are required?

3. **User Approval Required**
   - Present proposal to user
   - Discuss trade-offs and implications
   - Get explicit approval before proceeding

4. **Version Increment**
   - **Major** (X.0): New core principle or removal of existing principle
   - **Minor** (x.Y): Modification to existing principle or clarification
   - Update version at top of file

5. **Update Metadata**
   - Set "Last Amended" date to current date
   - Set "Next Review" date to +6 months from amendment
   - Update "Status" if needed (Active, Deprecated, Superseded)

6. **Document in Version History**
   - Add entry to Version History section (below)
   - Summarize what changed and why

**Example Amendment**:
```markdown
## Version History

v2.0 (2026-01-25): Added Platform Strategy, External AI Verification, Domain-Specific principle placeholder
v1.0 (2026-01-09): Initial constitution
```

### Complexity Justification

**YAGNI Principle**: "You Aren't Gonna Need It"

- Over-engineering must be explicitly justified
- Premature optimization avoided
- Features added based on actual need
- Abstractions created after 3rd use case, not before

---

## Version History

**v2.0** (2026-01-25):
- Added Platform Strategy (Principle IX)
- Added External AI Verification (Principle X)
- Added Domain-Specific First Principle placeholder (Principle VIII)
- Enhanced Amendment Process with explicit steps
- Added 6-month review cycle

**v1.0** (2026-01-09):
- Initial constitution
- 7 core principles established
- Development workflow defined
- Git workflow and quality gates defined

---

**Version**: 2.0
**Created**: 2026-01-09
**Last Amended**: 2026-01-25
**Next Review**: 2026-07-25
