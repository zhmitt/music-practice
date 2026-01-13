# External API Integration - Compliance Checklist Template

**Use Case:** Template for external API integrations (Stripe, Twilio, AWS, etc.)

**Instructions:** Copy this template and customize for your specific API.

---

## Reference Documents

**Location:** `docs/specifications/` or project docs

**For {API_NAME}:**
- Official API documentation: {URL}
- Technical specifications: {URL}
- Integration guides: {URL}
- Feature spec.md: `.specify/specs/{feature}/spec.md`

---

## 1. Authentication Flow

### Checklist

- [ ] **Authentication flow follows specification**
  - Steps in correct order
  - All required steps present
  - No steps omitted

- [ ] **Authentication credentials secure**
  - API keys/secrets not hardcoded
  - Credentials from environment variables or secrets manager
  - No credentials in logs

- [ ] **Session management correct** (if applicable)
  - Session tokens encrypted
  - Expiry handled correctly
  - Refresh logic implemented

**Example:**

```typescript
// ✅ CORRECT - Credentials from environment
const apiClient = new APIClient({
  apiKey: process.env.API_KEY,  // From environment
  apiSecret: process.env.API_SECRET
});

// ❌ WRONG - Hardcoded credentials
const apiClient = new APIClient({
  apiKey: 'sk_live_hardcoded123',  // Hardcoded!
  apiSecret: 'secret123'
});
```

**Severity:** 🔴 P0 Critical

---

## 2. API Operations

### Checklist

- [ ] **Operation names correct**
  - Match API specification exactly
  - Case-sensitive correctness

- [ ] **Parameters correct**
  - Names match specification
  - Types correct (string, number, boolean, etc.)
  - Order correct (if order-sensitive)
  - Required parameters present
  - Optional parameters handled

- [ ] **Return values handled**
  - Expected return type checked
  - Null/undefined handled
  - Errors parsed correctly

**Example:**

```typescript
// ✅ CORRECT - Parameters match spec
const charge = await stripe.charges.create({
  amount: 2000,           // Correct name + type (number)
  currency: 'usd',        // Correct name + type (string)
  source: tokenId,        // Correct name
  description: 'Payment'  // Optional parameter
});

// ❌ WRONG - Wrong parameter names
const charge = await stripe.charges.create({
  total: 2000,            // Wrong name! Should be 'amount'
  curr: 'usd',            // Wrong name! Should be 'currency'
  token: tokenId          // Wrong name! Should be 'source'
});
```

**Severity:** 🔴 P0 Critical

---

## 3. Timeouts & Retry Logic

### Checklist

- [ ] **Timeouts configured**
  - Match specification (if specified)
  - Explicit (not default)
  - Reasonable for operation type

- [ ] **Retry logic implemented**
  - Max retry attempts specified
  - Backoff strategy (exponential, linear)
  - Idempotency considered
  - Non-retryable errors handled

**Example:**

```typescript
// ✅ CORRECT - Retry with exponential backoff
import { retry } from 'ts-retry';

@retry({
  maxAttempts: 3,
  backoff: 'EXPONENTIAL',
  backoffDelay: 1000
})
async function apiCall(params: any) {
  return await client.request(params, { timeout: 30000 });  // Explicit timeout
}

// ❌ WRONG - No retry, no explicit timeout
async function apiCall(params: any) {
  return await client.request(params);
}
```

**Severity:** 🟠 P1 High

---

## 4. Error Handling

### Checklist

- [ ] **Errors follow API standard**
  - Correct exception types
  - Error codes mapped correctly
  - Error messages informative

- [ ] **Error propagation correct**
  - Errors wrapped in domain exceptions
  - Original error preserved (cause chain)
  - Stack traces logged (not shown to user)

**Example:**

```typescript
// ✅ CORRECT - Error handling with context
try {
  const result = await apiClient.call(params);
  return result;
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    logger.error('Rate limit exceeded', { error });
    throw new APIError('Rate limit exceeded. Please try again later.');
  }
  logger.error('API call failed', { error });
  throw new APIError(`API call failed: ${error.message}`);
}

// ❌ WRONG - Generic error, no context
try {
  return await apiClient.call(params);
} catch (error) {
  throw error;  // No context, no logging
}
```

**Severity:** 🟠 P1 High

---

## 5. Data Validation

### Checklist

- [ ] **Input validation**
  - Required fields present
  - Data types correct
  - Lengths/ranges checked
  - Format validation (emails, dates, etc.)

- [ ] **Output validation**
  - Response schema validated
  - Required fields checked
  - Data types verified

**Example:**

