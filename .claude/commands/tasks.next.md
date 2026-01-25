# /tasks next - Get Smart Feature Recommendation

**Purpose**: Get intelligent recommendation for next feature to work on

**Usage**:
```bash
/tasks next                # Single recommendation (best match)
/tasks next --top-3        # Top 3 recommendations with reasoning
/tasks next --ignore-hold  # Ignore features on hold
/tasks next --explain      # Detailed explanation of decision logic
```

---

## What This Command Does

1. **Reads** `.specify/memory/task-registry.md`
2. **Analyzes** all features (active, backlog)
3. **Applies** recommendation algorithm
4. **Ranks** features by priority, momentum, blockers, dependencies
5. **Returns** smart recommendation with reasoning

---

## Recommendation Algorithm

### Decision Tree

```
1. Are there P0 features in Active with blockers?
   YES → Recommend resolving blockers FIRST
   NO  → Continue

2. Are there P0 features in Active without blockers?
   YES → Recommend continuing P0 (momentum)
   NO  → Continue

3. Are there P0 features in Backlog without dependencies?
   YES → Recommend starting P0
   NO  → Continue

4. Are there P1 features in Active without blockers?
   YES → Recommend continuing P1 (momentum)
   NO  → Continue

5. Are there P1 features in Backlog without dependencies?
   YES → Recommend starting P1
   NO  → Continue

6. Are there P2 features in Backlog without dependencies?
   YES → Recommend starting P2
   NO  → Nothing actionable

7. All features blocked or on hold?
   → Recommend resolving blockers or dependencies
```

### Scoring System

Each feature gets a score based on:

| Factor | Weight | Points |
|--------|--------|--------|
| **Priority P0** | 40% | 100 points |
| **Priority P1** | 30% | 75 points |
| **Priority P2** | 20% | 50 points |
| **Already Active (Momentum)** | +25% | +25 bonus |
| **No Blockers** | Required | 0 if blocked |
| **No Dependencies** | Required | 0 if has dependencies |
| **Progress > 0% (Started)** | +15% | +15 bonus |
| **Progress < 80% (Not Done)** | Required | 0 if >80% |
| **Pending User Tests** | -20% | -20 penalty |

**Formula**:
```
Score = (PriorityPoints × PriorityWeight) + MomentumBonus + ProgressBonus - Penalties

If Blocked or Dependencies: Score = 0
If Progress > 80%: Score = 0
```

### Example Scoring

**Feature #001 - User Authentication (Active, P0, 65% progress, no blockers)**:
```
Priority: 100 × 0.40 = 40
Momentum: +25 (active)
Progress: +15 (started)
Total: 80 points
```

**Feature #002 - User Profile (Backlog, P1, 0% progress, depends on #001)**:
```
Priority: 75 × 0.30 = 22.5
Dependencies: YES → Score = 0
Total: 0 points (blocked by dependency)
```

**Feature #003 - Payment Processing (Active, P0, 20% progress, HAS blocker)**:
```
Priority: 100 × 0.40 = 40
Momentum: +25 (active)
Progress: +15 (started)
Blocker: YES → Score = 0
Total: 0 points (blocked)
```

**Feature #004 - Email Notifications (Backlog, P2, 0% progress, no dependencies)**:
```
Priority: 50 × 0.20 = 10
No Momentum: 0
No Progress: 0
Total: 10 points
```

**Recommendation**: Feature #001 (80 points) - Continue active P0 with momentum

---

## Output Format

### Default (Single Recommendation)

```
🎯 Recommended Next Feature
═══════════════════════════════════════════════════════════

Feature #001 - User Authentication
────────────────────────────────────────────────────────────
Priority: P0 (Critical)
Status: 🚧 Active (Implementation Phase)
Progress: 13/20 tasks (65%)
Blockers: None
Dependencies: None

Why this feature?
──────────────────────────────────────────────────────────
✓ Critical priority (P0)
✓ Already active - maintain momentum!
✓ 65% complete - finish what you started
✓ No blockers or dependencies
✓ Score: 80/100

Next Tasks (Pending):
──────────────────────────────────────────────────────────
⏸️ T004: Add password hashing
⏸️ T005: Implement logout functionality
⏸️ T006: Create password reset flow

Quick Links:
──────────────────────────────────────────────────────────
Spec: .specify/specs/001-user-authentication/spec.md
Tasks: .specify/specs/001-user-authentication/tasks.md
Progress: .specify/specs/001-user-authentication/progress.md

Ready to continue? Run:
  /specify  # Resume implementation
```

### --top-3 Flag

