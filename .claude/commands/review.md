---
description: Automated code review against standards (compliance, security, performance, architecture)
---

# /review - Code Review Agent

Automated code review against domain-specific standards, security best practices, performance budgets, and architecture patterns.

**Uses Opus model for highest quality compliance + security checks.**

## Usage

```bash
/review --auto                 # Auto-detect review type needed
/review --compliance {standard} # Compliance against specific standard
/review --security             # OWASP Top 10 security
/review --performance          # Performance anti-patterns
/review --architecture         # Architecture patterns
```

## Review Types

### Compliance Reviews

**Domain-Specific Standards:**
```bash
/review --compliance api-spec        # API specification compliance
/review --compliance security-policy # Security policy compliance
/review --compliance gdpr            # GDPR compliance
/review --compliance {custom}        # Your project-specific standard

Checks:
- ✅ Specification adherence
- ✅ API operations (parameters, types, order)
- ✅ Timeouts as specified
- ✅ Error handling per standard
- ✅ Retry logic (attempts, backoff)
- ✅ Session/token management
```

### Security Review

```bash
/review --security

Checks:
- OWASP Top 10 vulnerabilities
- SQL injection, XSS, CSRF
- Authentication/Authorization
- Secrets management
- Dependency vulnerabilities
```

### Performance Review

```bash
/review --performance

Checks:
- N+1 query problems
- Database indexes
- Connection pooling
- Caching strategies
- Async operations
```

### Architecture Review

```bash
/review --architecture

Checks:
- Separation of concerns
- DRY principle
- Single responsibility
- Dependency injection
- Naming conventions
```

## When to Use

**✅ Use for:**
- Critical code (external API integrations, auth, data processing)
- Security-sensitive changes
- Performance-critical paths
- Compliance-required features
- Code that must follow technical specifications

**❌ Don't use for:**
- Trivial changes (<10 lines)
- Documentation-only
- Configuration changes

## Review Report

**Output includes:**
- ✅ Passed checks
- ❌ Failed checks (with severity)
- ⚠️ Warnings
- 💡 Recommendations
- 🔧 Fix code snippets

**Severity Levels:**
- 🔴 **P0 Critical** - Blocks merge
- 🟠 **P1 High** - Should fix before merge
- 🟡 **P2 Medium** - Fix in follow-up
- 🟢 **P3 Low** - Nice-to-have

## Workflow

```
Main Agent: Plan + Architecture
  ↓
/code: Coding Agent implements
  ↓
/review --compliance api-spec: Review Agent checks (Opus)
  ↓
Main Agent: Review report + approve or request fixes
  ↓
/post-impl: Tests + Docs
```

## Example Output

```markdown
## API Compliance Review Report

✅ **5/7 Critical Checks Passed**
❌ **2/7 Critical Checks Failed**

### ❌ BLOCKING Issues (P0)

1. 🔴 Missing retry logic
   - Requirement: API Specification §4.2
   - Fix: Add @retry decorator with 3 attempts

2. 🔴 Session token not encrypted
   - Requirement: Security Standard §5.1
   - Fix: Use encrypted field type

**Recommendation:** BLOCK MERGE until P0 fixed
```

## Benefits

- ✅ Automated compliance checking
- ✅ Early bug detection
- ✅ Consistent standards enforcement
- ✅ Compliance audit trail
- ✅ Educational (review comments teach best practices)

## Adding Custom Standards

Create new compliance checklist in `.claude/review-standards/{standard}.md`:

```markdown
# {Standard Name} - Compliance Checklist

## Reference Documents
- List official specs

## Checklist
- [ ] Check 1
- [ ] Check 2

## Examples
- ✅ CORRECT: ...
- ❌ WRONG: ...
```

## See Also

- `.claude/agents/code-review.md` - Full agent documentation
- `.claude/review-standards/` - Standards library
- `CLAUDE.md` - Workflow guidelines
