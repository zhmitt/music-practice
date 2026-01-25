# App Development Template

Production-ready, spec-driven development template for Claude Code.

**Version**: 2.0.0
**Last Updated**: 2026-01-25
**Changelog**: [CHANGELOG.md](CHANGELOG.md)
**Production-Proven**: ✅ Yes (aiio-apps, 6 months, 59 features)

---

## Overview

This template implements a rigorous spec-driven development workflow with:

- 🎯 **Task Registry System** - 80-90% time savings (10-15 min → 1-2 min task research)
- 📋 **Spec-Driven Development** - No code without spec (unless < 20 lines)
- 🏗️ **Team Pattern** - Tech Lead + Specialized Agents (Opus + Sonnet)
- 🔒 **3-Layer Enforcement** - Post-impl is MANDATORY (auto-reminders + session checks + git hooks)
- 💾 **Working Memory SSOT** - Session continuity and knowledge persistence
- 🧪 **Testing Framework** - Automated + user testing with Playwright
- 📝 **Constitution Governance** - Project principles supersede all docs

---

## Quick Start

### 1. Initialize Project

```bash
# Copy template
git clone <template-repo> my-project
cd my-project

# Initialize project configuration (customize tech stack, domain, etc.)
# This command will prompt you for project details
```

**Answer prompts:**
- Project name
- Tech stack (language, framework, database)
- Domain (legal, healthcare, e-commerce, etc.)

### 2. Install Git Hooks (Optional but Recommended)

```bash
cd .git-hooks
./install.sh
```

**What it does**: 3-layer enforcement (scattered files check, post-impl check, TODO detection)

### 3. Start Development

```bash
# Session start
git branch --show-current
cat .specify/memory/INDEX.md              # Quick overview
cat .specify/memory/NEXT-SESSION.md      # Session context
/tasks show --stats                       # Task status

# Create first feature
/speckit.specify "Add user authentication"
```

---

## Directory Structure

```
app-dev-template/
├── .specify/              # Spec-Driven Development System
│   ├── memory/            # 🆕 Unified memory location (was working-memory/)
│   │   ├── INDEX.md       # 🆕 Quick overview & navigation
│   │   ├── task-registry.md  # 🆕 Single Source of Truth for tasks
│   │   ├── NEXT-SESSION.md   # Session context
│   │   ├── constitution.md   # Project principles
│   │   ├── feature-roadmap.md
│   │   ├── sessions/      # Implementation summaries
│   │   ├── reviews/       # Code review reports
│   │   ├── reports/       # Auto-generated reports
│   │   └── decisions/     # Architecture Decision Records
│   ├── specs/             # Feature Specifications
│   ├── templates/         # Spec Templates
│   └── scripts/           # Automation Scripts
├── .claude/
│   ├── commands/          # Slash Commands
│   │   ├── tasks.show.md     # 🆕 Task registry status
│   │   ├── tasks.sync.md     # 🆕 Sync from tasks.md files
│   │   └── tasks.next.md     # 🆕 Smart recommendations
│   ├── agents/            # Specialized Agents
│   ├── skills/            # Workflow Bundles (SpecKit)
│   ├── personas/          # User Personas
│   └── review-standards/  # Compliance Checklists
├── .git-hooks/            # 🆕 Git Pre-Commit Hooks
│   ├── pre-commit         # 3-layer enforcement
│   ├── install.sh         # Installation script
│   └── README.md          # Hook documentation
├── src/                   # Source Code
├── tests/                 # Test Files
├── CLAUDE.md              # 🔄 Core Rules (v2.0 - restructured)
├── README.md              # 🆕 This File
└── CHANGELOG.md           # 🆕 Version History

🆕 New in v2.0 | 🔄 Updated in v2.0
```

---

## What's New in v2.0

### Task Registry System (GAME CHANGER)

**Problem Solved**: Tasks scattered across 30+ files (feature-roadmap, tasks.md files, NEXT-SESSION, pending-usertests, TODOs in 74 files)

