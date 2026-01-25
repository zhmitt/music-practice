# /tasks show - Display Task Registry Status

**Purpose**: Show task registry overview (like a dashboard)

**Usage**:
```bash
/tasks show              # Full registry overview
/tasks show --active     # Show only active features
/tasks show --pending    # Show only pending tasks
/tasks show --backlog    # Show only backlog features
/tasks show --completed  # Show recently completed
/tasks show --stats      # Show statistics only
```

---

## What This Command Does

1. **Reads** `.specify/memory/task-registry.md`
2. **Parses** sections (Active Features, Backlog, Recently Completed, User Test Queue, Session Todos, Statistics)
3. **Displays** formatted output based on flags
4. **Highlights** blockers, pending user tests, and session todos

---

## Output Format

### Default (Full Overview)

```
📋 Task Registry Overview
═══════════════════════════════════════════════════════════

📊 Statistics
────────────────────────────────────────────────────────────
Total Features: 5
Active Features: 2
Completed Features: 1
Pending Tasks: 23
In Progress: 3
Completed Tasks: 15
Overall Progress: 39%

🚧 Active Features (2)
────────────────────────────────────────────────────────────
Feature #001 - User Authentication (65%)
  Priority: P0 | Status: Implementation | Tasks: 13/20
  Blockers: None

Feature #003 - Payment Processing (20%)
  Priority: P0 | Status: Implementation | Tasks: 4/20
  Blockers: ⚠️ Requires Stripe API keys

📋 Backlog (2)
────────────────────────────────────────────────────────────
Feature #002 - User Profile Management (P1)
  Dependencies: Requires Feature #001
  Estimated Tasks: 15

Feature #004 - Email Notifications (P2)
  Dependencies: None
  Estimated Tasks: 10

⏸️ User Test Queue (1)
────────────────────────────────────────────────────────────
Feature #001 - User Authentication
  Test Type: User Acceptance (Critical - P0)
  Pending Tests: 4

📝 Session Todos (3)
────────────────────────────────────────────────────────────
⚠️ You have 3 ephemeral todos from current session.
Run /session-end to migrate these to permanent locations.

✅ Recently Completed (1)
────────────────────────────────────────────────────────────
Feature #000 - Project Initialization (Completed: 2026-01-20)
  Total Tasks: 8/8 (100%)
```

### --active Flag

```
🚧 Active Features (2)
────────────────────────────────────────────────────────────
Feature #001 - User Authentication (65%)
  Priority: P0 | Status: Implementation | Phase: 4
  Progress: 13/20 tasks
  Blockers: None

  Tasks:
    ✅ T001: Set up authentication middleware
    ✅ T002: Implement JWT token generation
    🚧 T003: Create login API endpoint (In Progress)
    ⏸️ T004: Add password hashing (Pending)
    ⏸️ T005: Implement logout functionality (Pending)
    ... (15 more tasks)

  Quick Links:
    Spec: .specify/specs/001-user-authentication/spec.md
    Tasks: .specify/specs/001-user-authentication/tasks.md
    Progress: .specify/specs/001-user-authentication/progress.md

Feature #003 - Payment Processing (20%)
  Priority: P0 | Status: Implementation | Phase: 4
  Progress: 4/20 tasks
  Blockers: ⚠️ Requires Stripe API keys

  [... similar format ...]
```

### --pending Flag

```
⏸️ Pending Tasks (23)
────────────────────────────────────────────────────────────
Feature #001 - User Authentication (7 pending)
  ⏸️ T004: Add password hashing
  ⏸️ T005: Implement logout functionality
  ⏸️ T006: Create password reset flow
  ⏸️ T007: Add email verification
  ⏸️ T008: Implement two-factor authentication
  ⏸️ T009: Add session management
  ⏸️ T010: Create user permissions system

Feature #003 - Payment Processing (16 pending)
  ⏸️ T005: Implement payment webhook handler
  ⏸️ T006: Add subscription management
  ... (14 more)
```

### --stats Flag

```
📊 Task Registry Statistics
═══════════════════════════════════════════════════════════

Features
────────────────────────────────────────────────────────────
Total Features: 5
Active Features: 2 (40%)
Backlog Features: 2 (40%)
Completed Features: 1 (20%)

Tasks
────────────────────────────────────────────────────────────
Total Tasks: 38
Completed: 15 (39%)
In Progress: 3 (8%)
Pending: 20 (53%)

User Testing
────────────────────────────────────────────────────────────
Features Awaiting Tests: 1
Pending User Tests: 4

Session
────────────────────────────────────────────────────────────
Session Todos: 3
⚠️ Migrate these before session end!

Overall Progress: 39%
Last Auto-Sync: 2026-01-25 14:30
```

---

## Implementation Guidance

### Step 1: Read Task Registry

```javascript
const registryPath = '.specify/memory/task-registry.md'
const content = readFile(registryPath)
```

