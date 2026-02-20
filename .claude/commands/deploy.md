---
description: Deployment orchestration with pre/post checks.
---

# /deploy - Deploy with Validation

Runs deployment workflow with branch-to-environment mapping and health checks.

## Usage

```bash
/deploy {app-name}
```

## Expected Flow

1. Validate branch/environment context
2. Run pre-deploy checks (clean git state, tests, migrations)
3. Execute deploy command/script
4. Run health checks and post-deploy validation
5. Report result and rollback guidance if needed

## Notes

- Use for non-trivial deployments
- Keep deployment scripts in repo and reference them explicitly

