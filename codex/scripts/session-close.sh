#!/bin/bash

set -euo pipefail

summary=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --summary)
            summary="${2:-}"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ -z "$summary" ]]; then
    echo "Missing --summary \"...\"" >&2
    exit 1
fi

timestamp="$(date '+%Y-%m-%d %H:%M')"
branch="$(git branch --show-current)"

if [[ -x "codex/scripts/tasks-sync.sh" ]]; then
    codex/scripts/tasks-sync.sh >/dev/null
fi

cat >> .specify/memory/status.md <<EOF

### [${timestamp}] Session End - ${branch}

- Summary: ${summary}
- Branch: ${branch}
- Next: Read NEXT-SESSION.md and run .codex/scripts/phase-detect.sh
EOF

cat >> .specify/memory/NEXT-SESSION.md <<EOF

### ${timestamp} - Session End (${branch})

- ${summary}
- Resume with:
  - \`git checkout ${branch}\`
  - \`codex/scripts/phase-detect.sh\`
  - \`/specify\`
EOF

echo "✅ Session closure updates written to:"
echo "   - .specify/memory/status.md"
echo "   - .specify/memory/NEXT-SESSION.md"
