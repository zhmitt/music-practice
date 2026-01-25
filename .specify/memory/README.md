# Memory - Single Source of Truth (SSOT)

**🚨 CRITICAL: Agents MUST read this file FIRST before accessing .specify/memory!**

This directory contains session-based documentation for tracking project progress, decisions, and status.

**Location**: `.specify/memory/` (consolidated from working-memory/ in v2.0)

---

## Purpose

Memory provides:
- **Session Continuity**: Pick up where you left off
- **Decision Tracking**: Record architectural and design decisions
- **Status Visibility**: Know what's done, what's in progress, what's blocked
- **Task Registry**: Single source of truth for ALL tasks (Level 2 in 3-level hierarchy)
- **Feature Roadmap**: High-level feature tracking (Level 1 in 3-level hierarchy)
- **Branch Context**: Quick start for session resumption
- **Quick Navigation**: INDEX.md for 30-second session resume

---

## Structure

```
.specify/memory/
├── README.md                # THIS FILE (SSOT) - READ FIRST!
├── INDEX.md                 # Quick overview & navigation (30-second resume)
├── branch-context.md        # Current branch + quick start (SESSION START!)
├── status.md                # Current project/feature status
├── feature-roadmap.md       # Feature tracking (LEVEL 1 - High-level)
├── task-registry.md         # ALL tasks SSOT (LEVEL 2 - Single source of truth)
├── pending-usertests.md     # User test queue (optional)
├── NEXT-SESSION.md          # Cross-feature session context
├── constitution.md          # Project principles
├── sessions/                # Implementation summaries
│   └── YYYY-MM-DD-HHMM.md   # Session summaries from /session-end
├── reviews/                 # Code reviews
│   └── {feature}-review-{date}.md  # Code review reports
├── decisions/               # Architecture Decision Records (ADRs)
│   └── D001-*.md            # Individual decision records
└── reports/                 # Generated reports
    └── post-implementation-*.md  # Post-impl reports
```

---

## Task Hierarchy (3 Levels) 🆕

**Critical Concept**: Tasks are organized in a 3-level hierarchy:

```
Level 1: feature-roadmap.md          # High-level (✅🚧📋)
         ↓
Level 2: task-registry.md            # ALL tasks (SSOT)
         ↓
Level 3: .specify/specs/{feature}/tasks.md  # Granular details
```

### Level 1: feature-roadmap.md (High-Level)

**Purpose**: Bird's eye view of all features
**Format**: Simple status emojis (✅🚧📋)
**Update**: When feature status changes (Spec → Implement → Complete)
**Who**: Main Agent, Specify Agent

### Level 2: task-registry.md (SSOT) 🆕

**Purpose**: Single source of truth for ALL tasks across ALL features
**Format**: Structured sections (Active, Backlog, Completed, User Test Queue, Session Todos)
**Update**: Auto-sync via `/tasks sync` + manual edits
**Who**: ALL agents (read), /tasks sync (write)

**This is the GAME CHANGER**: 80-90% time savings (10-15 min → 1-2 min)

### Level 3: .specify/specs/{feature}/tasks.md (Granular)

**Purpose**: Detailed task lists with checkboxes, dependencies, notes
**Format**: Markdown checklist with task IDs, descriptions, acceptance criteria
**Update**: During implementation (check off tasks as done)
**Who**: Main Agent, Coding Agent, Post-Implementation Agent

### Why 3 Levels?

- **Level 1** (feature-roadmap): Quick status check (all features at a glance)
- **Level 2** (task-registry): Task research & planning (find tasks without scanning files)
- **Level 3** (tasks.md): Implementation detail (granular work tracking)

**Auto-Sync**: `/tasks sync` keeps Level 2 in sync with Level 3

---

## Files

### THIS FILE (README.md) - SSOT

**Purpose**: Single Source of Truth for memory structure

**Who reads:**
- ✅ ALL agents BEFORE accessing .specify/memory
- ✅ Main Agent at session start
- ✅ Post-Implementation Agent before updates
- ✅ Developers when onboarding

**Who writes:**
- ✅ Project maintainers when structure changes
- ❌ Agents (read-only)

**Why SSOT?**
- Prevents agents from hardcoding structure
- Documents format specifications
- Defines agent permissions
- Version-controlled and auditable

---

### INDEX.md (Quick Navigation) 🆕

**Purpose**: 30-second session resume vs 10-minute file hunting