```typescript
// ✅ CORRECT - Input validation
async function createCharge(amount: number, currency: string) {
  if (amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }
  if (!['usd', 'eur', 'gbp'].includes(currency)) {
    throw new ValidationError('Invalid currency');
  }

  const result = await stripe.charges.create({ amount, currency });

  if (!result.id) {
    throw new APIError('Invalid response: missing charge ID');
  }

  return result;
}

// ❌ WRONG - No validation
async function createCharge(amount: number, currency: string) {
  return await stripe.charges.create({ amount, currency });
}
```

**Severity:** 🟠 P1 High

---

## 6. Security

### Checklist

- [ ] **TLS/HTTPS enforced**
  - No HTTP fallback
  - TLS 1.2+ used
  - Certificate validation enabled

- [ ] **Secrets management**
  - API keys in environment variables
  - Webhooks validated (signature verification)
  - No secrets in logs

- [ ] **Rate limiting respected**
  - API rate limits checked
  - Backoff on rate limit exceeded

**Example:**

```typescript
// ✅ CORRECT - Webhook signature verification
import { verify } from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

// ❌ WRONG - No signature verification
function handleWebhook(payload: any) {
  // Process webhook without verification (security risk!)
  processPayment(payload);
}
```

**Severity:** 🔴 P0 Critical

---

## 7. Testing

### Checklist

- [ ] **Unit tests**
  - Mock API responses
  - Test happy path
  - Test error cases
  - Test edge cases

- [ ] **Integration tests**
  - Test against sandbox/test environment
  - Verify authentication flow
  - Test error scenarios

**Example:**

```typescript
// ✅ CORRECT - Unit tests
describe('StripeService', () => {
  it('should create charge successfully', async () => {
    const mockCharge = { id: 'ch_123', amount: 2000 };
    jest.spyOn(stripe.charges, 'create').mockResolvedValue(mockCharge);

    const result = await service.createCharge(2000, 'usd');

    expect(result).toEqual(mockCharge);
    expect(stripe.charges.create).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'usd'
    });
  });

  it('should throw on rate limit', async () => {
    jest.spyOn(stripe.charges, 'create').mockRejectedValue({
      code: 'rate_limit_exceeded'
    });

    await expect(service.createCharge(2000, 'usd')).rejects.toThrow(APIError);
  });
});
```

**Severity:** 🟡 P2 Medium

---

## Severity Classification

- 🔴 **P0 Critical** - Blocks merge
  - Hardcoded credentials
  - Wrong API parameters
  - No error handling
  - Security vulnerabilities

- 🟠 **P1 High** - Should fix before merge
  - Missing retry logic
  - Missing input validation
  - No timeout configuration

- 🟡 **P2 Medium** - Fix in follow-up
  - Missing tests
  - Insufficient logging
  - Minor optimization

- 🟢 **P3 Low** - Nice-to-have
  - Code style
  - Additional tests
  - Documentation

---

## Example Review Report

```markdown
## {API_NAME} Integration Review Report

**Reviewed:** 2026-01-13
**Files:** 2 files, 150 lines added
**API:** {API_NAME} v{VERSION}

---

### Summary

- ✅ **6/8 Critical Checks Passed**
- ❌ **2/8 Critical Checks Failed**

**Recommendation:** 🔴 **BLOCK MERGE** - Fix P0 issues

---

### ❌ Failed (2/8) - BLOCKING

#### 1. 🔴 P0: Hardcoded API Key
**File:** src/services/api-service.ts:10
**Issue:** API key hardcoded in code
**Fix:** Move to environment variable

#### 2. 🟠 P1: Missing Retry Logic
**File:** src/services/api-service.ts:42
**Issue:** No retry on network errors
**Fix:** Add retry with exponential backoff

---

### Next Steps

1. Move API key to environment variable
2. Add retry logic
3. Re-run review
4. Proceed to merge
```

---

## Customization Instructions

**To adapt this template for a specific API:**

1. Replace `{API_NAME}` with actual API name (Stripe, Twilio, etc.)
2. Add API-specific authentication requirements
3. Update parameter examples with actual API parameters
4. Add API-specific error codes and handling
5. Update reference document URLs
6. Add API-specific rate limits
7. Customize severity classification if needed

**Example APIs to create checklists for:**
- Payment: Stripe, PayPal, Square
- Communication: Twilio, SendGrid, Mailgun
- Cloud: AWS S3, Google Cloud Storage, Azure Blob
- Data: Airtable, Google Sheets API, Notion API

---

## Related Documentation

- `.claude/agents/code-review.md` - Code Review Agent
- `.claude/review-standards/README.md` - Standards library overview
- `CLAUDE.md` - Project guidelines
