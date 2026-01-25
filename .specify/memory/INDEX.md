# Project Index

**Last Updated**: 2026-01-25
**Purpose**: Quick overview and navigation for fast session resume

---

## Project Status

**Current Phase**: {{PROJECT_PHASE}} (e.g., MVP Development, Production Ready, Phase 2 Planning)
**Current Branch**: `main`
**Current Focus**: {{CURRENT_FOCUS}} (e.g., Feature #XXX - Feature Name, Maintenance Mode, Bug Fixes)

**Quick Health Check**:
- ✅ Tests: Passing ({{TEST_COVERAGE}}% coverage)
- ✅ Build: Successful
- ✅ Deploy: {{DEPLOY_STATUS}} (e.g., Production stable, Staging ready)
- ✅ Blockers: {{BLOCKER_COUNT}} (None / X blockers - see below)

---

## Quick Links

### Core Documentation
- **Constitution**: [constitution.md](constitution.md) - Project principles
- **CLAUDE.md**: [../CLAUDE.md](../CLAUDE.md) - Core rules and workflows
- **README**: [../../README.md](../../README.md) - Template documentation

### Memory Files
- **NEXT-SESSION**: [NEXT-SESSION.md](NEXT-SESSION.md) - Session context
- **Task Registry**: [task-registry.md](task-registry.md) - Single source of truth for tasks
- **Feature Roadmap**: [feature-roadmap.md](feature-roadmap.md) - High-level feature tracking
- **Pending User Tests**: [pending-usertests.md](pending-usertests.md) - User acceptance tests queue

### Session History
- **Sessions**: [sessions/](sessions/) - Implementation summaries
- **Decisions**: [decisions/](decisions/) - Architecture Decision Records (ADRs)
- **Reports**: [reports/](reports/) - Auto-generated reports

### Specifications
- **Specs Directory**: [../specs/](../specs/) - All feature specifications
- **Templates**: [../templates/](../templates/) - Spec templates

---

## Environment Mapping

Map branches to deployment environments:

| Branch | Environment | Server | Deploy Script | Status |
|--------|-------------|--------|---------------|--------|
| `main` | Production | {{PROD_SERVER}} | `deploy-prod.sh` | ✅ Stable |
| `develop` | Staging | {{STAGING_SERVER}} | `deploy-staging.sh` | ✅ Ready |
| `feature/*` | Development | {{DEV_SERVER}} | `deploy-dev.sh` | 🚧 Active |

**Current Environment**: {{CURRENT_ENV}} (based on branch)

**Environment-Specific Notes**:
- Production: Requires approval for deployment
- Staging: Auto-deploy on commit to develop
- Development: Auto-deploy on commit to feature branches

---

## App Status Summary

<!-- Customize this section for your project structure -->

### {{APP_1_NAME}} (e.g., Web Frontend)
- **Status**: ✅ Operational
- **Version**: v{{VERSION}} (e.g., v1.2.0)
- **Port**: {{PORT}} (e.g., 3000)
- **Tests**: {{TEST_STATUS}} (e.g., 95% coverage, all passing)
- **Deploy**: {{DEPLOY_METHOD}} (e.g., Vercel, Manual)

### {{APP_2_NAME}} (e.g., API Backend)
- **Status**: ✅ Operational
- **Version**: v{{VERSION}} (e.g., v1.2.0)
- **Port**: {{PORT}} (e.g., 8000)
- **Tests**: {{TEST_STATUS}} (e.g., 90% coverage, all passing)
- **Deploy**: {{DEPLOY_METHOD}} (e.g., Docker, Manual)

### {{APP_3_NAME}} (e.g., Database)
- **Status**: ✅ Operational
- **Type**: {{DB_TYPE}} (e.g., PostgreSQL 15)
- **Migrations**: {{MIGRATION_STATUS}} (e.g., Up to date)
- **Backup**: {{BACKUP_STATUS}} (e.g., Daily, last: 2026-01-25)

---

## Active Features

Currently being implemented or tested. See [task-registry.md](task-registry.md) for full details.

<!-- Auto-populated by /tasks sync or manual updates -->

*Example format:*

### Feature #001 - User Authentication (🚧 65%)
- **Priority**: P0
- **Phase**: 4 (Implementation)
- **Progress**: 13/20 tasks
- **Blockers**: None
- **Next**: Complete login API endpoint

### Feature #003 - Payment Processing (🚧 20%)
- **Priority**: P0
- **Phase**: 4 (Implementation)
- **Progress**: 4/20 tasks
- **Blockers**: ⚠️ Requires API keys
- **Next**: Resolve blocker, then continue

---

## Pending User Tests

Features awaiting user testing. See [pending-usertests.md](pending-usertests.md) for full test suites.

<!-- Auto-populated by /post-impl or manual updates -->

*Example format:*

### Feature #002 - User Profile Management (⏸️ P0)
- **Implementation**: ✅ Complete
- **Automated Tests**: ✅ Passed (95% coverage)
- **User Tests**: ⏸️ Pending (4 tests)
- **Test Plan**: [User test suite](pending-usertests.md#feature-002)

---

## Architecture Decisions

Architecture Decision Records (ADRs) documenting key technical decisions.

### Recent Decisions

*Example format:*

- **D001**: [Authentication Strategy](decisions/D001-authentication-strategy.md) - JWT vs Session-based
- **D002**: [Database Choice](decisions/D002-database-choice.md) - PostgreSQL vs MongoDB
- **D003**: [API Design](decisions/D003-api-design.md) - REST vs GraphQL
- **D004**: [Testing Strategy](decisions/D004-testing-strategy.md) - Unit + Integration + E2E
- **D005**: [Deployment Pipeline](decisions/D005-deployment-pipeline.md) - CI/CD setup

**Template**: Use `.specify/templates/adr-template.md` for new ADRs

**Naming Convention**: `DXXX-short-description.md` where XXX is zero-padded number

---

## Feature Roadmap

High-level feature tracking. See [feature-roadmap.md](feature-roadmap.md) for details.

### MVP Complete ✅

*Example features:*

- ✅ Project Initialization
- ✅ User Authentication
- ✅ Basic CRUD Operations
- ✅ Deployment Setup

**MVP Status**: Complete as of {{MVP_COMPLETE_DATE}}

### In Progress 🚧

*Example features:*

- 🚧 Payment Processing (65% - Feature #003)
- 🚧 Email Notifications (40% - Feature #004)
- 🚧 User Profile Management (20% - Feature #002)

**Current Sprint Focus**: Payment Processing (P0)

### Phase 2 Backlog 📋

*Example features:*

- 📋 Admin Dashboard (P1)
- 📋 Analytics & Reporting (P2)
- 📋 Mobile App (P2)
- 📋 API v2 (P3)

**Phase 2 Planning**: {{PHASE2_START_DATE}} (e.g., Q2 2026)

---

## Session Protocol

Quick reference for session start/end procedures.

### Session Start (REQUIRED)

```bash
# 1. Check branch and pull latest
git branch --show-current
git pull origin $(git branch --show-current)

# 2. Read session context (START HERE!)
cat .specify/memory/INDEX.md           # This file - quick overview
cat .specify/memory/NEXT-SESSION.md    # Detailed session context

# 3. Check task status
/tasks show --stats                    # Quick stats
/tasks next                            # Get recommendation

# 4. Load constitution
cat .specify/memory/constitution.md    # Project principles

# 5. Check for blockers
git status                             # Uncommitted changes?
# Review "Blockers" section above

# 6. Start work
/specify                               # Resume or start feature
```

### During Session (BEST PRACTICES)

```bash
# Update task registry after progress
/tasks sync --feature XXX

# Check for recommendations if stuck
/tasks next --top-3

# Document decisions in decisions/
# Use ADR template for architecture decisions

# Update progress.md in feature spec
# Keep NEXT-SESSION.md current
```

### Session End (REQUIRED)

```bash
# 1. Check post-impl status
# If code changed: /post-implementation

# 2. Clean up and persist context
/session-end

# 3. Verify commit
git status
git log --oneline -1

# 4. Push changes
git push origin $(git branch --show-current)
```

---

## Key Files

Quick reference to most important files:

### Must Read at Session Start
1. **INDEX.md** (this file) - Quick overview
2. **NEXT-SESSION.md** - Session context
3. **task-registry.md** - Task status

### Read as Needed
4. **constitution.md** - Project principles
5. **feature-roadmap.md** - Feature tracking
6. **pending-usertests.md** - User test queue

### Reference Documentation
7. **CLAUDE.md** - Core rules
8. **README.md** - Template docs
9. **decisions/** - ADRs

---

## Current Blockers

<!-- Update this section manually when blockers arise -->

### Active Blockers

*Example format:*

1. **Feature #003 - Payment Processing**
   - Blocker: Stripe API keys required
   - Owner: {{OWNER}} (e.g., Product Manager)
   - ETA: {{BLOCKER_ETA}} (e.g., 2026-01-27)
   - Workaround: Use test mode keys temporarily

2. **Feature #006 - Analytics Dashboard**
   - Blocker: Awaiting product decision on metrics
   - Owner: {{OWNER}} (e.g., Product Team)
   - ETA: {{BLOCKER_ETA}} (e.g., Next sprint planning)
   - Workaround: None - feature on hold

### Resolved Blockers

*Example format:*

- ✅ **Feature #001 - User Authentication** (Resolved: 2026-01-20)
  - Was: Database schema approval
  - How: Schema reviewed and approved
  - By: {{RESOLVER}} (e.g., Tech Lead)

---

## Quick Commands

Essential commands for daily workflow:

### Task Management
```bash
/tasks show              # View task registry
/tasks sync              # Update registry from tasks.md files
/tasks next              # Get recommendation
```

### SpecKit Workflow
```bash
/specify                 # Entry point - detects phase
/speckit.specify "..."   # Create new spec
/spec-review             # Persona validation
/speckit.tasks           # Generate tasks
/post-implementation     # MANDATORY after implementation
```

### Team Pattern
```bash
/code "task"             # Delegate to Developer Agent
/review --security       # Security code review
/test                    # Run automated tests
/deploy {app}            # Deploy to environment
```

### Session Management
```bash
/session-end             # End session cleanly
```

---

## Statistics

<!-- Auto-updated by /tasks sync or manual updates -->

**Features**:
- Total: {{TOTAL_FEATURES}}
- Complete: {{COMPLETED_FEATURES}} ({{COMPLETION_PERCENTAGE}}%)
- Active: {{ACTIVE_FEATURES}}
- Backlog: {{BACKLOG_FEATURES}}

**Tasks**:
- Total: {{TOTAL_TASKS}}
- Complete: {{COMPLETED_TASKS}} ({{TASK_COMPLETION}}%)
- In Progress: {{IN_PROGRESS_TASKS}}
- Pending: {{PENDING_TASKS}}

**Testing**:
- Code Coverage: {{CODE_COVERAGE}}%
- Pending User Tests: {{PENDING_USER_TESTS}}
- Test Pass Rate: {{TEST_PASS_RATE}}%

**Overall Progress**: {{OVERALL_PROGRESS}}%

---

## Tips for Using INDEX.md

### Session Resume in 30 Seconds

1. Read "Project Status" - know where things stand
2. Read "Active Features" - see what's in progress
3. Read "Current Blockers" - identify issues
4. Run `/tasks next` - get recommendation
5. Start work!

**Compare to old method** (10 minutes):
- Read multiple feature-roadmap, status.md, NEXT-SESSION.md
- Grep through tasks.md files
- Check git log
- Try to remember context

### Quick Health Check

```bash
# Is everything OK?
cat .specify/memory/INDEX.md | grep "Status:"

# Look for:
# - Tests: Passing
# - Build: Successful
# - Deploy: Stable
# - Blockers: None
```

### Before Important Milestones

```bash
# Update INDEX.md before:
# - Demos
# - Releases
# - Sprint planning
# - Team sync

# Ensure all sections are current:
# - Active Features
# - Pending User Tests
# - Current Blockers
# - Statistics
```

---

## Maintenance

**Update Frequency**:
- **Auto-Updated**: Statistics (via /tasks sync)
- **Session-Updated**: Active Features, NEXT-SESSION.md (via /session-end)
- **Manual-Updated**: Environment Mapping, App Status, Blockers
- **As-Needed**: ADRs, Feature Roadmap major changes

**Review Schedule**:
- Daily: Project Status, Active Features, Blockers
- Weekly: Statistics, Pending User Tests
- Monthly: Environment Mapping, App Status, ADRs list

**Template Version**: 2.0.0
**Last Template Update**: 2026-01-25

---

*This file provides a 30-second overview vs 10-minute file hunting. Use it at every session start!*
