# Task Registry

**Single Source of Truth for ALL Tasks**

**Last Updated**: 2026-01-25
**Auto-Sync**: Enabled (via /tasks sync)

---

## Overview

This task registry is the **Level 2** in the 3-level task hierarchy:

```
Level 1: feature-roadmap.md   # High-level (✅🚧📋)
Level 2: task-registry.md      # ALL tasks (THIS FILE - SSOT)
Level 3: .specify/specs/{feature}/tasks.md  # Granular details
```

**Purpose**: Centralized view of all tasks across all features, eliminating the need to search through multiple files.

**Auto-Sync Integration**:
- `/speckit.tasks` → AUTO-ADD feature tasks
- `/post-implementation` → AUTO-MARK complete
- `/session-end` → AUTO-CHECK & sync
- `/tasks sync` → Manual sync anytime

**Time Savings**: 80-90% reduction (10-15 min → 1-2 min for task research)

---

## Quick Commands

```bash
/tasks show              # Display this registry status
/tasks show --active     # Show only active features
/tasks show --pending    # Show only pending tasks
/tasks sync              # Sync from all tasks.md files
/tasks sync --feature XXX  # Sync specific feature
/tasks sync --check-orphans  # Detect orphaned TODOs
/tasks next              # Get smart recommendation
```

---

## Statistics

**Total Features**: 0
**Active Features**: 0
**Completed Features**: 0
**Pending Tasks**: 0
**In Progress**: 0
**Completed Tasks**: 0
**Overall Progress**: 0%

---

## Active Features

Currently being implemented or tested.

<!-- Example format:
### Feature #001 - User Authentication (🚧 In Progress - 65%)

**Priority**: P0
**Status**: 🚧 Implementation (Phase 4)
**Progress**: 13/20 tasks (65%)
**Blockers**: None
**Last Updated**: 2026-01-25

**Tasks**:
- ✅ T001: Set up authentication middleware
- ✅ T002: Implement JWT token generation
- 🚧 T003: Create login API endpoint (In Progress)
- ⏸️ T004: Add password hashing (Pending)
- 📋 T005: Implement logout functionality (Pending)

**Quick Links**:
- Spec: `.specify/specs/001-user-authentication/spec.md`
- Tasks: `.specify/specs/001-user-authentication/tasks.md`
- Progress: `.specify/specs/001-user-authentication/progress.md`
-->

*No active features*

---

## Backlog

Features in planning or ready to start.

<!-- Example format:
### Feature #002 - User Profile Management (📋 Backlog)

**Priority**: P1
**Status**: 📋 Backlog (Spec Ready)
**Dependencies**: Requires Feature #001 (User Authentication)
**Estimated Tasks**: 15
**Last Updated**: 2026-01-25

**Quick Links**:
- Spec: `.specify/specs/002-user-profile/spec.md`
-->

*No backlog features*

---

## Recently Completed

Last 5 completed features for reference.

<!-- Example format:
### Feature #000 - Project Initialization (✅ Complete)

**Priority**: P0
**Status**: ✅ Complete
**Completed**: 2026-01-20
**Total Tasks**: 8/8 (100%)

**What was delivered**:
- Project structure initialized
- Core documentation created
- Development workflow established
- First successful deployment

**Quick Links**:
- Spec: `.specify/specs/000-project-init/spec.md`
- Report: `.specify/memory/reports/post-impl-000-project-init.md`
-->

*No completed features*

---

## User Test Queue

Features awaiting user testing or with pending user tests.

<!-- Example format:
### Feature #001 - User Authentication (⏸️ Pending User Tests)

**Priority**: P0
**Test Type**: User Acceptance (Critical - P0)
**Status**: ⏸️ Awaiting User Testing
**Implementation**: ✅ Complete
**Automated Tests**: ✅ Passed (95% coverage)
**Last Updated**: 2026-01-25

**Pending User Tests**:
- [ ] User can log in with valid credentials
- [ ] User sees error message with invalid credentials
- [ ] User can log out successfully
- [ ] Session expires after timeout

**Quick Links**:
- User Tests: `.specify/memory/pending-usertests.md`
- Test Suite: `.specify/specs/001-user-authentication/user-tests.md`
-->

*No pending user tests*

---

## Session Todos

Ephemeral todos from current session (captured via TodoWrite).
These should be migrated to feature tasks or backlog before session end.

<!-- Example format:
- [ ] Investigate performance issue in API response time
- [ ] Update README with new deployment instructions
- [ ] Fix linting errors in auth module
-->

*No session todos*

**NOTE**: Run `/session-end` to migrate session todos to permanent locations.

---

## Legend

### Status Emojis
- ✅ **Complete** - Done and tested
- 🚧 **In Progress** - Currently being worked on
- ⏸️ **Pending** - Ready but not started yet
- 📋 **Backlog** - Planned for future
- 🔴 **Blocked** - Cannot proceed due to blocker
- ⚠️ **On Hold** - Paused due to external factors

### Priority Levels
- **P0** - Critical (blocks other work, production issues)
- **P1** - High (important features, significant improvements)
- **P2** - Medium (nice to have, enhancements)
- **P3** - Low (future considerations, optimizations)

### Feature Phases
1. **Spec Only** - Specification created
2. **Planned** - Technical plan ready
3. **Reviewed** - Spec validated by personas
4. **Tasked** - Tasks created in tasks.md
5. **Implementation** - Code being written
6. **Testing** - Automated tests running
7. **User Testing** - Awaiting user validation
8. **Complete** - All done!

---

## Maintenance

### Auto-Sync Triggers

This file is automatically updated by:
- `/speckit.tasks` - Adds new feature with task count
- `/post-implementation` - Marks feature complete, moves to Recently Completed
- `/session-end` - Syncs all changes, checks for session todos
- `/tasks sync` - Manual sync from all tasks.md files

### Manual Updates

You can also update this file manually:
- Add new features to Backlog
- Update progress percentages
- Add/remove tasks
- Change priorities
- Update blockers

After manual changes, statistics will auto-update on next sync.

### Orphaned TODO Detection

Run `/tasks sync --check-orphans` to detect:
- Inline TODOs in code (should be in task-registry)
- Tasks in tasks.md not in registry
- Features in roadmap not in registry

---

## Template Example

When adding a new feature manually, use this template:

```markdown
### Feature #XXX - Feature Name (📋 Status - Progress%)

**Priority**: P0/P1/P2
**Status**: 📋 Backlog / 🚧 In Progress / ⏸️ Pending User Tests / ✅ Complete
**Progress**: X/Y tasks (Z%)
**Blockers**: None / [Description]
**Dependencies**: None / Requires Feature #YYY
**Last Updated**: YYYY-MM-DD

**Tasks** (if active):
- ✅ T001: Task description
- 🚧 T002: Task description (In Progress)
- ⏸️ T003: Task description (Pending)

**Quick Links**:
- Spec: `.specify/specs/XXX-feature-name/spec.md`
- Tasks: `.specify/specs/XXX-feature-name/tasks.md`
- Progress: `.specify/specs/XXX-feature-name/progress.md`
```

---

**Last Auto-Sync**: Never
**Next Manual Review**: 2026-02-25 (monthly)

---

*This file is the Single Source of Truth for all tasks. When in doubt, check here first.*
