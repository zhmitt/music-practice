#!/bin/bash

# Check Prerequisites Script
# Validates that required documents exist before task generation

set -e

JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Get current branch
BRANCH=$(git branch --show-current)

# Find feature directory
FEATURE_DIR=".specify/specs/${BRANCH}"

# Check required files
AVAILABLE_DOCS=()

if [ -f "${FEATURE_DIR}/spec.md" ]; then
    AVAILABLE_DOCS+=("spec.md")
fi

if [ -f "${FEATURE_DIR}/plan.md" ]; then
    AVAILABLE_DOCS+=("plan.md")
fi

if [ -f "${FEATURE_DIR}/research.md" ]; then
    AVAILABLE_DOCS+=("research.md")
fi

if [ -f "${FEATURE_DIR}/data-model.md" ]; then
    AVAILABLE_DOCS+=("data-model.md")
fi

if [ -d "${FEATURE_DIR}/contracts" ]; then
    AVAILABLE_DOCS+=("contracts/")
fi

if [ -f "${FEATURE_DIR}/quickstart.md" ]; then
    AVAILABLE_DOCS+=("quickstart.md")
fi

# Check minimum requirements
if [ ! -f "${FEATURE_DIR}/plan.md" ]; then
    echo "Error: plan.md is required. Run /speckit.plan first."
    exit 1
fi

if [ ! -f "${FEATURE_DIR}/spec.md" ]; then
    echo "Error: spec.md is required. Run /speckit.specify first."
    exit 1
fi

# Output JSON if requested
if [ "$JSON_OUTPUT" = true ]; then
    # Build JSON array of available docs
    DOCS_JSON=$(printf '"%s",' "${AVAILABLE_DOCS[@]}")
    DOCS_JSON="[${DOCS_JSON%,}]"

    cat << EOF
{
    "BRANCH": "${BRANCH}",
    "FEATURE_DIR": "$(pwd)/${FEATURE_DIR}",
    "AVAILABLE_DOCS": ${DOCS_JSON}
}
EOF
else
    echo "Prerequisites check passed!"
    echo "Feature directory: ${FEATURE_DIR}"
    echo "Available documents: ${AVAILABLE_DOCS[*]}"
fi
