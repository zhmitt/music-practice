#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

chmod +x "$REPO_ROOT/.git-hooks/pre-commit"
git -C "$REPO_ROOT" config core.hooksPath .git-hooks

echo "✅ Installed git hooks (core.hooksPath=.git-hooks)"