```
🎯 Top 3 Recommended Features
═══════════════════════════════════════════════════════════

#1. Feature #001 - User Authentication (Score: 80)
────────────────────────────────────────────────────────────
Priority: P0 | Status: 🚧 Active | Progress: 65%
Reason: Critical priority + Active momentum + No blockers
Next: Continue implementation (/specify)

#2. Feature #004 - Email Notifications (Score: 10)
────────────────────────────────────────────────────────────
Priority: P2 | Status: 📋 Backlog | Progress: 0%
Reason: No dependencies, ready to start
Next: Create spec (/speckit.specify)
Note: Lower priority - consider after P0/P1

#3. Feature #005 - Admin Dashboard (Score: 5)
────────────────────────────────────────────────────────────
Priority: P2 | Status: 📋 Backlog | Progress: 0%
Reason: No dependencies, but low priority
Next: Create spec (/speckit.specify)
Note: Defer unless urgent

Blocked Features (Not Recommended):
──────────────────────────────────────────────────────────
Feature #002 - User Profile (Depends on #001)
Feature #003 - Payment Processing (Blocker: API keys)

Recommendation: Focus on #1 (Feature #001)
```

### --explain Flag

```
🎯 Feature Recommendation Analysis
═══════════════════════════════════════════════════════════

Analyzing all features...

Feature #001 - User Authentication
──────────────────────────────────────────────────────────
Priority: P0 → 100 points × 0.40 = 40.0
Momentum: Active → +25 bonus
Progress: 65% started → +15 bonus
Blockers: None → OK
Dependencies: None → OK
──────────────────────────────────────────────────────────
Total Score: 80.0 ⭐ RECOMMENDED

Feature #002 - User Profile Management
──────────────────────────────────────────────────────────
Priority: P1 → 75 points × 0.30 = 22.5
Momentum: Backlog → 0 bonus
Progress: 0% → 0 bonus
Blockers: None → OK
Dependencies: YES (requires #001) → BLOCKED
──────────────────────────────────────────────────────────
Total Score: 0 (blocked by dependency)

Feature #003 - Payment Processing
──────────────────────────────────────────────────────────
Priority: P0 → 100 points × 0.40 = 40.0
Momentum: Active → +25 bonus
Progress: 20% started → +15 bonus
Blockers: YES (API keys) → BLOCKED
Dependencies: None → OK
──────────────────────────────────────────────────────────
Total Score: 0 (blocked by blocker)

Feature #004 - Email Notifications
──────────────────────────────────────────────────────────
Priority: P2 → 50 points × 0.20 = 10.0
Momentum: Backlog → 0 bonus
Progress: 0% → 0 bonus
Blockers: None → OK
Dependencies: None → OK
──────────────────────────────────────────────────────────
Total Score: 10.0

Summary:
──────────────────────────────────────────────────────────
Total Features: 4
Actionable: 2 (50%)
Blocked: 2 (50%)

Highest Score: Feature #001 (80 points)
Recommendation: Continue Feature #001

Rationale:
- Critical priority (P0)
- Already in progress (65% complete)
- No blockers or dependencies
- Maintain momentum and finish strong!

Blocked Features Should:
- #002: Wait for #001 to complete
- #003: Resolve blocker (get API keys)
```

### No Actionable Features

```
⚠️ No Actionable Features Found
═══════════════════════════════════════════════════════════

All features are either:
  🔴 Blocked by dependencies
  🔴 Blocked by external factors
  ⏸️ On hold

Blocked Features:
──────────────────────────────────────────────────────────
Feature #002 - User Profile Management
  Dependency: Requires Feature #001 (User Authentication)
  Status: #001 is 65% complete
  Recommendation: Continue #001 first, then start #002

Feature #003 - Payment Processing
  Blocker: Stripe API keys required
  Recommendation: Obtain API keys before proceeding

On Hold:
──────────────────────────────────────────────────────────
Feature #006 - Analytics Dashboard
  Reason: Awaiting product decision

What to do?
──────────────────────────────────────────────────────────
Option 1: Resolve blockers
  - Get Stripe API keys for #003
  - Contact product team about #006

Option 2: Continue active features
  - Focus on completing #001 (65% done)
  - This will unblock #002

Option 3: Start new feature
  /speckit.specify "New feature description"

Check blocker status:
  /tasks show --active
```

---

## Implementation Guidance

### Core Function: recommendNextFeature()

```javascript
async function recommendNextFeature(options = {}) {
  const { topN = 1, ignoreHold, explain } = options

  // Step 1: Read task registry
  const registry = readFile('.specify/memory/task-registry.md')
  const features = parseFeatures(registry)

  // Step 2: Filter actionable features
  const actionable = features.filter(f => {
    // Exclude completed (>80% progress)
    if (f.progress > 80) return false

    // Exclude if has blockers
    if (f.blockers && f.blockers.length > 0) return false

    // Exclude if has unmet dependencies
    if (hasDependencies(f) && !dependenciesMet(f, features)) return false

    // Exclude on-hold features (unless ignoreHold)
    if (!ignoreHold && f.status.includes('Hold')) return false

    return true
  })

  // Step 3: Score each actionable feature
  const scored = actionable.map(f => ({
    ...f,
    score: calculateScore(f)
  }))

  // Step 4: Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  // Step 5: Return top N
  const recommendations = scored.slice(0, topN)

  if (explain) {
    return explainRecommendations(features, recommendations)
  }

  return recommendations
}
```

