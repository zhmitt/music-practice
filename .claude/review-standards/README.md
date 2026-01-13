# Code Review Standards Library

**Location:** `.claude/review-standards/`

This directory contains compliance checklists and review standards for the Code Review Agent (Opus).

---

## Available Standards

| Standard | File | Use Case |
|----------|------|----------|
| **OWASP Security** | `owasp-security.md` | Security vulnerabilities (OWASP Top 10) |
| **Performance Budget** | `performance-budget.md` | Database queries, API response times |
| **Architecture Patterns** | `architecture-patterns.md` | Project-specific patterns (customize per project) |
| **API Integration** | `api-integration.md` | Template for external API standards |

---

## Usage

**Code Review Agent automatically loads relevant standards:**

```bash
# Agent reads this file:
/review --compliance api-spec
→ Loads: api-integration.md + project-specific requirements

/review --security
→ Loads: owasp-security.md

/review --performance
→ Loads: performance-budget.md
```

---

## Adding New Standards

**To add a new compliance standard:**

1. **Create checklist file**
   ```bash
   touch .claude/review-standards/{standard-name}.md
   ```

2. **Use template structure**
   - Reference documents
   - Checklist sections
   - Examples (correct vs wrong code)
   - Severity classification
   - Example review report

3. **Update Code Review Agent**
   - Add standard to `.claude/agents/code-review.md`
   - Add command to `.claude/commands/review.md`

4. **Test**
   ```bash
   /review --compliance {standard-name}
   ```

---

## Template Structure

```markdown
# {Standard Name} - Compliance Checklist

**Use Case:** ...

---

## Reference Documents
- List official specs
- List project docs

---

## 1. Category Name

### Checklist
- [ ] Check 1
- [ ] Check 2

**Example:**
```{language}
# ✅ CORRECT
...

# ❌ WRONG
...
```

---

## Severity Classification
- 🔴 P0 Critical - Blocks merge
- 🟠 P1 High - Should fix before merge
- 🟡 P2 Medium - Fix in follow-up
- 🟢 P3 Low - Nice-to-have

---

## Example Review Report
...
```

---

## Project-Specific Standards

**Customize for your domain:**
- `architecture-patterns.md` - Your project's architecture patterns
- `{domain}-compliance.md` - Domain-specific compliance (finance, healthcare, legal, etc.)
- `{api-name}-integration.md` - Specific API integration standards

**Examples from real projects:**
- `gdpr-compliance.md` - GDPR data protection (for EU projects)
- `hipaa-compliance.md` - HIPAA compliance (for healthcare)
- `pci-dss-compliance.md` - PCI-DSS (for payment processing)
- `stripe-api-integration.md` - Stripe API standards

---

## Maintenance

**Update standards when:**
- Official specifications change
- New security vulnerabilities discovered
- Project patterns evolve
- Compliance requirements change

**Version Control:**
- Keep old versions for reference
- Document version changes
- Update review agent accordingly

---

## Generic vs Project-Specific

**Generic Standards (template provides):**
- ✅ `owasp-security.md` - Universal security standards
- ✅ `performance-budget.md` - Universal performance patterns
- ✅ `api-integration.md` - Template for API integrations

**Project-Specific Standards (you add):**
- 📝 `architecture-patterns.md` - Customize for your project
- 📝 `{domain}-compliance.md` - Add for your domain
- 📝 `{api-name}-integration.md` - Add for specific APIs you integrate

---

## Benefits

- ✅ Consistent standards enforcement across team
- ✅ Automated compliance checking
- ✅ Educational (team learns from review comments)
- ✅ Audit trail (all reviews documented)
- ✅ Onboarding (new developers learn standards)
- ✅ Quality gates (P0 issues block merge)

---

## Related Documentation

- `.claude/agents/code-review.md` - Code Review Agent documentation
- `.claude/commands/review.md` - Review command usage
- `CLAUDE.md` - Project workflow guidelines
