# Git Hooks

This directory contains repository hooks for workflow enforcement.

## Install

```bash
cd .git-hooks
./install.sh
```

## Hook: pre-commit

Checks:

1. Code changes require documentation/memory updates
2. Post-implementation evidence is present for code commits
3. New inline `TODO`/`FIXME`/`XXX` comments are blocked

If blocked, address the message and retry commit.

