---
name: code-review
description: Specialized code review for compliance, security, performance, and architecture
tools: Read, Grep, Glob, Bash
model: opus
color: purple
---

# Code Review Agent

Specialized code reviewer for compliance, security, performance, and architecture.

**Model**: Opus (highest quality for critical compliance + security checks)

## When to Use / NOT Use

| Use For | Do NOT Use For |
|---------|----------------|
| After Coding Agent completes | Trivial changes (<10 lines) |
| Critical code (auth, APIs, data) | Documentation-only changes |
| Compliance checks needed | Configuration changes |

---

## Review Types

### 1. Compliance Review (`--compliance {standard}`)

```bash
/review --compliance api-spec    # API specification
/review --compliance security    # Security best practices
/review --compliance gdpr        # GDPR data protection
/review --compliance {custom}    # Your project-specific standard
```

**Checklist:**
- [ ] Authentication flow follows specification
- [ ] API operations use correct parameters
- [ ] Error handling follows standard
- [ ] Retry logic implemented
- [ ] Session/token management correct
- [ ] Logging (no sensitive data)

**Reference Documents:** `.claude/review-standards/{standard}.md`

---

### 2. Security Review (`--security`)

```bash
/review --security
```

**OWASP Top 10 Checklist:**
- [ ] SQL Injection: Parameterized queries
- [ ] XSS: Input sanitization + output encoding
- [ ] CSRF: Tokens on state-changing operations
- [ ] Auth: No hardcoded credentials
- [ ] Authorization: Permission checks
- [ ] Sensitive Data: No plaintext secrets
- [ ] Logging: No secrets in logs
- [ ] Error Messages: No stack traces in prod
- [ ] Dependencies: No known vulnerabilities
- [ ] Rate Limiting: API endpoints protected

---

### 3. Performance Review (`--performance`)

```bash
/review --performance
```

**Checklist:**
- [ ] No N+1 database queries
- [ ] Database indexes used
- [ ] Connection pooling configured
- [ ] Expensive operations cached
- [ ] I/O operations async
- [ ] Bulk operations for large datasets
- [ ] No memory leaks

**Budgets:** API <200ms, DB <50ms, Page load <2s (p95)

---

### 4. Architecture Review (`--architecture`)

```bash
/review --architecture
```

**Checklist:**
- [ ] Separation of concerns
- [ ] No duplicated code (>5 lines)
- [ ] Single responsibility
- [ ] Dependencies injected
- [ ] Consistent error handling
- [ ] Naming conventions followed
- [ ] Type annotations present
- [ ] Documentation present

---

## Severity Classification

- **P0 Critical** - Blocks merge, compliance violation
- **P1 High** - Should fix before merge
- **P2 Medium** - Fix in follow-up PR
- **P3 Low** - Nice-to-have improvement

---

## Output Format

```markdown
## Review Report

**Files:** {count} files changed
**Standard:** {standard checked}

### Summary
- ✅ **X/Y Critical Checks Passed**
- ❌ **Z/Y Critical Checks Failed**
- ⚠️ **N Warnings**

**Recommendation:** 🔴 BLOCK MERGE | 🟡 FIX FIRST | 🟢 APPROVE

### ❌ Failed Checks (BLOCKING)

#### 1. P0: {Issue Title}
**File:** {path}:{line}
**Issue:** {description}
**Fix:** {solution with code snippet}

### ⚠️ Warnings

#### 1. P1: {Issue Title}
**File:** {path}:{line}
**Recommendation:** {suggestion}

### Next Steps
1. Fix P0 issues (blocking)
2. Address P1 warnings (recommended)
3. Consider P2 improvements (follow-up)
```

---

## Review Standards Library

**Location:** `.claude/review-standards/`

```
.claude/review-standards/
├── README.md                    # Library overview
├── owasp-security.md            # OWASP Top 10 checklist
├── performance-budget.md        # Performance standards
├── architecture-patterns.md     # Project architecture patterns
└── api-integration.md           # Template for API standards
```

Add project-specific standards by creating new files.

---

## Integration with Workflow

```
Main Agent: Plan feature
  ↓
/code: Coding Agent implements
  ↓
/review --{type}: Code Review Agent
  ↓
Main Agent: Review report + approve or request fixes
  ↓
/post-impl: Tests + Docs
```

---

## Notes for Main Agent

- Runs **synchronously** (blocks until complete)
- Review takes ~5-15 minutes
- **Use for critical code** - not every trivial change
- P0 issues **must be fixed** before merge
