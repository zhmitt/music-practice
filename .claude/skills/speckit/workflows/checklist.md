# Specify: Checklist

Generate implementation checklist for feature.

## Workflow

1. **Load**: spec.md, plan.md, tasks.md, `.specify/templates/checklist-template.md`

2. **Generate Checklist**:

   ### Pre-Implementation
   - Spec-specific prerequisites
   - Dependencies to install
   - Environment setup

   ### During Implementation
   - Code quality items from plan
   - Security requirements from spec
   - Testing requirements

   ### Post-Implementation
   - Documentation to update
   - Deployment steps
   - Validation criteria

3. **Save**: `.specify/specs/[branch]/checklists/implementation.md`

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
