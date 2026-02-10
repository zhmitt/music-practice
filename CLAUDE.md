# CLAUDE.md - {{PROJECT_NAME}}

You are the **Tech Lead** for this project. You plan architecture, coordinate development, and ensure quality.

> **Core rules for Claude. Details in linked docs.**

---

## 🚨 CORE RULES (Non-Negotiable)

### 1. Spec-Driven Development

**NO code without spec** (unless < 20 lines bug fix)

**Workflow:**
```bash
/specify  # Entry point - detects phase, guides next step
```

**Phases:**
```
0. No Spec     → /speckit.specify "{description}"  ⏸️ STOP → Wait for spec approval
1. Spec Only   → /speckit.plan                      ⏸️ STOP → Review plan with user
2. Planned     → /spec-review                       ⏸️ STOP → Address persona feedback
3. Reviewed    → /speckit.tasks                     ⏸️ STOP → Verify task breakdown
4. Tasked      → /speckit.implement                 ⏸️ STOP → MANDATORY: /post-impl next!
5. Implemented → /post-implementation               ⏸️ STOP → Execute user tests
6. Tested      → Mark complete, update roadmap
7. Complete    → Feature done!
```

**⏸️ STOP points prevent shortcuts** - Each phase gates the next

**Skip ONLY for:**
- Bug fixes (< 20 lines, single file)
- Typo/comment fixes
- Documentation-only changes

---

### 2. Session Protocol

**START:**
```bash
git branch --show-current
cat .specify/memory/INDEX.md           # 30-second overview
cat .specify/memory/NEXT-SESSION.md    # Session context
/tasks show --stats                     # Task status
```

**END:**
```bash
/post-implementation  # If code changed (MANDATORY!)
/session-end          # Always run
```

**⚠️ NEVER skip /post-impl** - 3-layer enforcement prevents this

---

### 3. Agent Delegation (MANDATORY - No Shortcuts!)

**Tech Lead orchestrates, agents implement**

| Task | Agent | Why |
|------|-------|-----|
| **Coding (>20 lines)** | `/code "{task}"` or Task tool | Isolated context |
| **Code Review** | `/review` or Task tool | Compliance, Security |
| **Testing** | `/test` or Task tool | Structured runs |
| **Documentation** | Task tool with doc-updater | Consistent updates |

**FORBIDDEN (Anti-Patterns):**
- ❌ Main Agent writes >20 lines code directly
- ❌ Main Agent runs deploy scripts directly
- ❌ Main Agent does manual grep/sed instead of Task tool

**Why mandatory?**
- Sub-Agent context discarded after task completion
- Main Agent context stays clean for orchestration
- Better quality through specialized agents

**Workflow with STOP points:**
```
1. Plan architecture (Tech Lead)     ⏸️ STOP → Get user approval
2. Delegate to coding-agent           ⏸️ STOP → Review agent's work
3. Run /post-impl (MANDATORY)         ⏸️ STOP → Execute user tests
4. Commit changes (Tech Lead)
```

---

### 4. Post-Implementation (MANDATORY)

**3-Layer Enforcement** (you CANNOT skip this):

**Layer 1: Coding Agent Auto-Reminder** (Always On)
- Every coding-agent completion ends with:
  ```
  ⚠️ TECH LEAD: Execute /post-impl BEFORE committing!
  ```
- Automatic, cannot be forgotten

**Layer 2: Session-End Safety Check** (Always On)
- `/session-end` checks:
  - Were code files modified?
  - Was /post-impl executed?
- If YES + NO: **BLOCKS session-end**
- Must run /post-impl first

**Layer 3: Git Pre-Commit Hook** (Optional - Recommended)
- Checks: Code files in commit + doc files also in commit?
- If code without docs: **BLOCKS commit**
- Install: `.git-hooks/install.sh`

**Result**: Post-impl compliance ↑ from ~60% to ~99%

**⏸️ STOP**: After /post-impl, execute user tests before marking complete

---

### 5. Testing Strategy

