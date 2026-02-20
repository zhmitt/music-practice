---
description: Synchronize technical and user documentation after code changes.
---

# /doc-update - Documentation Sync

Updates docs based on code and architecture changes.

## Usage

```bash
/doc-update
```

## Expected Flow

1. Detect changed areas (API, schema, configuration, UX)
2. Update matching documentation files
3. Update memory/status artifacts
4. Report changed docs and remaining gaps

## Notes

- Use after implementation and before commit
- Pair with `/post-implementation` for full closure