**Solution**: 3-level hierarchy with task-registry.md as SSOT

```
Level 1: feature-roadmap.md   # High-level (✅🚧📋)
Level 2: task-registry.md      # ALL tasks (SSOT)
Level 3: tasks.md files        # Granular details
```

**Commands**:
- `/tasks show` - Status overview (like dashboard)
- `/tasks sync` - Auto-update from tasks.md files
- `/tasks next` - Smart recommendation engine

**Time Savings**: 80-90% (10-15 min → 1-2 min)

**Auto-Sync**: `/speckit.tasks`, `/post-impl`, and `/session-end` keep it current

---

### Working Memory Migration

**Breaking Change**: `working-memory/` → `.specify/memory/`

**Why**: Centralizes all memory in .specify/, consistent with production systems

**Migration**: Automatic during template initialization

---

### INDEX.md (Quick Navigation)

New file for fast session resume:
- Project status at a glance
- Quick links to all key files
- Environment mapping (branch → server → deploy)
- Active features, pending tests, ADRs

**Session Start**: Read INDEX.md first (30 seconds vs 10 minutes)

---

### 3-Layer Post-Impl Enforcement

**Layer 1**: Coding agent auto-reminder (always on)
**Layer 2**: Session-end safety check (blocks if forgotten)
**Layer 3**: Git pre-commit hook (optional but recommended)

**Result**: Post-impl compliance ↑ from ~60% to ~99%

---

### Enhanced CLAUDE.md

**Changes**:
- Production-proven structure (command-focused)
- STOP points in workflow (prevents shortcuts)
- Documentation trigger table (code → docs mapping)
- Task registry section (new)
- Deprecated components list (anti-patterns)
- Shorter, more scannable

---

### Git Hooks

**Pre-Commit Validation**:
1. Scattered files check (prevents docs in wrong locations)
2. Post-impl check (code changes require docs)
3. TODO detection (suggests task-registry instead)

**Installation**: `.git-hooks/install.sh`

---

## Key Workflows

### Feature Development

```bash
# 1. Create spec
/speckit.specify "Add feature X"

# 2. Create plan
/speckit.plan

# 3. Review spec (personas)
/spec-review

# 4. Address gaps, then create tasks
/speckit.tasks

# 5. Implement (delegate to agents)
/code "Implement task T001"

# 6. Post-impl (MANDATORY)
/post-impl

# 7. Commit
git add .
git commit -m "feat: Add feature X"
```

---

### Session Management

```bash
# START
git branch --show-current
cat .specify/memory/INDEX.md           # Quick overview
cat .specify/memory/NEXT-SESSION.md    # Session context
/tasks show --stats                     # Task status

# DURING
/tasks sync                             # Update registry
/tasks next                             # Get recommendation

# END
/post-impl                              # If code changed
/session-end                            # Cleanup & persistence
```

---

### Task Management

```bash
# View all tasks
/tasks show

# View only active
/tasks show --active

# Sync from tasks.md files
/tasks sync

# Check for orphaned TODOs
/tasks sync --check-orphans

# Get recommendation
/tasks next
```

---

## Best Practices

### ✅ DO

- Read CLAUDE.md at project start
- Follow spec-driven workflow (no code without spec)
- Delegate coding tasks to agents (>20 lines)
- Run /post-impl after every implementation (MANDATORY)
- Update working memory (NEXT-SESSION, feature-roadmap, task-registry)
- Use task-registry.md for task tracking (not inline TODOs)
- Install git hooks (3-layer enforcement)
- Test on appropriate environment (dev server, not local)
- Create meaningful git commits
- Document architecture decisions (ADRs)

### ❌ DON'T

- Skip spec for >20 line changes
- Main agent writes code directly (>20 lines)
- Skip /post-impl (3-layer enforcement prevents this)
- Use inline TODOs (use task-registry instead)
- Scatter docs in wrong locations (git hook prevents this)
- Commit code without docs (git hook prevents this)
- Force-push to main/master
- Amend commits after hook failures (creates new commit instead)
- Use working-memory/ path (migrated to .specify/memory/)

