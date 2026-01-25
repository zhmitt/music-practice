# /tasks sync - Sync Task Registry from tasks.md Files

**Purpose**: Update task-registry.md by scanning all feature tasks.md files

**Usage**:
```bash
/tasks sync                    # Sync all features
/tasks sync --feature XXX      # Sync specific feature only
/tasks sync --check-orphans    # Detect orphaned TODOs
/tasks sync --full             # Full rebuild (re-scan everything)
```

---

## What This Command Does

1. **Scans** all `.specify/specs/*/tasks.md` files
2. **Parses** task lists, progress, and metadata
3. **Updates** `.specify/memory/task-registry.md`
4. **Recalculates** statistics (total tasks, progress percentages, etc.)
5. **Detects** orphaned TODOs (with --check-orphans flag)
6. **Preserves** manual edits (descriptions, priorities, blockers)

---

## Auto-Sync Integration

This command is **automatically called** by:

### /speckit.tasks
```
When: After tasks.md is created
Action: Add new feature to Active Features section
Updates: Statistics (total features +1, total tasks +N)
```

### /post-implementation
```
When: After feature is complete and tests pass
Action: Move feature from Active to Recently Completed
Updates: Statistics (completed +1, active -1)
```

### /session-end
```
When: Before ending session
Action: Sync all changes from current session
Updates: All sections, check for session todos
```

### Manual
```
When: User runs /tasks sync explicitly
Action: Full sync of all features
Updates: Everything
```

---

## Sync Algorithm

### Step 1: Discover Features

```bash
# Find all feature spec directories
find .specify/specs -type d -name "*-*" | while read dir; do
  featureId=$(basename "$dir" | cut -d'-' -f1)
  featureName=$(basename "$dir" | cut -d'-' -f2-)

  # Check for tasks.md
  if [ -f "$dir/tasks.md" ]; then
    echo "Found: $featureId - $featureName"
  fi
done
```

### Step 2: Parse tasks.md

For each feature:
1. **Read** `.specify/specs/{feature}/tasks.md`
2. **Count** total tasks (all checkbox items)
3. **Count** completed tasks (✅ or [x] checkboxes)
4. **Count** in-progress tasks (🚧 or tasks with "In Progress")
5. **Count** pending tasks (⏸️ or [ ] checkboxes)
6. **Calculate** progress percentage: `(completed / total) * 100`
7. **Extract** task descriptions for each task

### Step 3: Read Metadata

Check other spec files for context:
- **spec.md** → Feature description, user stories
- **progress.md** → Current phase, blockers
- **plan.md** → Dependencies

Extract:
- Priority (from spec.md or default to P1)
- Status emoji (from progress.md or infer from phase)
- Blockers (from progress.md)
- Dependencies (from plan.md or spec.md)

### Step 4: Determine Section

Based on progress and phase:
```javascript
if (progress === 100 && phase >= 7) {
  section = "Recently Completed"
} else if (phase >= 4 && phase <= 6) {
  section = "Active Features"
} else if (phase === 3) {
  section = "Backlog" // Reviewed but not started
} else if (phase <= 2) {
  section = "Backlog" // Spec/Plan phase
}

// Check for pending user tests
if (progress === 100 && hasPendingUserTests) {
  section = "User Test Queue"
}
```

### Step 5: Update Registry

1. **Read** current task-registry.md
2. **Find** feature block (`### Feature #XXX`)
3. If exists:
   - **Update** progress, tasks, metadata
   - **Preserve** manual edits (priorities, custom notes)
4. If not exists:
   - **Create** new feature block in appropriate section
5. **Recalculate** statistics section
6. **Write** updated task-registry.md

### Step 6: Detect Orphans (--check-orphans)

If `--check-orphans` flag is set:
1. **Scan** all code files for `TODO`, `FIXME`, `XXX` comments
2. **Check** if mentioned in task-registry.md or any tasks.md
3. **Report** orphaned TODOs
4. **Suggest** migrating to task-registry

---

## Output Format

### Default Sync

```
🔄 Syncing Task Registry...
═══════════════════════════════════════════════════════════

Scanning features...
  ✓ Feature #001 - User Authentication (13/20 tasks, 65%)
  ✓ Feature #002 - User Profile Management (0/15 tasks, 0%)
  ✓ Feature #003 - Payment Processing (4/20 tasks, 20%)

Updating registry sections...
  ✓ Active Features (2 features)
  ✓ Backlog (1 feature)
  ✓ Recently Completed (0 features)
  ✓ User Test Queue (0 features)

Recalculating statistics...
  Total Features: 3
  Total Tasks: 55
  Completed Tasks: 17
  Overall Progress: 31%

✅ Task registry synced successfully!
   Updated: .specify/memory/task-registry.md
   Last Sync: 2026-01-25 15:45
```

### Specific Feature Sync

```bash
/tasks sync --feature 001
```

