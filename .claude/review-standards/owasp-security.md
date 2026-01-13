# OWASP Security - Compliance Checklist

**Use Case:** Security vulnerability checks based on OWASP Top 10

**Reference:** https://owasp.org/www-project-top-ten/

---

## Reference Documents

**Official:**
- OWASP Top 10 (latest version)
- OWASP Application Security Verification Standard (ASVS)

**Project:**
- `.specify/specs/{feature}/spec.md` - Feature security requirements
- `docs/SECURITY.md` - Project security guidelines (if exists)

---

## 1. Injection Attacks

### Checklist

- [ ] **SQL Injection Prevention**
  - Parameterized queries used (no string concatenation)
  - ORM used correctly
  - Input validation present

- [ ] **Command Injection Prevention**
  - No user input passed directly to system commands
  - If unavoidable, strict input validation + sanitization

- [ ] **LDAP/NoSQL Injection Prevention**
  - Parameterized queries for NoSQL
  - Input sanitization for LDAP

**Examples:**

```typescript
// ✅ CORRECT - Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ WRONG - String concatenation (SQL injection risk)
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Severity:** 🔴 P0 Critical

---

## 2. Broken Authentication

### Checklist

- [ ] **Password Security**
  - Passwords hashed (bcrypt, Argon2, PBKDF2)
  - No plaintext passwords stored
  - Strong password policy enforced

- [ ] **Session Management**
  - Session tokens cryptographically random
  - Session tokens encrypted at rest
  - Session expiry configured
  - Logout invalidates session

- [ ] **Multi-Factor Authentication**
  - MFA available for sensitive operations (if applicable)
  - MFA backup codes available

- [ ] **Credential Storage**
  - No hardcoded credentials
  - Environment variables or secrets manager used

**Examples:**

```typescript
// ✅ CORRECT - Hashed password
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
await db.users.create({ email, password: hashedPassword });

// ❌ WRONG - Plaintext password
await db.users.create({ email, password });
```

**Severity:** 🔴 P0 Critical

---

## 3. Sensitive Data Exposure

### Checklist

- [ ] **Data in Transit**
  - HTTPS/TLS enforced (no HTTP)
  - TLS 1.2+ used
  - Strong cipher suites

- [ ] **Data at Rest**
  - Sensitive data encrypted
  - Encryption keys stored securely
  - Database encryption enabled (if applicable)

- [ ] **Logging**
  - No passwords in logs
  - No API keys in logs
  - No PII in logs (or hashed/pseudonymized)

- [ ] **Error Messages**
  - No sensitive data in error messages
  - No stack traces in production

**Examples:**

```typescript
// ✅ CORRECT - No sensitive data in logs
logger.info('User login attempt', { userId: user.id });

// ❌ WRONG - Password in logs
logger.info('User login', { email, password });
```

**Severity:** 🔴 P0 Critical

---

## 4. XML External Entities (XXE)

### Checklist

- [ ] **XML Parsing**
  - XML parser disables external entities
  - DTD processing disabled
  - XSLT disabled (if not needed)

**Examples:**

```typescript
// ✅ CORRECT - XXE protection
import { parseString } from 'xml2js';

parseString(xmlString, {
  explicitRoot: false,
  explicitArray: false,
  ignoreAttrs: true,
  // XXE protection
  xmldec: false,
  doctype: false
}, (err, result) => {
  // Handle result
});

// ❌ WRONG - Default parser (vulnerable to XXE)
parseString(xmlString, (err, result) => {
  // Handle result
});
```

**Severity:** 🟠 P1 High

---

## 5. Broken Access Control

### Checklist

- [ ] **Authorization Checks**
  - Authorization checked on every request
  - Authorization enforced server-side (not client-side only)
  - Proper role-based access control (RBAC)

- [ ] **Direct Object References**
  - No direct object references without authorization
  - Resource ownership verified

- [ ] **API Endpoints**
  - All endpoints have authorization
  - No endpoints bypass authentication

**Examples:**

```typescript
// ✅ CORRECT - Authorization checked
async function getUser(userId: number, requestingUserId: number) {
  if (userId !== requestingUserId && !isAdmin(requestingUserId)) {
    throw new ForbiddenError('Not authorized');
  }
  return await db.users.findById(userId);
}

// ❌ WRONG - No authorization check
async function getUser(userId: number) {
  return await db.users.findById(userId);
}
```

**Severity:** 🔴 P0 Critical

---

## 6. Security Misconfiguration

### Checklist

- [ ] **Defaults**
  - Default credentials changed
  - Unnecessary features disabled
  - Debug mode off in production

- [ ] **Error Handling**
  - Generic error messages in production
  - Detailed errors only in development

- [ ] **Security Headers**
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security (HSTS)

**Examples:**

```typescript
// ✅ CORRECT - Security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ❌ WRONG - No security headers
app.use(express.json());
```

**Severity:** 🟠 P1 High

---

## 7. Cross-Site Scripting (XSS)

### Checklist

- [ ] **Input Validation**
  - All user input validated
  - Whitelist validation where possible

- [ ] **Output Encoding**
  - All user input encoded before display
  - Framework escaping used (React, Vue auto-escape)
  - HTML context escaping correct

- [ ] **Content Security Policy**
  - CSP header configured
  - Inline scripts avoided

**Examples:**

```typescript
// ✅ CORRECT - React auto-escapes
function UserProfile({ user }) {
  return <div>{user.name}</div>;  // Auto-escaped
}