**Format:**
```markdown
# Project Index

## Project Status
- Current Phase, Branch, Focus
- Quick Health Check (Tests, Build, Deploy, Blockers)

## Quick Links
- Constitution, CLAUDE.md, NEXT-SESSION, task-registry, feature-roadmap

## Environment Mapping
- Branch → Server → Deploy mapping

## Active Features
- Summary of in-progress features

## Pending User Tests
- Features awaiting user validation

## Architecture Decisions
- ADRs list

## Feature Roadmap
- MVP Complete, In Progress, Phase 2 Backlog

## Session Protocol
- Start/During/End commands

## Current Blockers
- Active blockers with owners and ETAs
```

**Who reads:**
- ✅ Main Agent (FIRST at session start!)
- ✅ All agents when context needed

**Who writes:**
- ✅ /session-end agent (auto-update statistics)
- ✅ Main Agent (manual updates to blockers, status)

**Update frequency:** Session end (auto), blockers change (manual), major milestones (manual)

**Why INDEX.md?**
- 30 seconds vs 10 minutes for session resume
- Single-page overview of entire project
- Quick links to all key files
- No more file hunting!

---

### task-registry.md (Task SSOT) 🆕

**Purpose**: Single source of truth for ALL tasks across ALL features

**Format:**
```markdown
# Task Registry

## Statistics
Total Features, Active, Completed, Tasks, Progress

## Active Features
### Feature #XXX - Name (🚧 Progress%)
Priority, Status, Tasks, Blockers, Next

## Backlog
### Feature #XXX - Name (📋 Backlog)
Priority, Dependencies, Estimated Tasks

## Recently Completed
### Feature #XXX - Name (✅ Complete)
Completed Date, Total Tasks, What was delivered

## User Test Queue
### Feature #XXX - Name (⏸️ Pending User Tests)
Test Type, Pending Tests

## Session Todos
Ephemeral todos from TodoWrite (migrate before session end)
```

**Who reads:**
- ✅ ALL agents (for task context)
- ✅ /tasks show (display registry)
- ✅ /tasks next (recommendations)

**Who writes:**
- ✅ /tasks sync (auto-update from tasks.md files)
- ✅ Main Agent (manual edits to priorities, blockers)

**Commands:**
- `/tasks show` - Display registry status
- `/tasks sync` - Sync from tasks.md files
- `/tasks next` - Get smart recommendation

**Auto-Sync Integration:**
- `/speckit.tasks` → AUTO-ADD feature
- `/post-implementation` → AUTO-MARK complete
- `/session-end` → AUTO-CHECK & sync

**Update frequency:** After every task change (via /tasks sync), manual edits as needed

**Why task-registry.md?**
- No more searching through 30+ tasks.md files
- 80-90% time savings (10-15 min → 1-2 min)
- Single-page view of all work
- Smart recommendations via /tasks next

---

### branch-context.md (SESSION START FILE!)

**Purpose**: Quick start context for session resumption

**Format:**
```markdown
# Branch Context - 🚨 SESSION START

**Branch:** {current-branch}
**Last Session:** {YYYY-MM-DD}
**Status:** {Active/Paused/Complete}

## Quick Start
1. Read this file
2. Read .specify/memory/status.md
3. Read .specify/memory/INDEX.md (quick overview)
4. Run /specify to continue

## Current Feature
- Feature: {feature-id}
- Spec: .specify/specs/{feature-id}/spec.md
- Phase: {Spec/Plan/Tasks/Implement/Testing/Complete}

## Environment
- Dev/Staging/Production
- Special notes (server URLs, credentials location, etc.)
```

**Who reads:**
- ✅ Main Agent (SESSION START - ALWAYS read first!)
- ✅ All agents when context needed

**Who writes:**
- ✅ Main Agent at session start/end
- ✅ Manual updates when changing branches

**Update frequency:** Session start, branch switch, deployment changes

---

### status.md

**Purpose**: Tracks overall project status with timestamped entries

**Format:**
```markdown
# Project Status

**Last Updated:** {YYYY-MM-DD HH:MM}

## Current Work
- Feature: {feature-id}
- Phase: {Spec/Plan/Tasks/Implement/Testing/Complete}
- Status: {On Track/Blocked/Paused}

## Recent Activity

### [{YYYY-MM-DD HH:MM}] Feature {feature-id} - {Event}

**Implementation:**
- ✅ Code implemented
- ✅ Tests passed ({coverage}% coverage)
- ✅ Documentation updated

**Pending:**
- [ ] Deployment
- [ ] User tests execution

**Notes:**
{Important context or decisions}

---

(Previous entries below, reverse chronological order)
```

**Who reads:**
- ✅ Main Agent (session start/end)
- ✅ Post-Implementation Agent (for updates)
- ✅ All agents when context needed