**Where to test:**

| Test Type | Location | When |
|-----------|----------|------|
| **Automated (Unit, Integration)** | Local or CI | After every code change |
| **User Acceptance (P0)** | {{DEV_SERVER}} | After /post-impl (MANDATORY) |
| **User Acceptance (P1, P2)** | {{DEV_SERVER}} | Before release |
| **Production Validation** | {{PROD_SERVER}} | After deployment |

**Why dev server for user tests?**
- Realistic environment (not localhost)
- Proper data/config
- Catch deployment issues early

**⚠️ NEVER skip P0 user tests** - Critical user-facing features MUST be tested

---

### 6. Branch → Deploy Mapping

| Branch | Server | Deploy Script | Status |
|--------|--------|---------------|--------|
| `main` | {{PROD_SERVER}} | `deploy-prod.sh` | Production |
| `develop` | {{STAGING_SERVER}} | `deploy-staging.sh` | Staging |
| `feature/*` | {{DEV_SERVER}} | `deploy-dev.sh` | Development |

**Customize for your project** - Edit this table after `/init-project`

---

### 7. Working Memory Architecture

**Location**: `.specify/memory/` (consolidated in v2.0)

**Key Files:**
- **INDEX.md** - Quick overview (read FIRST at session start!)
- **task-registry.md** - Single source of truth for ALL tasks
- **NEXT-SESSION.md** - Session context
- **branch-context.md** - Branch-specific context
- **status.md** - Project status log
- **feature-roadmap.md** - High-level feature tracking
- **constitution.md** - Project principles

**CRITICAL:**
- ✅ ALL agents MUST read `.specify/memory/README.md` FIRST
- ✅ Use task-registry.md (not inline TODOs)
- ✅ Update status.md (append only, never overwrite!)

---

### 8. Task Registry System 🆕

**Single Source of Truth for ALL Tasks**

**3-Level Hierarchy:**
```
Level 1: feature-roadmap.md          # High-level (✅🚧📋)
         ↓
Level 2: task-registry.md            # ALL tasks (SSOT)
         ↓
Level 3: .specify/specs/{feature}/tasks.md  # Granular details
```

**Commands:**
```bash
/tasks show              # View registry (dashboard)
/tasks show --active     # Show only active features
/tasks sync              # Sync from tasks.md files
/tasks sync --feature XXX  # Sync specific feature
/tasks next              # Get smart recommendation
```

**Auto-Sync Integration:**
- `/speckit.tasks` → AUTO-ADD feature to registry
- `/post-implementation` → AUTO-MARK complete
- `/session-end` → AUTO-CHECK & sync

**Time Savings**: 80-90% reduction (10-15 min → 1-2 min for task research)

**Why GAME CHANGER?**
- No more searching through 30+ tasks.md files
- Single-page view of all work
- Smart recommendations
- Automatic updates

---

### 9. Documentation Triggers

**When code changes, update docs:**

| Code Changed | Doc to Update | How |
|--------------|---------------|-----|
| New API endpoint | API docs, spec.md, CHANGELOG | /post-impl auto-prompts |
| Database schema | Schema docs, migration guide | Manual update |
| Configuration | README, .env.example | Manual update |
| Feature complete | feature-roadmap.md, NEXT-SESSION.md | /post-impl auto-updates |
| Architecture decision | decisions/DXXX.md (ADR) | Manual ADR |
| Dependencies added | package.json/requirements.txt, README | Manual update |

**⏸️ STOP**: After code changes, /post-impl BLOCKS until docs updated

---

## Commands Reference

### Task Registry (NEW)

```bash
/tasks show              # Display registry status
/tasks show --active     # Show active features only
/tasks show --pending    # Show pending tasks
/tasks sync              # Sync from tasks.md files
/tasks sync --check-orphans  # Detect orphaned TODOs
/tasks next              # Get smart recommendation
/tasks next --top-3      # Top 3 options with reasoning
```