// ❌ WRONG - dangerouslySetInnerHTML without sanitization
function UserProfile({ user }) {
  return <div dangerouslySetInnerHTML={{ __html: user.bio }} />;
}
```

**Severity:** 🔴 P0 Critical

---

## 8. Insecure Deserialization

### Checklist

- [ ] **Deserialization**
  - No deserialization of untrusted data
  - If unavoidable, strict type checking
  - Signature/MAC verification

- [ ] **Object Validation**
  - Deserialized objects validated
  - No automatic property binding from user input

**Examples:**

```typescript
// ✅ CORRECT - JSON parsing (safe)
const data = JSON.parse(jsonString);

// ❌ WRONG - Eval (code injection risk)
const data = eval(`(${jsonString})`);
```

**Severity:** 🟠 P1 High

---

## 9. Using Components with Known Vulnerabilities

### Checklist

- [ ] **Dependency Management**
  - Dependencies up to date
  - No known vulnerabilities (run npm audit / pip-audit)
  - Vulnerability scanning in CI/CD

- [ ] **Dependency Pinning**
  - Exact versions pinned (not ranges)
  - Lock files committed

**Commands:**

```bash
# Check for vulnerabilities
npm audit
pip-audit

# Fix vulnerabilities
npm audit fix
```

**Severity:** 🟠 P1 High

---

## 10. Insufficient Logging & Monitoring

### Checklist

- [ ] **Security Events Logged**
  - Failed login attempts
  - Access control failures
  - Input validation failures
  - Suspicious activity

- [ ] **Log Protection**
  - Logs not tamper-able
  - Logs stored securely
  - Log retention policy

- [ ] **Monitoring**
  - Alerts configured for security events
  - Incident response plan exists

**Examples:**

```typescript
// ✅ CORRECT - Security event logged
logger.warn('Failed login attempt', {
  email: hashEmail(email),
  ip: req.ip,
  timestamp: new Date()
});

// ❌ WRONG - No logging
if (!isValidPassword(password)) {
  throw new AuthError('Invalid credentials');
}
```

**Severity:** 🟡 P2 Medium

---

## 11. Cross-Site Request Forgery (CSRF)

### Checklist

- [ ] **CSRF Protection**
  - CSRF tokens for state-changing operations
  - SameSite cookie attribute set
  - Double-submit cookie pattern (if applicable)

- [ ] **API Endpoints**
  - POST/PUT/DELETE protected
  - GET endpoints idempotent (no side effects)

**Examples:**

```typescript
// ✅ CORRECT - CSRF protection middleware
import csrf from 'csurf';

app.use(csrf({ cookie: true }));

app.post('/api/users', (req, res) => {
  // CSRF token automatically verified
});

// ❌ WRONG - No CSRF protection
app.post('/api/users', (req, res) => {
  // Vulnerable to CSRF
});
```

**Severity:** 🟠 P1 High

---

## 12. Rate Limiting

### Checklist

- [ ] **API Endpoints**
  - Rate limiting configured
  - Per-user or per-IP limits
  - Brute-force protection for auth endpoints

**Examples:**

```typescript
// ✅ CORRECT - Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// ❌ WRONG - No rate limiting
app.use('/api/', router);
```

**Severity:** 🟡 P2 Medium

---

## Severity Classification

Use these severity levels when reporting issues:

- 🔴 **P0 Critical** - Blocks merge, security vulnerability
  - SQL injection, XSS, authentication bypass
  - Plaintext password storage
  - Hardcoded credentials
  - Missing authorization checks

- 🟠 **P1 High** - Should fix before merge
  - Missing CSRF protection
  - Missing rate limiting
  - Known vulnerabilities in dependencies
  - Missing security headers

- 🟡 **P2 Medium** - Fix in follow-up PR
  - Insufficient logging
  - Missing input validation (non-critical paths)
  - Weak error messages

- 🟢 **P3 Low** - Nice-to-have improvement
  - Code style
  - Additional monitoring
  - Documentation

---

## Example Review Report

```markdown
## OWASP Security Review Report

**Reviewed:** 2026-01-13
**Files:** 3 files, 200 lines added

---

### Summary

- ✅ **8/10 Critical Checks Passed**
- ❌ **2/10 Critical Checks Failed**

**Recommendation:** 🔴 **BLOCK MERGE** - Fix P0 issues

---

### ❌ Failed (2/10) - BLOCKING

#### 1. 🔴 P0: SQL Injection Vulnerability
**File:** src/services/user-service.ts:42
**Issue:** String concatenation in SQL query
**Fix:** Use parameterized query

#### 2. 🔴 P0: Plaintext Password Storage
**File:** src/models/user.ts:15
**Issue:** Password stored without hashing
**Fix:** Hash with bcrypt before storage

---

### Next Steps

1. Fix SQL injection (parameterized queries)
2. Hash passwords (bcrypt)
3. Re-run security review
4. Proceed to merge after fixes
```

---

## Tools

**Automated Security Scanning:**
- `npm audit` / `yarn audit` - JavaScript dependencies
- `pip-audit` - Python dependencies
- `bandit` - Python security linter
- `semgrep` - Multi-language security patterns
- `eslint-plugin-security` - JavaScript security linting

**CI/CD Integration:**
```yaml
# GitHub Actions example
- name: Security audit
  run: npm audit --audit-level=high
```

---

## Related Documentation

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- `.claude/agents/code-review.md` - Code Review Agent
- `CLAUDE.md` - Project security guidelines