**Who writes:**
- ✅ Main Agent (during session)
- ✅ Post-Implementation Agent (after completion)
- ⚠️ APPEND ONLY - never overwrite existing entries!

**Timestamp Format:** `YYYY-MM-DD HH:MM` (24h format, NO seconds in section headers)

**Update frequency:** After completing significant work, hitting blockers, at session end

---

### feature-roadmap.md (LEVEL 1)

**Purpose**: Prevents "Feature Amnesia" - tracks all features with MVP/Phase 2 status

**Format:**
```markdown
# Feature Development Roadmap

**Last Updated:** {YYYY-MM-DD}

## Active Implementation
- {feature-id}: {title} - Status: {Spec/Plan/Tasks/Implement/Testing}
  - MVP Scope: {summary}
  - Phase 2 Backlog: {items}

## MVP Complete (Phase 2 Backlog)
- {feature-id}: {title} - MVP Complete {date}
  - Phase 2 Items:
    - [ ] {P2-item-1}
    - [ ] {P2-item-2}

## Future Backlog
- {feature-id}: {title} - Planned
  - Priority: P0/P1/P2
  - Dependencies: {list}

## Archived
- {feature-id}: {title} - Complete {date}
```

**Who reads:**
- ✅ Main Agent (session start for context)
- ✅ All agents when planning features

**Who writes:**
- ✅ Main Agent (when starting features, completing MVP)
- ✅ Manual updates when priorities change

**Update frequency:** Feature started, MVP complete, status changes

**Why important:**
- Prevents forgetting about Phase 2 work
- Tracks feature dependencies
- Shows project evolution

**Relationship to task-registry.md:**
- feature-roadmap.md = LEVEL 1 (high-level status)
- task-registry.md = LEVEL 2 (all tasks)
- Use `/tasks show` for detailed task view

---

### pending-usertests.md (OPTIONAL)

**Purpose**: User test queue - generated by /speckit.usertest, executed by user

**Format:**
```markdown
# Pending User Tests

**Last Updated:** {YYYY-MM-DD HH:MM}

## Active Tests

| Feature | App/Module | Tests | File | Generated | Status |
|---------|------------|-------|------|-----------|--------|
| {feature-id} | {app} | P0 ({p0}), P1 ({p1}), P2 ({p2}) | [link]({path}) | {YYYY-MM-DD HH:MM} | [ ] Pending |

## Completed Tests

| Feature | App/Module | Tests | File | Completed | Result |
|---------|------------|-------|------|-----------|--------|
| {feature-id} | {app} | P0 ({p0}), P1 ({p1}), P2 ({p2}) | [link]({path}) | {YYYY-MM-DD HH:MM} | ✅ Passed |
```

**Who reads:**
- ✅ Post-Implementation Agent (verification)
- ✅ Main Agent (session start)
- ✅ User (to execute tests)

**Who writes:**
- ✅ /speckit.usertest agent (adds new entries)
- ✅ User (moves to completed when done)

**Timestamp Format:** `YYYY-MM-DD HH:MM` (24h format)

**Note:** This file is OPTIONAL - only used if project has user testing workflow

---

### NEXT-SESSION.md

**Purpose**: Cross-feature session context (high-level)

**Format:**
```markdown
# Next Session Context

**Last Session:** {YYYY-MM-DD HH:MM}
**Current Branch:** {branch}
**Current Focus:** {feature or maintenance}

## Quick Start
Immediate next steps

## Current Focus
Feature summary, recent changes, test results, bugs fixed

## Suggested Next Steps
Options with reasoning

## Session Log
Chronological history of sessions

## Environment Notes
Dev/Staging/Production status
```

**Who reads:**
- ✅ Main Agent (session start)
- ✅ /session-end agent (for updates)

**Who writes:**
- ✅ /session-end agent (auto-update)
- ✅ Main Agent (manual context)

**Update frequency:** Session end (auto), major milestones (manual)

---

### constitution.md

**Purpose**: Project principles that supersede all other documentation

**Content:**
- 7 core principles (Spec-Driven, Security-First, Modular Architecture, etc.)
- Version tracking (v2.0+)
- Amendment process
- Domain-specific principles (example pattern)

**Who reads:**
- ✅ ALL agents (before making decisions)
- ✅ Main Agent (session start)

**Who writes:**
- ✅ Project maintainers only (with user approval)
- ❌ Agents (read-only)

**Update frequency:** When principles change (rarely)

---

### sessions/

**Purpose**: Implementation summaries from completed sessions

**Files:** `YYYY-MM-DD-HHMM.md` (timestamp format)