### calculateScore(feature)

```javascript
function calculateScore(feature) {
  // Priority scoring
  const priorityMap = {
    'P0': 100,
    'P1': 75,
    'P2': 50,
    'P3': 25
  }

  const priorityWeight = {
    'P0': 0.40,
    'P1': 0.30,
    'P2': 0.20,
    'P3': 0.10
  }

  const priority = feature.priority || 'P1'
  const priorityPoints = priorityMap[priority] || 50
  const weight = priorityWeight[priority] || 0.20

  let score = priorityPoints * weight

  // Momentum bonus (already active)
  if (feature.section === 'Active Features') {
    score += 25
  }

  // Progress bonus (already started)
  if (feature.progress > 0 && feature.progress < 80) {
    score += 15
  }

  // Pending user tests penalty
  if (feature.section === 'User Test Queue') {
    score -= 20
  }

  return Math.round(score * 10) / 10  // Round to 1 decimal
}
```

### hasDependencies(feature)

```javascript
function hasDependencies(feature) {
  return feature.dependencies &&
         feature.dependencies !== 'None' &&
         feature.dependencies.length > 0
}
```

### dependenciesMet(feature, allFeatures)

```javascript
function dependenciesMet(feature, allFeatures) {
  if (!hasDependencies(feature)) return true

  // Parse dependencies (e.g., "Requires Feature #001")
  const depIds = extractDependencyIds(feature.dependencies)

  // Check if all dependencies are complete
  return depIds.every(depId => {
    const depFeature = allFeatures.find(f => f.id === depId)
    return depFeature && depFeature.progress >= 80
  })
}
```

---

## Tips

### Session Start Workflow

```bash
# 1. Check current state
/tasks show --stats

# 2. Get recommendation
/tasks next

# 3. Follow recommendation
/specify  # Resume feature
```

### Mid-Session Check-In

```bash
# Stuck on current feature?
/tasks next --top-3

# See alternatives
# Switch if higher priority unblocked
```

### Planning Phase

```bash
# What should we prioritize?
/tasks next --top-3 --explain

# See full scoring breakdown
# Make informed decisions
```

---

## Integration Examples

### Example 1: Session Start

```javascript
// In session start routine:

console.log('📋 Checking task status...')
await runCommand('/tasks show', { stats: true })

console.log('\n🎯 Getting recommendation...')
const recommendation = await runCommand('/tasks next')

console.log('\nReady to start!')
console.log(`Recommended: ${recommendation.name}`)
console.log(`Run: /specify`)
```

### Example 2: Feature Complete

```javascript
// After completing feature:

console.log('✅ Feature #003 complete!')

console.log('\n🎯 What\'s next?')
const next = await runCommand('/tasks next')

console.log(`\nNext up: Feature #${next.id}`)
console.log(`Reason: ${next.reason}`)
```

### Example 3: Stuck on Blocker

```javascript
// When encountering blocker:

console.log('🔴 Blocker detected on current feature')

console.log('\n🎯 Alternative options:')
const alternatives = await runCommand('/tasks next', { top: 3 })

console.log('While resolving blocker, you could work on:')
alternatives.forEach((alt, i) => {
  console.log(`  ${i + 1}. ${alt.name} (${alt.priority})`)
})
```

---

## Edge Cases

### All Features Blocked

Output includes:
- List of all blockers
- Suggestions to resolve
- Option to start new feature

### No Features in Registry

```
⚠️ No Features in Registry

The task registry is empty.

To get started:
  /speckit.specify "First feature description"

Or check if features exist:
  /tasks sync
```

### Only Completed Features

```
🎉 All Features Complete!

Congratulations! All features in the registry are done.

Statistics:
  Total Features: 5
  Completed: 5 (100%)
  Overall Progress: 100%

What's next?
──────────────────────────────────────────────────────────
Option 1: Start new feature
  /speckit.specify "New feature description"

Option 2: Plan Phase 2
  Review .specify/memory/feature-roadmap.md
  Identify Phase 2 priorities

Option 3: Maintenance
  - Refactoring
  - Performance optimization
  - Technical debt reduction
```

---

## Performance

- **Fast**: Reads single file (task-registry.md)
- **No Scanning**: Pre-computed data from /tasks sync
- **Instant**: < 1 second for recommendation
- **Smart**: Considers priority, momentum, blockers, dependencies

**This is why task registry is 80-90% faster!**

---

*Last Updated: 2026-01-25*
*Command Version: 1.0*
