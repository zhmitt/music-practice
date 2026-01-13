# Architecture Patterns - Compliance Checklist

**Use Case:** Project-specific architecture patterns and conventions

**Instructions:** Customize this file with your project's specific patterns.

---

## Reference Documents

**Project:**
- `.specify/memory/constitution.md` - Project constitution
- `docs/ARCHITECTURE.md` - Architecture documentation (if exists)
- Existing codebase patterns

---

## 1. Separation of Concerns

### Checklist

- [ ] **Layered Architecture**
  - Controllers handle HTTP/routing only
  - Services contain business logic
  - Repositories handle data access
  - No business logic in controllers

- [ ] **Domain Models**
  - Business logic in domain models
  - No framework dependencies in domain
  - Pure business rules

**Example:**

```typescript
// ✅ CORRECT - Business logic in service
class UserService {
  async registerUser(email: string, password: string) {
    // Validation logic
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email');
    }

    // Business logic
    const hashedPassword = await this.hashPassword(password);
    return await this.userRepository.create({ email, password: hashedPassword });
  }
}

class UserController {
  async register(req, res) {
    const { email, password } = req.body;
    const user = await this.userService.registerUser(email, password);
    res.json({ user });
  }
}

// ❌ WRONG - Business logic in controller
class UserController {
  async register(req, res) {
    const { email, password } = req.body;

    // Business logic in controller! Should be in service
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.create({ email, password: hashedPassword });

    res.json({ user });
  }
}
```

**Severity:** 🟠 P1 High

---

## 2. DRY Principle

### Checklist

- [ ] **Code Duplication**
  - No duplicated code (>5 lines)
  - Common logic extracted to shared functions
  - Reusable utilities in separate modules

**Example:**

```typescript
// ✅ CORRECT - Shared validation function
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

class UserService {
  async registerUser(email: string) {
    if (!validateEmail(email)) {  // Reused
      throw new ValidationError('Invalid email');
    }
  }
}

class ContactService {
  async addContact(email: string) {
    if (!validateEmail(email)) {  // Reused
      throw new ValidationError('Invalid email');
    }
  }
}

// ❌ WRONG - Duplicated validation
class UserService {
  async registerUser(email: string) {
    if (!email.includes('@')) {  // Duplicated logic
      throw new ValidationError('Invalid email');
    }
  }
}

class ContactService {
  async addContact(email: string) {
    if (!email.includes('@')) {  // Duplicated logic
      throw new ValidationError('Invalid email');
    }
  }
}
```

**Severity:** 🟡 P2 Medium

---

## 3. Single Responsibility

### Checklist

- [ ] **Class Responsibility**
  - One class does one thing
  - Clear, focused purpose
  - Easy to name and describe

- [ ] **Function Responsibility**
  - One function does one thing
  - No side effects (unless clearly named)
  - Testable in isolation

**Example:**

```typescript
// ✅ CORRECT - Single responsibility
class UserRepository {
  async findById(id: number) {
    return await db.users.findById(id);
  }

  async save(user: User) {
    return await db.users.save(user);
  }
}

class UserNotificationService {
  async sendWelcomeEmail(user: User) {
    await this.emailService.send(user.email, 'Welcome!');
  }
}

// ❌ WRONG - Multiple responsibilities
class UserRepository {
  async findById(id: number) {
    const user = await db.users.findById(id);

    // Notification logic! Should be separate service
    await this.emailService.send(user.email, 'User accessed');

    return user;
  }
}
```

**Severity:** 🟡 P2 Medium

---

## 4. Dependency Injection

### Checklist

- [ ] **Constructor Injection**
  - Dependencies injected, not imported
  - Easy to mock in tests
  - Dependencies explicit

- [ ] **No Hardcoded Dependencies**
  - No `new` for dependencies
  - Configuration injected
  - Framework/library usage abstracted

**Example:**

```typescript
// ✅ CORRECT - Dependency injection
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async registerUser(email: string) {
    const user = await this.userRepository.create({ email });
    await this.emailService.sendWelcome(user);
    return user;
  }
}

// ❌ WRONG - Hardcoded dependencies
import { UserRepository } from './user-repository';
import { EmailService } from './email-service';

class UserService {
  async registerUser(email: string) {
    const repo = new UserRepository();  // Hardcoded!
    const emailService = new EmailService();  // Hardcoded!

    const user = await repo.create({ email });
    await emailService.sendWelcome(user);
    return user;
  }
}
```

**Severity:** 🟡 P2 Medium

---

## 5. Error Handling

### Checklist

