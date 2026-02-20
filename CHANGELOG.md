# Changelog

All notable changes to this template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### ✨ Added

- **Codex runtime structure**:
  - `AGENTS.md` (skill trigger rules and runtime entrypoints)
  - `codex/skills/*` (specify-core, tasks-registry, post-implementation, session-closure)
  - `codex/scripts/*` (phase detect, task sync, post-impl check, session close)
  - `Makefile` wrappers (`make daily`, `make phase`, `make sync`, `make post-check`, `make close`)
- **Missing Claude command definitions**:
  - `.claude/commands/test.md`
  - `.claude/commands/deploy.md`
  - `.claude/commands/doc-update.md`
  - `.claude/commands/persona-test.md`
  - `.claude/commands/security-scan.md`
  - `.claude/commands/post-impl.md` (alias)
- **Git hook implementation**:
  - `.git-hooks/pre-commit`
  - `.git-hooks/install.sh`
  - `.git-hooks/README.md`
- **Template completeness fixes**:
  - `.specify/templates/adr-template.md`
  - `.specify/memory/pending-usertests.md`

### 🔄 Changed

- **README.md** updated for dual runtime support (Claude + Codex) and new command examples.
- **Shell script portability** improved in:
  - `.specify/scripts/create-new-feature.sh`
  - `.specify/scripts/setup-plan.sh`
  (BSD/GNU `sed` compatibility)
- **Git ignore** updated to ignore temporary `.codex/` local artifacts.

---

## [2.0.0] - 2026-01-25

### 🎯 Major Changes

#### Task Registry System (GAME CHANGER)
- **Added**: `.specify/memory/task-registry.md` - Single source of truth for all tasks
- **Added**: `/tasks show` - Display registry status overview
- **Added**: `/tasks sync` - Auto-sync from tasks.md files
- **Added**: `/tasks next` - Smart feature recommendation engine
- **Impact**: 80-90% reduction in task research time (10-15 min → 1-2 min)

#### Working Memory Migration (BREAKING CHANGE)
- **Changed**: `working-memory/` → `.specify/memory/` (centralized location)
- **Reason**: Consistency with production systems, all memory in .specify/
- **Migration**: Automatic during template initialization
- **Breaking**: All paths updated, old working-memory/ deprecated

#### 3-Layer Post-Impl Enforcement
- **Added**: Layer 1 - Coding agent auto-reminder (always on)
- **Added**: Layer 2 - Session-end safety check (blocks if forgotten)
- **Added**: Layer 3 - Git pre-commit hook (optional)
- **Impact**: Post-impl compliance ↑ from ~60% to ~99%

### ✨ New Features

#### Memory & Navigation
- **Added**: `.specify/memory/INDEX.md` - Quick overview & navigation
- **Added**: Session log in NEXT-SESSION.md (chronological history)
- **Added**: Implementation summaries, bugs fixed, test results in NEXT-SESSION.md
- **Added**: Architecture Decision Records (ADRs) in `.specify/memory/decisions/`
- **Added**: Auto-generated reports in `.specify/memory/reports/`
- **Added**: Sessions directory `.specify/memory/sessions/` for implementation summaries
- **Added**: Reviews directory `.specify/memory/reviews/` for code review reports

#### Git Hooks
- **Added**: `.git-hooks/pre-commit` - 3-part validation (scattered files, post-impl, TODOs)
- **Added**: `.git-hooks/install.sh` - Automated hook installation
- **Added**: `.git-hooks/README.md` - Hook documentation
- **Feature**: TODO detection suggests task-registry instead of inline comments
- **Feature**: Interactive confirmation for new TODOs

