# Performance Budget - Compliance Checklist

**Use Case:** Performance anti-pattern detection and optimization

---

## Reference Documents

**Project:**
- `.specify/specs/{feature}/spec.md` - Feature performance requirements
- `docs/PERFORMANCE.md` - Project performance guidelines (if exists)

**Industry Standards:**
- API response time: <200ms (p95)
- Database query time: <50ms (p95)
- Frontend page load: <2s (p95)
- Time to Interactive (TTI): <3.5s

---

## 1. Database Performance

### Checklist

- [ ] **N+1 Query Prevention**
  - No loops with individual queries
  - Eager loading used where appropriate
  - Batch queries for multiple records

- [ ] **Indexes**
  - Database indexes on foreign keys
  - Indexes on frequently queried columns
  - Composite indexes for multi-column queries

- [ ] **Connection Pooling**
  - Database connections pooled
  - Pool size configured appropriately
  - Connections properly closed

**Examples:**

```typescript
// ✅ CORRECT - Single query with join
const users = await db.users.findAll({
  include: [{ model: db.posts }]  // Eager loading
});

// ❌ WRONG - N+1 query
const users = await db.users.findAll();
for (const user of users) {
  const posts = await db.posts.findAll({ where: { userId: user.id } });
}
```

**Severity:** 🟠 P1 High (for critical paths)

---

## 2. Caching

### Checklist

- [ ] **Response Caching**
  - Expensive operations cached
  - Cache expiry configured
  - Cache invalidation on updates

- [ ] **Cache Strategy**
  - Cache-Control headers set
  - ETags used for conditional requests
  - CDN caching for static assets

**Examples:**

```typescript
// ✅ CORRECT - Response caching
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min

async function getUser(id: number) {
  const cached = cache.get(`user:${id}`);
  if (cached) return cached;

  const user = await db.users.findById(id);
  cache.set(`user:${id}`, user);
  return user;
}

// ❌ WRONG - No caching
async function getUser(id: number) {
  return await db.users.findById(id);
}
```

**Severity:** 🟡 P2 Medium

---

## 3. Async Operations

### Checklist

- [ ] **I/O Operations**
  - I/O operations async where possible
  - Parallel execution for independent operations
  - Promise.all() for concurrent requests

- [ ] **Background Jobs**
  - Long-running tasks in background queue
  - User not blocked by slow operations

**Examples:**

```typescript
// ✅ CORRECT - Parallel execution
const [user, posts, comments] = await Promise.all([
  db.users.findById(id),
  db.posts.findAll({ userId: id }),
  db.comments.findAll({ userId: id })
]);

// ❌ WRONG - Sequential execution
const user = await db.users.findById(id);
const posts = await db.posts.findAll({ userId: id });
const comments = await db.comments.findAll({ userId: id });
```

**Severity:** 🟡 P2 Medium

---

## 4. Batch Operations

### Checklist

- [ ] **Bulk Operations**
  - Bulk inserts instead of individual
  - Batch processing for large datasets
  - Pagination for large result sets

**Examples:**

```typescript
// ✅ CORRECT - Bulk insert
await db.users.bulkCreate(users);

// ❌ WRONG - Individual inserts
for (const user of users) {
  await db.users.create(user);
}
```

**Severity:** 🟠 P1 High (for large datasets)

---

## 5. Memory Management

### Checklist

- [ ] **Memory Leaks**
  - Event listeners properly removed
  - Timers cleared
  - No circular references

- [ ] **Resource Cleanup**
  - Database connections closed
  - File handles closed
  - Streams properly ended

**Examples:**

```typescript
// ✅ CORRECT - Cleanup
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(timer);  // Cleanup
}, []);

// ❌ WRONG - No cleanup
useEffect(() => {
  setInterval(() => {
    // Do something
  }, 1000);
}, []);
```

**Severity:** 🔴 P0 Critical (if memory leak)

---

## 6. Lazy Loading

### Checklist

- [ ] **Frontend Assets**
  - Code splitting for routes
  - Lazy loading for heavy components
  - Image lazy loading

- [ ] **Backend Resources**
  - Lazy loading for heavy resources
  - On-demand data fetching

**Examples:**

```typescript
// ✅ CORRECT - Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// ❌ WRONG - Eager loading
import HeavyComponent from './HeavyComponent';

function App() {
  return <HeavyComponent />;
}
```

**Severity:** 🟡 P2 Medium

---

## 7. API Response Size

### Checklist

- [ ] **Payload Size**
  - Only necessary fields returned
  - Pagination for large datasets
  - Compression enabled (gzip)

**Examples:**

```typescript
// ✅ CORRECT - Select fields
const users = await db.users.findAll({
  attributes: ['id', 'name', 'email']  // Only needed fields
});

// ❌ WRONG - Return all fields
const users = await db.users.findAll();
```

**Severity:** 🟡 P2 Medium

---

## Performance Budgets

**API Endpoints:**
- p50: <100ms
- p95: <200ms
- p99: <500ms

**Database Queries:**
- Simple queries: <10ms
- Complex queries: <50ms
- Aggregations: <100ms

**Frontend:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s

**Thresholds:**
- 🟢 Good: Within budget
- 🟡 Warning: 10-50% over budget
- 🔴 Critical: >50% over budget

---

## Severity Classification

- 🔴 **P0 Critical** - Blocks merge
  - Memory leaks
  - Queries >1s (p95)
  - API response >2s (p95)

- 🟠 **P1 High** - Should fix before merge
  - N+1 queries on critical paths
  - Missing indexes on frequently queried columns
  - No caching for expensive operations

- 🟡 **P2 Medium** - Fix in follow-up
  - Non-critical N+1 queries
  - Missing lazy loading
  - Suboptimal batch operations

- 🟢 **P3 Low** - Nice-to-have
  - Additional caching
  - Further optimization
  - Code splitting refinement

---

## Example Review Report

```markdown
## Performance Review Report

**Reviewed:** 2026-01-13
**Files:** 2 files, 100 lines added

---

### Summary

- ✅ **4/6 Critical Checks Passed**
- ❌ **2/6 Critical Checks Failed**

**Recommendation:** 🟠 **Should fix before merge**

---

### ❌ Failed (2/6)

#### 1. 🟠 P1: N+1 Query Problem
**File:** src/services/user-service.ts:42
**Issue:** Loop with individual queries
**Fix:** Use eager loading with join

#### 2. 🟡 P2: No Response Caching
**File:** src/controllers/user-controller.ts:15
**Issue:** Expensive operation not cached
**Fix:** Add cache with 5-minute TTL

---

### Performance Metrics

| Metric | Current | Budget | Status |
|--------|---------|--------|--------|
| API response (p95) | 180ms | <200ms | 🟢 Good |
| DB query (p95) | 45ms | <50ms | 🟢 Good |
| N+1 queries | 3 | 0 | 🔴 Issue |

---

### Next Steps

1. Fix N+1 query (use eager loading)
2. Add caching (5-min TTL)
3. Re-run performance tests
```

---

## Tools

**Profiling:**
- `node --inspect` - Node.js profiling
- Chrome DevTools - Frontend profiling
- Database query analyzers (EXPLAIN)

**Monitoring:**
- Application Performance Monitoring (APM) tools
- Query performance dashboards
- Frontend performance monitoring

---

## Related Documentation

- `.claude/agents/code-review.md` - Code Review Agent
- `docs/PERFORMANCE.md` - Project performance guidelines
- `CLAUDE.md` - Performance best practices
