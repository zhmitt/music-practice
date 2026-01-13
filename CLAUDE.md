# CLAUDE.md - {{PROJECT_NAME}}

> **STOP! Read this FIRST before implementing anything!**

## MANDATORY: Spec-Driven Development

**BEFORE you write ANY code for a new feature or major change:**

### Specify Workflow

```bash
/specify  # Main workflow guide - detects phase, validates compliance
```

**Workflow Phases:**
```
0. No Spec     → /speckit.specify "{description}"
1. Spec Only   → /speckit.plan
2. Planned     → /spec-review (validates from persona perspectives)
3. Reviewed    → /speckit.tasks (after gaps addressed)
4. Tasked      → /speckit.implement
5. Implemented → /post-implementation
6. Tested      → Execute user tests
7. Complete    → Feature done!
```

### When to Use SpecKit (Full Workflow)

**USE SpecKit for:**
- New features (any size)
- Significant changes (> 20 lines, multiple files)
- Architectural changes
- New API endpoints

**Workflow:** `/specify` → plan → tasks → implement → post-impl

### When to Skip SpecKit (Quick Changes)

**SKIP SpecKit for:**
- Bug fixes (< 20 lines, single file)
- Typo/comment fixes
- Small tweaks to existing code
- Documentation-only changes

**Quick workflow:**
1. Make change
2. Tests pass
3. Update working-memory if relevant
4. Commit

### Core Rules

1. **NO code without spec** (unless < 20 lines bug fix)
2. **Use Specify workflow** - Don't skip compliance checks
3. **post-impl is MANDATORY** - Tests, docs, report

---

## MANDATORY Workflow Enforcement

### Session Bookends

```bash
START:  git branch --show-current
        cat working-memory/branch-context.md  # SESSION START FILE!
        cat .specify/memory/NEXT-SESSION.md
        /specify

END:    /specify
        /post-implementation  # If feature complete
        /session-end          # Optional: clean session end
```

### Per User Story (BLOCKING!)

**BEFORE marking story complete:**
1. Tests pass
2. Update `working-memory/status.md`:
   ```markdown
   [YYYY-MM-DD HH:MM] Story: {ID} - {title}
   - Implemented: {what}
   - Tests: Passed
   - Next: {blocker/next-story}
   ```
3. Commit with: `feat: {description}\n\nStory: {ID}\nTests: Passed`

### Per Feature (after /speckit.implement)

**YOU MUST orchestrate:**
```bash
/post-implementation      # Tests, docs, report
/session-end              # Optional: context cleanup
```

### Anti-Shortcut Rules

- "Just a small change" → Tests required
- "I'll update later" → Update NOW
- "Tests pass locally" → CI MUST also pass

**Consequence: Incomplete = NOT DONE = Cannot proceed**

---

## Project Overview

**{{PROJECT_NAME}}** - {{PROJECT_DESCRIPTION}}

## Repository Structure

```
{{PROJECT_NAME}}/
├── .specify/              # Spec-Driven Development System
│   ├── memory/            # Constitution, Session Context
│   ├── specs/             # Feature Specifications
│   ├── templates/         # Spec Templates
│   └── scripts/           # Automation Scripts
├── .claude/
│   ├── commands/          # Slash Commands
│   ├── agents/            # Claude Agents
│   └── personas/          # User Personas (project-specific)
├── working-memory/        # Session Decisions & Status
├── src/                   # Source Code
├── tests/                 # Test Files
└── CLAUDE.md              # This File (Core Rules)
```

---

## Git Workflow

### Branch Strategy

```
main (Production)
    │
    └── feature/XXX-description
```

### Feature Development

```bash
# 1. Start new feature (from main)
git checkout main && git pull origin main
git checkout -b feature/XXX-description

# 2. Implement feature (use /specify workflow)
# ... code ...

# 3. Push and create PR
git push -u origin feature/XXX-description
```

---

## Working Memory Protocol

### Session Start (REQUIRED)

1. ✅ **READ `working-memory/branch-context.md`** (FIRST! - SESSION START FILE)
2. Read `working-memory/status.md` for project status
3. Read `working-memory/feature-roadmap.md` (if planning features)
4. Check `.specify/memory/NEXT-SESSION.md` for cross-feature context
5. Check `git status`
6. Review recent commits: `git log --oneline -5`
7. Load feature progress: `.specify/specs/{feature-id}/progress.md`

### During Session (REQUIRED)

- Update `progress.md` when completing tasks or hitting blockers
- Keep `tasks.md` current with checkbox updates
- Document decisions in working-memory

### Session End (REQUIRED)

1. Update `progress.md` with final session state
2. Update `NEXT-SESSION.md` if switching features
3. Git commit with meaningful message
4. Mark todos complete in `tasks.md`

---

## Commands Reference

### Spec-Kit Commands

```bash
/speckit.specify "{desc}"  # Create spec
/speckit.plan              # Create technical plan
/speckit.tasks             # Generate task list
/speckit.implement         # Start implementation
/speckit.clarify           # Clarify spec requirements
/speckit.analyze           # Run consistency analysis
/speckit.checklist         # Generate implementation checklist
/speckit.constitution      # Review constitution compliance
/speckit.usertest          # Generate user tests
```