- [ ] **Consistent Pattern**
  - Project-wide error handling pattern
  - Custom error classes for different types
  - Error middleware/handler

- [ ] **Error Context**
  - Errors include context
  - Error codes for client handling
  - Stack traces preserved

**Example:**

```typescript
// ✅ CORRECT - Custom error with context
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateUser(user: User) {
  if (!user.email) {
    throw new ValidationError('Email is required', 'email');
  }
}

// ❌ WRONG - Generic error, no context
function validateUser(user: User) {
  if (!user.email) {
    throw new Error('Invalid');  // No context!
  }
}
```

**Severity:** 🟠 P1 High

---

## 6. Naming Conventions

### Checklist

- [ ] **File Naming**
  - Consistent case (kebab-case, camelCase, PascalCase)
  - Descriptive names
  - Follows project convention

- [ ] **Variable Naming**
  - Descriptive names (no `x`, `temp`, `data`)
  - Boolean variables prefixed (is, has, can)
  - Constants in UPPER_CASE

- [ ] **Function Naming**
  - Verbs for actions (get, create, update, delete)
  - Clear intent
  - Consistent prefixes

**Project Convention (customize):**
```
Files: kebab-case (user-service.ts)
Classes: PascalCase (UserService)
Functions: camelCase (getUserById)
Constants: UPPER_CASE (MAX_RETRIES)
```

**Severity:** 🟢 P3 Low

---

## 7. Type Safety

### Checklist

- [ ] **Type Annotations**
  - All public functions have type annotations
  - Parameters typed
  - Return types typed
  - No `any` (unless necessary)

**Example:**

```typescript
// ✅ CORRECT - Full type annotations
async function getUserById(id: number): Promise<User | null> {
  return await db.users.findById(id);
}

// ❌ WRONG - No type annotations
async function getUserById(id) {
  return await db.users.findById(id);
}
```

**Severity:** 🟠 P1 High

---

## 8. Documentation

### Checklist

- [ ] **Public API Documentation**
  - All public functions documented
  - Parameters described
  - Return values described
  - Throws/exceptions listed

- [ ] **Complex Logic**
  - Inline comments for complex logic
  - Why, not what
  - Assumptions documented

**Example:**

```typescript
// ✅ CORRECT - Documentation
/**
 * Registers a new user with email verification.
 *
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns The created user
 * @throws {ValidationError} If email is invalid
 * @throws {ConflictError} If email already exists
 */
async function registerUser(
  email: string,
  password: string
): Promise<User> {
  // Implementation
}

// ❌ WRONG - No documentation
async function registerUser(email: string, password: string): Promise<User> {
  // Implementation
}
```

**Severity:** 🟡 P2 Medium

---

## Project-Specific Patterns

### Add Your Patterns Here

**Example: Feature Folder Structure**
```
features/
  users/
    user.model.ts
    user.service.ts
    user.controller.ts
    user.repository.ts
    user.test.ts
```

**Example: Error Handling Pattern**
```typescript
// Centralized error handler
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  // Handle other errors
});
```

**Example: API Response Format**
```typescript
// Standard response format
{
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## Severity Classification

- 🔴 **P0 Critical** - Blocks merge
  - Architecture violation (business logic in controller)
  - Security risk in architecture

- 🟠 **P1 High** - Should fix before merge
  - Separation of concerns violated
  - Missing error handling
  - No type safety

- 🟡 **P2 Medium** - Fix in follow-up
  - Code duplication
  - Single responsibility violation
  - Missing documentation

- 🟢 **P3 Low** - Nice-to-have
  - Naming conventions
  - Code style
  - Minor refactoring

---

## Example Review Report

```markdown
## Architecture Review Report

**Reviewed:** 2026-01-13
**Files:** 3 files, 200 lines added

---

### Summary

- ✅ **6/8 Checks Passed**
- ❌ **2/8 Checks Failed**

**Recommendation:** 🟠 **Should fix before merge**

---

### ❌ Failed (2/8)

#### 1. 🟠 P1: Business Logic in Controller
**File:** src/controllers/user-controller.ts:42
**Issue:** Validation logic in controller
**Fix:** Move to UserService

#### 2. 🟡 P2: Code Duplication
**File:** src/services/user-service.ts:15, contact-service.ts:20
**Issue:** Duplicated email validation
**Fix:** Extract to shared utility

---

### Next Steps

1. Move business logic to service layer
2. Extract duplicated validation
3. Re-run architecture review
```

---

## Related Documentation

- `.claude/agents/code-review.md` - Code Review Agent
- `.specify/memory/constitution.md` - Project constitution
- `CLAUDE.md` - Architecture guidelines
