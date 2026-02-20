#!/bin/bash

set -euo pipefail

run_tests=false
use_staged=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-tests)
            run_tests=true
            shift
            ;;
        --working-tree)
            use_staged=false
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ "$use_staged" == true ]]; then
    changed_files=$(git diff --cached --name-only --diff-filter=ACMR)
else
    changed_files=$(git diff --name-only --diff-filter=ACMR)
fi

if [[ -z "$changed_files" ]]; then
    echo "No changed files detected."
    exit 0
fi

code_regex='\.(c|cc|cpp|cs|go|h|hpp|java|js|jsx|kt|mjs|php|py|rb|rs|scala|sh|sql|swift|ts|tsx)$'
docs_regex='^(README\.md|CHANGELOG\.md|CLAUDE\.md|docs/|\.specify/memory/|\.specify/specs/.+/(spec|plan|tasks|progress|usertests)\.md)'
report_regex='^\.specify/memory/reports/post-implementation-.*\.md$'

has_code=false
has_docs=false
has_post_impl_evidence=false

while IFS= read -r file; do
    [ -z "$file" ] && continue

    if [[ "$file" =~ $code_regex ]]; then
        has_code=true
    fi

    if [[ "$file" =~ $docs_regex ]]; then
        has_docs=true
    fi

    if [[ "$file" =~ $report_regex ]] || [[ "$file" == ".specify/memory/status.md" ]] || [[ "$file" == ".specify/memory/task-registry.md" ]] || [[ "$file" == ".specify/memory/NEXT-SESSION.md" ]]; then
        has_post_impl_evidence=true
    fi
done <<< "$changed_files"

if [[ "$has_code" == true && "$has_docs" == false ]]; then
    echo "❌ Failed: code changes detected without docs/memory updates."
    exit 1
fi

if [[ "$has_code" == true && "$has_post_impl_evidence" == false ]]; then
    echo "❌ Failed: missing post-implementation evidence."
    exit 1
fi

if [[ "$run_tests" == true ]]; then
    echo "Running tests..."
    if [[ -f "package.json" ]]; then
        (pnpm test >/dev/null 2>&1 || npm test >/dev/null 2>&1)
    elif [[ -f "pyproject.toml" ]] || [[ -f "pytest.ini" ]]; then
        pytest >/dev/null
    else
        echo "No known test runner configuration found, skipping."
    fi
fi

echo "✅ Post-implementation check passed."

