---
description: Generate an implementation checklist for a feature.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Load Context**:
   - Read current branch: `git branch --show-current`
   - Load `.specify/specs/[branch]/spec.md`
   - Load `.specify/specs/[branch]/plan.md`
   - Load `.specify/specs/[branch]/tasks.md` (if exists)
   - Load `.specify/templates/checklist-template.md`

2. **Generate Checklist**:

   Using the template as base, customize for the feature:

   ### Pre-Implementation
   - Spec-specific prerequisites
   - Dependencies to install
   - Environment setup needed

   ### During Implementation
   - Code quality items from plan
   - Security requirements from spec
   - Testing requirements

   ### Post-Implementation
   - Documentation to update
   - Deployment steps
   - Validation criteria

3. **Save Checklist**:
   - Write to `.specify/specs/[branch]/checklists/implementation.md`
   - Include feature-specific items
   - Add links to relevant documents

4. **Report**:
   - Checklist location
   - Key items to watch
   - Ready for implementation

## Checklist Categories

### Code Quality
- [ ] Code follows project conventions
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] Logging added

### Security
- [ ] No secrets in code
- [ ] Input validation
- [ ] Auth/authz correct

### Testing
- [ ] Critical paths tested
- [ ] Edge cases covered
- [ ] Tests pass

### Documentation
- [ ] Code comments where needed
- [ ] API docs updated
- [ ] Working memory updated