---

## Troubleshooting

### Pre-Commit Hook Blocking

**Issue**: Commit blocked by hook

**Solutions**:
1. Check which validation failed (file organization, post-impl, TODOs)
2. Fix the issue:
   - File organization: Move files to correct location
   - Post-impl: Run /post-impl, stage docs, retry commit
   - TODOs: Create tasks in task-registry.md instead
3. Retry commit

**Emergency bypass** (not recommended):
```bash
git commit --no-verify
```

---

### Task Registry Out of Sync

**Issue**: task-registry.md shows wrong progress

**Solution**:
```bash
/tasks sync  # Re-sync from all tasks.md files
```

---

### Session Resume Slow

**Issue**: Don't know where to start after session break

**Solution**:
```bash
cat .specify/memory/INDEX.md         # Quick overview (30 seconds)
cat .specify/memory/NEXT-SESSION.md  # Session context
/tasks show --stats                   # Task status
/tasks next                           # Recommendation
```

---

## Configuration

### Tech Stack

Edit after project initialization:
- Language, framework, database
- Testing framework
- CI/CD pipeline

### Personas

Add domain-specific personas in `.claude/personas/`:
- Copy `example-persona.md.template`
- Define: Overview, Goals, Pain Points, Workflows, Use Cases, Accessibility Needs
- Used by `/spec-review` for persona-based validation

### Review Standards

Add compliance checklists in `.claude/review-standards/`:
- OWASP Security (included)
- Performance Budget (included)
- Architecture Patterns (customize for project)
- Domain-specific: GDPR, HIPAA, PCI-DSS, etc.

### Branch → Deploy Mapping

Edit `CLAUDE.md` Section 6:
```markdown
| Branch | Server | Deploy Script |
|--------|--------|---------------|
| main   | Production | deploy-prod.sh |
| develop | Staging | deploy-staging.sh |
| feature/* | Dev | deploy-dev.sh |
```

---

## Support

### Documentation

- **Core Rules**: [CLAUDE.md](CLAUDE.md)
- **Constitution**: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- **Working Memory**: [.specify/memory/README.md](.specify/memory/README.md)
- **Task Registry**: [.specify/memory/task-registry.md](.specify/memory/task-registry.md)
- **Quick Navigation**: [.specify/memory/INDEX.md](.specify/memory/INDEX.md)
- **Git Hooks**: [.git-hooks/README.md](.git-hooks/README.md)

### Issues

Report bugs or feature requests: [GitHub Issues](https://github.com/<your-org>/<your-repo>/issues)

---

## Roadmap

### v2.1 (Planned)

- [ ] Multi-domain templates (Legal, Healthcare, E-Commerce, SaaS)
- [ ] Enhanced persona library (10+ example personas)
- [ ] Review standards library (GDPR, HIPAA, PCI-DSS, SOC2)
- [ ] IDE integration (VS Code extension)
- [ ] Task registry dashboard (web UI)

### v2.2 (Planned)

- [ ] Auto-deployment on commit (CI/CD integration)
- [ ] Playwright test generation from specs
- [ ] Cost tracking (API usage by agent)
- [ ] Session analytics (time per feature, completion rates)

### v3.0 (Future)

- [ ] Multi-project support (monorepo template)
- [ ] Agent marketplace (custom agents)
- [ ] Template variants (mobile, desktop, web, API)
- [ ] Integration library (Stripe, Auth0, Supabase, etc.)

---

## License

MIT License - See [LICENSE.md](LICENSE.md)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Credits

**Production System**: aiio-apps (legal tech monorepo)
**Battle-Tested**: 59 features, 50 memory files, 8 apps
**Time in Production**: 6 months
**Key Innovations**: Task Registry (80-90% time savings), 3-Layer Enforcement, Memory Migration

**Template Authors**: [Your Name/Organization]
**Contributors**: [List contributors]

---

**Template Version**: 2.0.0
**Last Updated**: 2026-01-25
**Production-Proven**: ✅ Yes