**Content:**
```markdown
# Session Summary - {YYYY-MM-DD HH:MM}

## What Was Done
- Feature: {feature-id}
- Work: {summary}

## Changes Made
- Files modified
- Tests added/updated
- Documentation updated

## Results
- Tests: Passed/Failed
- Coverage: {percentage}
- Deployment: {status}

## Next Steps
- Immediate next action
- Blockers to resolve
```

**Who reads:**
- ✅ Main Agent (for historical context)
- ✅ User (for session history)

**Who writes:**
- ✅ /session-end agent (auto-generated)

**Retention:** Keep indefinitely (small files, valuable history)

---

### reviews/

**Purpose**: Code review reports

**Files:** `{feature}-review-{date}.md`

**Content:**
```markdown
# Code Review - Feature #{feature}

**Date:** {YYYY-MM-DD}
**Reviewer:** {agent or human}
**Type:** Security / Performance / Architecture / Compliance

## Summary
Overall assessment

## Findings
Issues discovered

## Recommendations
Suggested improvements

## Follow-up
Action items
```

**Who reads:**
- ✅ Main Agent (for quality tracking)
- ✅ User (for compliance)

**Who writes:**
- ✅ /review agent (auto-generated)
- ✅ Manual code review (if applicable)

**Retention:** Keep indefinitely (compliance requirement)

---

### decisions/

**Purpose**: Architecture Decision Records (ADRs)

**Format:** `D###-short-description.md`

**Content:**
```markdown
# D###: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context

What is the issue we're facing?

## Decision

What did we decide to do?

## Consequences

What are the positive and negative results?

## Alternatives Considered

What other options were evaluated?
```

**Who reads:**
- ✅ All agents when context needed
- ✅ Main Agent (session start)

**Who writes:**
- ✅ Main Agent (architectural decisions)
- ✅ Manual updates (major tech decisions)

**Create new decision when:**
- Choosing between technical approaches
- Making architectural changes
- Establishing new patterns

---

### reports/

**Purpose**: Generated reports from agents

**Files:**
- `post-implementation-{feature-id}-{timestamp}.md` - Post-impl reports
- `review-{feature-id}-{timestamp}.md` - Code review reports (if applicable)

**Who reads:**
- ✅ Main Agent (for reference)
- ✅ User (for status)

**Who writes:**
- ✅ Post-Implementation Agent (auto-generated)
- ✅ Code Review Agent (auto-generated, if used)

**Retention:** Keep for 90 days, then archive or delete

---

## Agent Permissions

### Read Permissions