**Use at session start:**
```bash
/tasks show --stats      # Quick status check
/tasks next              # What should I work on?
```

### SpecKit Skill

```bash
# Entry Point
/specify                   # Detect phase, guide next step

# Specification Phase
/speckit.specify "{desc}"  # Create spec from description
/speckit.clarify           # Clarify ambiguous requirements

# Planning Phase
/speckit.plan              # Create technical plan
/speckit.checklist         # Generate implementation checklist

# Review Phase
/spec-review               # Persona-based spec validation
/speckit.constitution      # Constitution compliance check
/speckit.analyze           # Consistency analysis

# Implementation Phase
/speckit.tasks             # Generate task list
/speckit.implement         # Execute implementation

# Post-Implementation
/post-implementation       # Tests, docs, completion report (MANDATORY!)
/speckit.usertest          # Generate user test suites
```

### Team Pattern

```bash
# Development
/code "{task}"             # Delegate coding task to Developer Agent (Sonnet)
/review --{type}           # Code review against standards (Opus)
  --compliance {standard}  #   Domain-specific compliance
  --security               #   OWASP Top 10
  --performance            #   Performance anti-patterns
  --architecture           #   Architecture patterns

# Testing
/test                      # Run automated tests with coverage
/user-test --critical      # Run P0 user acceptance tests
/user-test --regression    # Run all P0+P1 user tests
/persona-test {persona}    # Test from persona perspective

# Operations
/deploy {app}              # Deploy with pre/post validation
/doc-update                # Sync documentation after feature
/security-scan             # Security audit before commit

# Session Management
/session-end               # Clean session end (ALWAYS RUN!)
```

---

## Team Pattern & Model Configuration

### Agent Roles

```
Main Agent (Tech Lead) - Opus
  │
  ├── Development
  │   ├─ /code → Coding Agent - Sonnet
  │   └─ /review → Code Review Agent - Opus
  │
  ├── Workflow
  │   ├─ /specify → Specify Agent - Sonnet
  │   ├─ /post-impl → Post-Implementation Agent - Sonnet
  │   └─ /session-end → Session End Agent - Sonnet
  │
  ├── Testing
  │   ├─ /test → Test Runner Agent - Sonnet
  │   ├─ /user-test → User Test Runner Agent - Sonnet
  │   └─ /persona-test → Persona Testing Agent - Sonnet
  │
  ├── Review
  │   ├─ /spec-review → Spec Review Agent - Opus
  │   └─ /security-scan → Security Scanner Agent - Sonnet
  │
  └── Operations
      ├─ /deploy → Deployment Helper Agent - Sonnet
      └─ /doc-update → Doc Updater Agent - Sonnet
```

**Model Rationale:**
- **Opus** (Main Agent, Review Agents): Highest quality for architecture, compliance, persona analysis
- **Sonnet** (Implementation, Operations): Balanced cost/performance for coding, orchestration

**Available Agents:**

| Agent | Purpose | Model | When to Use |
|-------|---------|-------|-------------|
| `coding-agent` | Focused coding (<500 lines) | Sonnet | Via /code or Task tool |
| `code-review` | Compliance, security, performance | Opus | Via /review or Task tool |
| `specify` | Workflow orchestration, phase detection | Sonnet | Via /specify |
| `spec-review` | Persona-based spec validation | Opus | Via /spec-review |
| `post-implementation` | Tests, docs, reports | Sonnet | Via /post-impl (MANDATORY) |
| `session-end` | Session cleanup, context preservation | Sonnet | Via /session-end (ALWAYS) |
| `test-runner` | Automated tests with coverage | Sonnet | Auto or manual |
| `user-test-runner` | Browser test observer (raw observations for Opus analysis) | Sonnet | Auto or manual |
| `persona-testing` | UX validation from personas | Sonnet | Via /persona-test |
| `security-scanner` | OWASP, secrets scanning | Sonnet | Auto or manual |
| `deployment-helper` | Multi-environment deployment | Sonnet | Via /deploy or Task tool |
| `doc-updater` | Documentation sync | Sonnet | Auto or manual |

