#!/usr/bin/env bash
set -euo pipefail
repo_root=${WORKFLOW_CHECK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}
WORKFLOW_CHECK_ROOT="$repo_root" "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/github-workflow-check.py"
cd "$repo_root"
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/*.{yml,yaml} 2>/dev/null || actionlint .github/workflows/*.yml
else
  go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/*.yml
fi
echo "Pinned actionlint validation passed."