| Agent | Files |
|-------|-------|
| **Main Agent** | ALL (session start + context) |
| **Post-Implementation** | README.md (SSOT), status.md, pending-usertests.md, feature-roadmap.md, task-registry.md |
| **Specify Agent** | status.md, feature-roadmap.md, task-registry.md |
| **Coding Agent** | status.md (context only), task-registry.md |
| **Review Agent** | status.md (context only), task-registry.md |
| **Session-End Agent** | ALL (for summary generation) |
| **/tasks sync** | task-registry.md, .specify/specs/*/tasks.md |

### Write Permissions

| Agent | Files | Mode |
|-------|-------|------|
| **Main Agent** | branch-context.md, status.md, feature-roadmap.md, INDEX.md | Read existing + Append/Edit |
| **Post-Implementation** | status.md, reports/*.md, task-registry.md | Append only (status), Create (reports), Update (registry) |
| **Specify Agent** | feature-roadmap.md | Append/Edit |
| **Session-End Agent** | NEXT-SESSION.md, INDEX.md, sessions/*.md | Update (NEXT-SESSION, INDEX), Create (sessions) |
| **/tasks sync** | task-registry.md | Update (full rebuild) |
| **Coding Agent** | NONE | Read-only |
| **Review Agent** | reviews/*.md | Create (review reports) |

**CRITICAL:**
- ❌ Agents MUST NOT overwrite existing entries in status.md
- ✅ Agents MUST append new sections
- ✅ Agents MUST preserve existing content
- ✅ Agents MUST use exact timestamp formats
- ✅ /tasks sync is the ONLY agent that fully rewrites task-registry.md

---

## Format Specifications

### Timestamps

**Section Headers:**
```markdown
### [YYYY-MM-DD HH:MM] Event description
```
- 24-hour format
- NO seconds in section headers
- Space after HH:MM

**Table Entries:**
```markdown
| ... | YYYY-MM-DD HH:MM | ... |
```
- Consistent format across all tables

**File Names:**
```
post-implementation-{feature-id}-{YYYY-MM-DD-HHMMSS}.md
sessions/{YYYY-MM-DD-HHMM}.md
```
- Seconds allowed in report file names (for uniqueness)
- NO seconds in session file names (one summary per session)

### Markdown Formatting

- Use `---` for horizontal rules between sections
- Use checkboxes `- [ ]` for pending items
- Use checkboxes `- [x]` for completed items
- Use `✅` for completed/passed, `❌` for failed, `⚠️` for warning
- Use `🚧` for in progress, `📋` for backlog, `⏸️` for paused

---

## Workflow

### Session Start

1. ✅ **READ INDEX.md** (FIRST! - 30-second overview)
2. ✅ Read branch-context.md (session-specific context)
3. ✅ Read status.md for current state
4. ✅ Run `/tasks show --stats` (quick task status)
5. ✅ Read NEXT-SESSION.md (if cross-feature work)
6. ✅ Read feature-roadmap.md (if planning)
7. ✅ Review any recent decisions in decisions/
8. ✅ Run /specify to continue

**Time**: ~1-2 minutes with INDEX.md (vs 10 minutes without)

### During Session

1. Update status.md when completing work (append, don't overwrite!)
2. Create decision records for significant choices
3. Note blockers and questions
4. Update branch-context.md if changing branches
5. Run `/tasks sync` after checking off tasks in tasks.md

### Session End

1. Update status.md with final state (append new section)
2. Run `/tasks sync` (update task registry)
3. Run `/post-implementation` if feature complete (MANDATORY)
4. Run `/session-end` for clean termination (auto-updates NEXT-SESSION.md, INDEX.md)
5. Commit changes with meaningful message

---

## Integration with .specify

**Cross-feature coordination:**
- `.specify/memory/INDEX.md` - Quick overview (30 seconds)
- `.specify/memory/NEXT-SESSION.md` - High-level context
- `.specify/memory/branch-context.md` - Current branch context
- `.specify/memory/feature-roadmap.md` - Feature status (Level 1)
- `.specify/memory/task-registry.md` - Task SSOT (Level 2)

**Feature-specific progress:**
- `.specify/specs/{feature-id}/progress.md` - Feature progress
- `.specify/specs/{feature-id}/tasks.md` - Task details (Level 3)
- `.specify/memory/status.md` - Project-level status

**Constitution principles:**
- `.specify/memory/constitution.md` - Project principles
- `.specify/memory/decisions/` - Implementation decisions

**Separation:**
- `.specify/memory/` → Project-level tracking
- `.specify/specs/{feature-id}/` → Feature-specific details

---

## Anti-Patterns (DO NOT!)

❌ **Hardcoding structure** - Always read README.md for current structure
❌ **Overwriting existing content** - Append only to status.md
❌ **Inconsistent timestamps** - Follow format specs exactly
❌ **Skipping INDEX.md** - Always read at session start (30 sec vs 10 min!)
❌ **Skipping task-registry.md** - Use /tasks show instead of scanning files
❌ **Forgetting /tasks sync** - Auto-sync keeps registry current
❌ **Forgetting feature-roadmap.md** - Update when features change status
❌ **Using old working-memory/ path** - Use .specify/memory/ (v2.0+)

---

## Migration Notes (v1.x → v2.0)

**Breaking Change**: `working-memory/` → `.specify/memory/`

**What changed:**
- All files moved from working-memory/ to .specify/memory/
- Added: INDEX.md, task-registry.md, sessions/, reviews/
- Updated: All path references in agents, commands, CLAUDE.md

**Migration done automatically** during template initialization

**Old references**: Search for "working-memory/" should return 0 results (except in migration docs)

---

## Version History

**v2.0.0** (2026-01-25):
- 🆕 Task Registry (task-registry.md) - 80-90% time savings
- 🆕 INDEX.md - 30-second session resume
- 🆕 sessions/ and reviews/ directories
- 🔄 Migrated from working-memory/ to .specify/memory/
- 🔄 Enhanced NEXT-SESSION.md with session log
- 🔄 Updated all agent permissions
- 🔄 Added 3-level task hierarchy

**v1.2.0** (2026-01-13): Added SSOT concept, agent permissions, format specs

**v1.1.0** (Initial): Basic structure with status.md and decisions/

**v1.0.0** (Template): Original template structure

---

## Related Documentation

- **Session Management**: `.claude/commands/session-end.md`
- **Post-Implementation**: `.claude/commands/post-implementation.md`
- **Task Commands**: `.claude/commands/tasks.*.md`
- **Feature Tracking**: `.specify/memory/NEXT-SESSION.md`
- **Constitution**: `.specify/memory/constitution.md`
- **Core Rules**: `CLAUDE.md`

---

*Last Updated: 2026-01-25 (v2.0.0)*