```
🔄 Syncing Feature #001...
═══════════════════════════════════════════════════════════

Feature: User Authentication
Tasks File: .specify/specs/001-user-authentication/tasks.md

Parsing tasks...
  Total: 20
  Completed: 13 (✅)
  In Progress: 1 (🚧)
  Pending: 6 (⏸️)
  Progress: 65%

Checking metadata...
  Priority: P0
  Phase: 4 (Implementation)
  Blockers: None
  Dependencies: None

Updating registry...
  Section: Active Features
  Status: 🚧 In Progress

✅ Feature #001 synced successfully!
   Progress updated: 65%
```

### Orphan Detection

```bash
/tasks sync --check-orphans
```

```
🔍 Checking for Orphaned TODOs...
═══════════════════════════════════════════════════════════

Scanning codebase...
  Checked: 127 files
  Found: 12 TODOs, 3 FIXMEs, 1 XXX

Orphaned TODOs (not in task-registry or tasks.md):
────────────────────────────────────────────────────────────
📄 src/auth/middleware.ts:45
   // TODO: Add rate limiting to prevent brute force

📄 src/payments/stripe.ts:112
   // FIXME: Handle webhook signature verification

📄 src/utils/validation.ts:23
   // XXX: This validation is too permissive

Suggestions:
────────────────────────────────────────────────────────────
1. Add to task-registry.md:
   - Create tasks for each orphaned TODO
   - Assign to appropriate feature

2. Add to feature tasks.md:
   - If related to existing feature
   - Update tasks.md with checkbox item

3. Remove inline TODO:
   - If already tracked elsewhere
   - Or if no longer relevant

⚠️ 3 orphaned TODOs found!

Would you like to:
  [1] Create tasks in registry
  [2] Ignore (keep inline)
  [3] Show details

Choice: _
```

### Full Rebuild

```bash
/tasks sync --full
```

```
🔄 Full Rebuild of Task Registry...
═══════════════════════════════════════════════════════════

⚠️ This will rebuild the entire registry from scratch.
   Manual edits in task-registry.md will be preserved.

Proceed? (y/N): y

Clearing cache...
  ✓ Cache cleared

Scanning all features...
  Found: 5 features

  ✓ #001 - User Authentication (20 tasks)
  ✓ #002 - User Profile Management (15 tasks)
  ✓ #003 - Payment Processing (20 tasks)
  ✓ #004 - Email Notifications (10 tasks)
  ✓ #005 - Admin Dashboard (25 tasks)

Rebuilding sections...
  ✓ Active Features (2 features, 40 tasks, 45% avg progress)
  ✓ Backlog (2 features, 25 tasks)
  ✓ Recently Completed (1 feature, 20 tasks)
  ✓ User Test Queue (0 features)
  ✓ Session Todos (0 todos)

Recalculating statistics...
  Total Features: 5
  Total Tasks: 90
  Completed: 38 (42%)
  In Progress: 5 (6%)
  Pending: 47 (52%)
  Overall Progress: 42%

✅ Full rebuild complete!
   Registry: .specify/memory/task-registry.md
   Last Sync: 2026-01-25 15:50

Next steps:
  /tasks show  # View updated registry
```

---

## Implementation Guidance

### Core Function: syncTaskRegistry()

```javascript
async function syncTaskRegistry(options = {}) {
  const { feature, checkOrphans, full } = options

  // Step 1: Discover features
  const features = discoverFeatures(feature)

  // Step 2: Parse each feature
  const featureData = []
  for (const feat of features) {
    const data = await parseFeature(feat)
    featureData.push(data)
  }

  // Step 3: Update registry
  await updateRegistry(featureData, full)

  // Step 4: Recalculate stats
  await recalculateStatistics()

  // Step 5: Check orphans (if requested)
  if (checkOrphans) {
    await detectOrphanedTodos()
  }

  // Step 6: Write to file
  await writeRegistry()

  return { success: true, features: features.length }
}
```

### parseFeature(feature)

```javascript
async function parseFeature(featureId) {
  const basePath = `.specify/specs/${featureId}-*/`

  // Read tasks.md
  const tasksFile = `${basePath}/tasks.md`
  const tasksContent = readFile(tasksFile)

  // Count tasks
  const totalTasks = countCheckboxes(tasksContent)
  const completedTasks = countCompletedCheckboxes(tasksContent)
  const inProgressTasks = countInProgressTasks(tasksContent)
  const pendingTasks = totalTasks - completedTasks - inProgressTasks

  // Calculate progress
  const progress = (completedTasks / totalTasks) * 100

  // Read metadata
  const progressFile = `${basePath}/progress.md`
  const progressContent = readFile(progressFile)
  const phase = extractPhase(progressContent)
  const blockers = extractBlockers(progressContent)

  // Read spec for priority and dependencies
  const specFile = `${basePath}/spec.md`
  const specContent = readFile(specFile)
  const priority = extractPriority(specContent) || 'P1'
  const dependencies = extractDependencies(specContent)

  // Determine status emoji
  const statusEmoji = getStatusEmoji(progress, phase)

  // Determine section
  const section = determineSection(progress, phase)

  return {
    id: featureId,
    name: extractFeatureName(basePath),
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    progress,
    phase,
    blockers,
    priority,
    dependencies,
    statusEmoji,
    section
  }
}
```