### Workflow Commands

```bash
/specify                   # Main workflow orchestrator
/spec-review               # Persona-based spec validation (Opus)
/post-implementation       # Post-impl orchestration (Sonnet)
/session-end               # Session cleanup
/init-project              # Initialize new project (run once)
```

### Team Pattern Commands

```bash
/code {task}               # Delegate coding task to Developer Agent (Sonnet)
/review --{type}           # Code review against standards (Opus)
  --compliance {standard}  #   Domain-specific compliance
  --security               #   OWASP Top 10
  --performance            #   Performance anti-patterns
  --architecture           #   Architecture patterns
```

---

## Team Pattern & Model Configuration

### Agent Roles

This template uses a **Tech Lead + Specialized Agents** pattern for scalable development:

```
Main Agent (Tech Lead) - Opus
  ├─ /code → Coding Agent (Developer) - Sonnet
  ├─ /review → Code Review Agent (Compliance) - Opus
  ├─ /post-impl → Post-Implementation Agent - Sonnet
  └─ /spec-review → Spec Review Agent (Persona Validation) - Opus
```

**Model Assignment Rationale:**
- **Opus (Main Agent, Review Agents)**: Highest quality for architecture decisions, compliance checks, and persona analysis
- **Sonnet (Coding, Post-Impl)**: Balanced cost/performance for implementation and orchestration

### When to Use Team Pattern Commands

#### /code - Delegate Implementation

**Use when:**
- Clear, focused coding task (<500 lines)
- Architecture decisions already made
- Task has well-defined acceptance criteria
- Want to offload implementation details

**Tech Lead provides:**
```yaml
Task: {clear description}
Files:
  to_modify: [list]
  to_create: [list]
Acceptance_Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
Context: {spec file, related code}
Constraints: {patterns to follow}
```

**Developer delivers:**
- ✅ Implemented feature/fix
- ✅ Unit tests (>90% coverage)
- ✅ Documentation
- ✅ Self-reviewed code
- ✅ Completion report

#### /review - Code Review

**Use when:**
- Critical code (API integrations, auth, data processing)
- Security-sensitive changes
- Compliance-required features
- Performance-critical paths

**Review types:**
```bash
/review --compliance {standard}  # Domain-specific compliance
/review --security               # OWASP Top 10
/review --performance            # Performance anti-patterns
/review --architecture           # Architecture patterns
```

**Review standards location:**
- `.claude/review-standards/` - Compliance checklists
- Customize for your domain (add `{domain}-compliance.md`)

#### /post-impl - MANDATORY After Implementation

**Orchestrates:**
1. Run automated tests (BLOCKING gate)
2. Generate user test suites
3. Update documentation
4. Update working memory (SSOT)
5. Create completion report

**NEVER skip** - This ensures:
- ✅ Tests pass before marking complete
- ✅ Documentation up to date
- ✅ Working memory updated
- ✅ User tests ready for execution

### Working Memory SSOT

**CRITICAL:** All agents MUST read `working-memory/README.md` FIRST before accessing working-memory.

**Why?**
- Prevents hardcoded structure
- Documents format specifications (timestamps, tables)
- Defines agent permissions (who reads/writes what)
- Version-controlled and auditable

**Key files:**
- `branch-context.md` - SESSION START file (read first!)
- `status.md` - Project status with timestamped entries
- `feature-roadmap.md` - Feature tracking & Phase 2 backlog
- `decisions/` - Architecture Decision Records (ADRs)
- `reports/` - Auto-generated reports

### Persona Review Bias Warning

**⚠️ IMPORTANT:** `/spec-review` provides persona-based feedback which can be **biased** or **overly prescriptive**.

**Main Agent MUST:**
1. ✅ Review feedback for plausibility
2. ✅ Discuss with user before implementing
3. ❌ DO NOT implement 1:1 - User has final say

**Why?**
- Personas may over-emphasize edge cases
- AI-generated feedback may contradict project constraints
- User context (budget, timeline, priorities) may differ

**Workflow:**
```
Persona Review → Main Agent validates → Discuss with User → User decides
```

---

## Constitution Reference

The project constitution at `.specify/memory/constitution.md` defines:

1. **Specification-Driven Development** - Specs before code
2. **Security-First Development** - Security is non-negotiable
3. **Modular Architecture** - Self-contained modules
4. **Working Memory & Session Continuity** - Knowledge persists
5. **Test-Driven Development** - Tests before implementation
6. **Minimal Dependencies** - Reduce supply chain risk
7. **Progressive Enhancement** - Graceful degradation

**Constitution SUPERSEDES all other documentation when in conflict.**

---

## Project-Specific Configuration

<!--
This section is populated by /init-project command.
Add project-specific details here after initialization.
-->

### Tech Stack

- **Language**: {{LANGUAGE}}
- **Framework**: {{FRAMEWORK}}
- **Database**: {{DATABASE}}
- **Testing**: {{TESTING}}

### Key Personas

<!-- Personas are defined in .claude/personas/ after /init-project -->

### Deployment

<!-- Add deployment details after project setup -->

---

*Last Updated: {{DATE}}*
*Template Version: 1.0.0*