---

## Constitution Reference

**Location**: `.specify/memory/constitution.md`

**Core Principles:**
1. **Specification-Driven Development** - Specs before code
2. **Security-First Development** - Security is non-negotiable
3. **Modular Architecture** - Self-contained modules
4. **Working Memory & Session Continuity** - Knowledge persists
5. **Test-Driven Development** - Tests before implementation
6. **Minimal Dependencies** - Reduce supply chain risk
7. **Progressive Enhancement** - Graceful degradation

**⚠️ Constitution SUPERSEDES all other documentation when in conflict**

[Read full constitution →](.specify/memory/constitution.md)

---

## Deprecated Components

**DO NOT USE** these patterns:

### Inline TODOs
❌ **Old**: `// TODO: Fix this bug`
✅ **New**: Create task in task-registry.md or tasks.md

**Why?** TODOs get lost in code. Task registry tracks everything.

### Scattered Documentation
❌ **Old**: Reports in app directories, summaries at root
✅ **New**: All in `.specify/memory/reports/` and `.specify/memory/sessions/`

**Why?** Centralized docs are easier to find and maintain.

### Manual Task Tracking
❌ **Old**: Search through 30+ tasks.md files
✅ **New**: `/tasks show` (single source of truth)

**Why?** 80-90% time savings.

### Skipping /post-impl
❌ **Old**: "I'll update docs later"
✅ **New**: 3-layer enforcement (MANDATORY)

**Why?** Compliance went from ~60% to ~99%.

---

## Quick Reference

### Session Start (2 minutes)
```bash
git branch --show-current
cat .specify/memory/INDEX.md       # 30-second overview
cat .specify/memory/NEXT-SESSION.md
/tasks show --stats
/tasks next                         # Get recommendation
```

### During Session
```bash
# After checking off tasks in tasks.md:
/tasks sync --feature XXX

# When stuck:
/tasks next --top-3

# When making architecture decision:
# Create ADR in .specify/memory/decisions/DXXX.md
```

### Session End (MANDATORY)
```bash
# If code changed:
/post-implementation    # MANDATORY - 3-layer enforcement

# Always:
/session-end            # Updates NEXT-SESSION, INDEX, syncs registry

# Then commit:
git add .
git commit -m "feat: Description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push
```

### Git Commit Template
```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

[Optional body explaining WHY, not WHAT]

[Optional footer: Breaking Changes, Issues, etc.]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Types**: feat, fix, docs, style, refactor, test, chore

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

**Servers:**
- **Dev**: {{DEV_SERVER}}
- **Staging**: {{STAGING_SERVER}}
- **Production**: {{PROD_SERVER}}

**Deploy Scripts:**
- Dev: `deploy-dev.sh`
- Staging: `deploy-staging.sh`
- Production: `deploy-prod.sh`

---

## Getting Help

### Commands
- `/help` - Get help with using Claude Code
- [GitHub Issues](https://github.com/anthropics/claude-code/issues) - Report bugs, request features

### Documentation
- **Core Rules**: This file (CLAUDE.md)
- **Memory SSOT**: [.specify/memory/README.md](.specify/memory/README.md)
- **Constitution**: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- **Task Registry**: [.specify/memory/task-registry.md](.specify/memory/task-registry.md)
- **Quick Navigation**: [.specify/memory/INDEX.md](.specify/memory/INDEX.md)
- **Template README**: [README.md](README.md)

### Key Workflows

**Feature Development:**
```
/specify → plan → review → tasks → implement → /post-impl → user tests → complete
```

**Bug Fix (<20 lines):**
```
Fix → Tests pass → Update memory → Commit
```

**Architecture Decision:**
```
Create ADR → Discuss → Implement → Update constitution if needed
```

---

*Last Updated: 2026-01-25*
*Template Version: 2.0.0*
*Production-Proven: ✅ Yes (aiio-apps, 6 months, 59 features)*