### updateRegistry(featureData, full)

```javascript
async function updateRegistry(featureData, full) {
  let registry = readFile('.specify/memory/task-registry.md')

  if (full) {
    // Full rebuild: clear all feature sections
    registry = clearFeatureSections(registry)
  }

  // Group features by section
  const sections = {
    'Active Features': [],
    'Backlog': [],
    'Recently Completed': [],
    'User Test Queue': []
  }

  for (const feature of featureData) {
    sections[feature.section].push(feature)
  }

  // Update each section
  for (const [sectionName, features] of Object.entries(sections)) {
    registry = updateSection(registry, sectionName, features)
  }

  return registry
}
```

---

## Error Handling

### No Features Found

```
⚠️ No features found!

Scanned: .specify/specs/
Found: 0 features

This might mean:
  1. No features have been created yet
  2. Features are in wrong location
  3. tasks.md files are missing

To create a feature:
  /speckit.specify "Feature description"
```

### tasks.md Parse Error

```
❌ Error parsing tasks.md

File: .specify/specs/001-user-authentication/tasks.md
Error: Malformed checkbox syntax at line 45

Expected: - [ ] Task description
Found: - Task description (missing checkbox)

Fix the file and run /tasks sync again.
```

### Registry Write Error

```
❌ Failed to write task registry

File: .specify/memory/task-registry.md
Error: Permission denied

Check file permissions:
  ls -la .specify/memory/task-registry.md

Or recreate file:
  rm .specify/memory/task-registry.md
  /tasks sync --full
```

---

## Performance

### Fast Sync (Default)

- **Incremental**: Only updates changed features
- **Cached**: Uses last-modified timestamps
- **Time**: ~2-3 seconds for 50 features

### Full Rebuild (--full)

- **Complete**: Re-scans everything
- **Slower**: Reads all files regardless of changes
- **Time**: ~10-15 seconds for 50 features

**When to use --full**:
- First time sync
- After major restructuring
- If registry seems out of sync
- After manually editing multiple tasks.md files

---

## Tips

### Auto-Sync After Changes

After manually updating a tasks.md file:
```bash
# Edit .specify/specs/001-user-auth/tasks.md
# ... check off some tasks ...

# Sync registry
/tasks sync --feature 001

# View update
/tasks show --active
```

### Regular Maintenance

Run full rebuild monthly:
```bash
# First day of month
/tasks sync --full --check-orphans

# This catches:
# - Orphaned TODOs
# - Out-of-sync progress
# - Missing features
```

### Before Important Milestones

```bash
# Before demo, release, or major commit
/tasks sync --full
/tasks show --stats

# Ensure registry is accurate
```

---

## Integration Examples

### Example 1: After /speckit.tasks

```javascript
// In speckit.tasks workflow:

// 1. Create tasks.md
await createTasksFile(feature, tasks)

// 2. Auto-sync registry
await runCommand('/tasks sync', { feature: feature.id })

// 3. Show updated registry
await runCommand('/tasks show', { active: true })

// User sees:
// ✅ Tasks created: .specify/specs/005-new-feature/tasks.md
// 🔄 Syncing Task Registry...
// ✅ Feature #005 added to Active Features
//
// 🚧 Active Features (3)
//   Feature #005 - New Feature (0%)
//   ...
```

### Example 2: After /post-implementation

```javascript
// In post-implementation workflow:

// 1. All tests passed
console.log('✅ All tests passed')

// 2. Mark feature complete in registry
await runCommand('/tasks sync', { feature: feature.id })

// 3. Move to Recently Completed
await updateRegistrySection(feature, 'Recently Completed')

// User sees:
// ✅ Feature #003 complete!
// 🔄 Syncing Task Registry...
// ✅ Moved to Recently Completed section
```

### Example 3: In /session-end

```javascript
// In session-end workflow:

// 1. Check for session todos
const registry = readFile('.specify/memory/task-registry.md')
const sessionTodos = extractSessionTodos(registry)

if (sessionTodos.length > 0) {
  console.warn(`⚠️ ${sessionTodos.length} session todos found!`)
  console.log('Migrate these before ending session.')
  return // Block session end
}

// 2. Sync registry
await runCommand('/tasks sync')

// 3. Show final stats
await runCommand('/tasks show', { stats: true })
```

---

*Last Updated: 2026-01-25*
*Command Version: 1.0*