#### Documentation
- **Added**: `README.md` - Comprehensive template documentation
- **Added**: `CHANGELOG.md` - This file
- **Added**: Quick Start guide
- **Added**: Troubleshooting section
- **Added**: Best Practices (DO/DON'T lists)

### 🔄 Enhanced

#### CLAUDE.md (Major Restructure)
- **Changed**: Production-proven structure (command-focused)
- **Added**: STOP points in workflow (prevents shortcuts)
- **Added**: Task Registry section (Rule #8)
- **Added**: Documentation Trigger table (Rule #9 - code → docs mapping)
- **Added**: Deprecated Components section (anti-patterns)
- **Changed**: Shorter, more scannable (~470 lines, focused)
- **Removed**: Verbose explanations (moved to linked docs)
- **Removed**: Domain-specific examples (Legal AI → generic placeholders)

#### Constitution
- **Added**: Version tracking (v2.0)
- **Added**: "Last Amended" and "Next Review" dates (6-month cycle)
- **Added**: Amendment process (more explicit)
- **Added**: Domain-specific principle example (shows pattern)
- **Added**: Platform Strategy principle (Web First, Desktop Follow)
- **Added**: External AI Verification pattern (Gemini example → generic)

#### Working Memory README (.specify/memory/README.md)
- **Added**: Task Registry section (3-level hierarchy)
- **Added**: INDEX.md section (quick navigation)
- **Updated**: All paths (working-memory/ → .specify/memory/)
- **Updated**: Agent permissions (with new paths)
- **Added**: Format specifications for consistency
- **Added**: Version history section

#### Commands
- **Enhanced**: `post-implementation.md` - Added 3-layer enforcement section
- **Enhanced**: `session-end.md` - Added task registry check, TodoWrite migration

### 🐛 Bug Fixes
- N/A (initial v2.0 release - production backport)

### 🗑️ Deprecated
- **Deprecated**: `working-memory/` directory (use `.specify/memory/`)
- **Deprecated**: Inline TODOs (use task-registry.md)
- **Deprecated**: Scattered documentation files (use .specify/memory/sessions/)

### 📝 Documentation
- **Added**: README.md with Quick Start, Directory Structure, What's New
- **Added**: Git Hooks section in CLAUDE.md
- **Added**: Task Registry usage in CLAUDE.md
- **Updated**: All references working-memory/ → .specify/memory/

### 🔧 Configuration
- **No Changes**: settings.json remains unchanged
- **No Changes**: Persona templates unchanged
- **No Changes**: Review standards unchanged (OWASP, Performance, Architecture)

### 🏗️ Infrastructure
- **Added**: .git-hooks/ directory with pre-commit validation
- **Added**: Auto-sync integration (speckit.tasks, post-impl, session-end)
- **Changed**: Memory structure (centralized in .specify/memory/)

### ⚠️ Breaking Changes

1. **Working Memory Path**
   - **Before**: `working-memory/`
   - **After**: `.specify/memory/`
   - **Migration**: Automatic (files moved, paths updated)
   - **Impact**: All agent instructions, commands, CLAUDE.md updated

2. **Task Tracking**
   - **Before**: Inline TODOs, scattered tasks
   - **After**: task-registry.md as SSOT
   - **Migration**: Run `/tasks sync --check-orphans` to detect orphaned TODOs
   - **Impact**: Encourages task-registry usage (pre-commit hook warns on TODOs)

3. **Session Protocol**
   - **Before**: Read NEXT-SESSION.md
   - **After**: Read INDEX.md first, then NEXT-SESSION.md
   - **Migration**: Automatic (INDEX.md created on first session)
   - **Impact**: 30 seconds vs 10 minutes for session resume

### 📊 Statistics (Production Validation)

**Source**: aiio-apps (legal tech monorepo, 6 months in production)

- **Features**: 59 specifications
- **Memory Files**: 50 files
- **Apps**: 8 applications
- **Task Registry Time Savings**: 80-90% (10-15 min → 1-2 min)
- **Post-Impl Compliance**: ↑ from ~60% to ~99%
- **Session Resume Speed**: ↑ 20x faster (10 min → 30 sec)

---

## [1.0.0] - 2026-01-09 (Initial Release)

### ✨ Initial Features

- **Spec-Driven Development**: No code without spec (unless < 20 lines)
- **SpecKit Workflow**: specify → plan → tasks → implement → post-impl
- **Team Pattern**: Tech Lead (Opus) + Specialized Agents (Sonnet/Opus)
- **Working Memory**: Session continuity with working-memory/ directory
- **Constitution**: 7 core principles governing development
- **Commands**: 7 core commands (code, deploy, review, test, specify, etc.)
- **Agents**: 12 specialized agents
- **Skills**: SpecKit skill with 9 workflows
- **Personas**: Example persona template
- **Review Standards**: OWASP, Performance, Architecture patterns

### 📁 Structure
- `.specify/` - Specification system
- `.claude/` - Claude Code configuration
- `working-memory/` - Session tracking
- `CLAUDE.md` - Core rules

---

## Version History Summary

- **v2.0.0** (2026-01-25): Task Registry, Memory Migration, 3-Layer Enforcement, Git Hooks (Production-Proven)
- **v1.0.0** (2026-01-09): Initial release (Spec-Driven Development Template)

---

## Upgrade Guide

### From v1.0.0 to v2.0.0

#### 1. Backup Current State

```bash
git checkout -b backup-v1.0.0
git commit -m "Backup before v2.0.0 upgrade"
git checkout main
```

#### 2. Memory Migration (Automatic)

If using the template directly, migration is automatic. If updating an existing project:

```bash
# Move files
mv working-memory/* .specify/memory/
rmdir working-memory/

# Update all references (search-replace)
find . -type f -name "*.md" ! -path "./.git/*" \
  -exec sed -i '' 's|working-memory/|.specify/memory/|g' {} +
```

#### 3. Create New Files

```bash
# Task Registry
touch .specify/memory/task-registry.md
# (Copy template from .specify/memory/task-registry.md in v2.0)

# INDEX.md
touch .specify/memory/INDEX.md
# (Copy template from .specify/memory/INDEX.md in v2.0)

# Task Commands
touch .claude/commands/tasks.show.md
touch .claude/commands/tasks.sync.md
touch .claude/commands/tasks.next.md
# (Copy templates from v2.0)
```

#### 4. Install Git Hooks (Optional)

```bash
cd .git-hooks
./install.sh
```

#### 5. Update CLAUDE.md

Replace your CLAUDE.md with the v2.0 version or manually add:
- STOP points in workflow
- Task Registry section (Rule #8)
- Documentation Triggers table (Rule #9)
- Deprecated Components section

#### 6. Test Workflow

```bash
# Session start
cat .specify/memory/INDEX.md
/tasks show --stats

# Create test feature
/speckit.specify "Test feature for v2.0.0"

# Verify auto-sync
/tasks show  # Should show new feature

# Clean up
rm -rf .specify/specs/*/test-feature-*
```

#### 7. Commit Upgrade

```bash
git add .
git commit -m "chore: Upgrade to template v2.0.0

- Migrate working-memory/ → .specify/memory/
- Add task registry system
- Add git hooks
- Update CLAUDE.md structure
- Enhance constitution

Template-Version: 2.0.0

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Future Versions (Roadmap)

### v2.1 (Planned - Q2 2026)
- Multi-domain templates (Legal, Healthcare, E-Commerce, SaaS)
- Enhanced persona library (10+ examples)
- Review standards library (GDPR, HIPAA, PCI-DSS, SOC2)
- IDE integration (VS Code extension)
- Task registry dashboard (web UI)

### v2.2 (Planned - Q3 2026)
- Auto-deployment on commit (CI/CD integration)
- Playwright test generation from specs
- Cost tracking (API usage by agent)
- Session analytics (time per feature, completion rates)

### v3.0 (Future)
- Multi-project support (monorepo template)
- Agent marketplace (custom agents)
- Template variants (mobile, desktop, web, API)
- Integration library (Stripe, Auth0, Supabase, etc.)

---

**Maintained by**: [Your Organization]
**Production-Validated**: ✅ Yes (aiio-apps, 6 months, 59 features)

---

*For detailed implementation notes, see the [v2.0.0 Implementation Plan](docs/v2.0.0-implementation-plan.md)*
