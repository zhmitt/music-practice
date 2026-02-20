---
description: Run security scanning and OWASP-oriented checks before merge/deploy.
---

# /security-scan - Security Verification

Runs security-focused checks for code and dependencies.

## Usage

```bash
/security-scan
```

## Expected Flow

1. Scan for leaked secrets and unsafe patterns
2. Run dependency vulnerability checks
3. Validate common OWASP controls
4. Return severity-based findings and merge recommendation

## Notes

- Use for auth/payment/API-sensitive changes
- Treat critical findings as merge blockers