### Step 2: Parse Sections

Extract sections using markdown headers:
- `## Statistics` → Parse numbers and percentages
- `## Active Features` → Parse feature blocks with `### Feature #XXX`
- `## Backlog` → Parse feature blocks
- `## Recently Completed` → Parse feature blocks
- `## User Test Queue` → Parse feature blocks
- `## Session Todos` → Parse checklist items

### Step 3: Parse Feature Blocks

For each `### Feature #XXX - Name (Status)` block:
- Extract feature ID (XXX)
- Extract name
- Extract status emoji and text
- Extract progress percentage from status line
- Extract metadata (Priority, Status, Progress, Blockers, Dependencies)
- Extract task list (if present)
- Extract quick links

### Step 4: Format Output

Based on flags:
- **Default**: Show all sections with summary
- **--active**: Show only Active Features with full task lists
- **--pending**: Show only pending tasks across all features
- **--backlog**: Show only Backlog section
- **--completed**: Show only Recently Completed section
- **--stats**: Show only Statistics section

### Step 5: Highlight Important Items

- Use ⚠️ emoji for blockers
- Use colored output (if terminal supports):
  - RED for blockers
  - YELLOW for pending user tests
  - GREEN for completed features
  - BLUE for in-progress tasks

---

## Error Handling

**If task-registry.md doesn't exist**:
```
❌ Task registry not found!

The task registry file doesn't exist yet.

Create it with:
  touch .specify/memory/task-registry.md

Or run:
  /tasks sync

This will create the registry and sync from existing tasks.md files.
```

**If task-registry.md is empty**:
```
⚠️ Task registry is empty!

No features found in task registry.

Run:
  /tasks sync

This will scan all .specify/specs/*/tasks.md files and populate the registry.
```

**If no features match filter**:
```
📋 No active features found

The task registry has no active features.

Check backlog:
  /tasks show --backlog

Or create a new feature:
  /speckit.specify "New feature description"
```

---

## Tips

### Quick Session Resume

```bash
# At session start, run:
/tasks show --stats

# This gives you a quick overview without overwhelming detail
```

### Focus on Current Work

```bash
# Show only what's in progress:
/tasks show --active

# Show only what's pending:
/tasks show --pending
```

### Before Session End

```bash
# Check for session todos:
/tasks show

# Look for "Session Todos" section
# If present, migrate them before /session-end
```

### Progress Tracking

```bash
# Check overall progress:
/tasks show --stats

# Monitor specific feature:
# (Open .specify/specs/XXX-feature-name/tasks.md directly)
```

---

## Integration with Other Commands

### /specify

When you run `/specify`, it should suggest running `/tasks show` first to understand current work.

### /speckit.tasks

After `/speckit.tasks` creates tasks, it should auto-run `/tasks sync` to update registry.

### /post-implementation

After `/post-impl` completes, it should auto-run `/tasks sync` to mark feature complete.

### /session-end

Before ending session, `/session-end` should auto-run `/tasks show` to check for session todos.

### /tasks next

After viewing registry with `/tasks show`, use `/tasks next` to get recommendation on what to work on.

---

## Examples

### Example 1: Session Start

```bash
# User runs:
/tasks show --stats

# Output:
📊 Task Registry Statistics
Total Features: 3
Active Features: 1 (33%)
Overall Progress: 45%
Session Todos: 0

# User now knows:
# - 1 feature is active (can continue)
# - Overall 45% done
# - No session todos (clean state)
```

### Example 2: Mid-Session Check

```bash
# User runs:
/tasks show --active

# Output:
🚧 Active Features (1)
Feature #005 - API Documentation (60%)
  Priority: P1 | Status: Implementation
  Progress: 12/20 tasks
  Blockers: None

  In Progress:
    🚧 T013: Generate OpenAPI spec

  Pending (7 tasks):
    ⏸️ T014: Add endpoint descriptions
    ... (6 more)

# User can see:
# - Currently working on T013
# - 7 more tasks pending
# - No blockers
```

### Example 3: Before Session End

```bash
# User runs:
/tasks show

# Output includes:
📝 Session Todos (2)
⚠️ You have 2 ephemeral todos from current session.
  - [ ] Update README with new API endpoints
  - [ ] Fix linting errors in auth module

Run /session-end to migrate these to permanent locations.

# User should:
# 1. Migrate todos to task-registry or feature tasks
# 2. Then run /session-end
```

---

## Performance

- **Fast**: Reads single file (.specify/memory/task-registry.md)
- **No Scanning**: Doesn't scan all tasks.md files (that's /tasks sync)
- **Cached**: Registry is pre-computed by /tasks sync
- **Time**: <1 second for display

**This is why it's 80-90% faster than searching through multiple files!**

---

*Last Updated: 2026-01-25*
*Command Version: 1.0*
