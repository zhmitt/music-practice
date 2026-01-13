#!/bin/bash

# Setup Plan Script
# Prepares the plan phase for a feature

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

# Find spec directory
SPECS_DIR=".specify/specs/${BRANCH}"
FEATURE_SPEC="${SPECS_DIR}/spec.md"
IMPL_PLAN="${SPECS_DIR}/plan.md"

# Validate spec exists
if [ ! -f "$FEATURE_SPEC" ]; then
    echo "Error: No spec found at ${FEATURE_SPEC}"
    echo "Run /speckit.specify first"
    exit 1
fi

# Copy plan template if not exists
if [ ! -f "$IMPL_PLAN" ]; then
    if [ -f ".specify/templates/plan-template.md" ]; then
        cp ".specify/templates/plan-template.md" "$IMPL_PLAN"

        # Get feature name from spec
        FEATURE_NAME=$(head -1 "$FEATURE_SPEC" | sed 's/# Feature Specification: //')

        # Replace placeholders
        sed -i '' "s/\[FEATURE\]/${FEATURE_NAME}/g" "$IMPL_PLAN"
        sed -i '' "s/\[###-feature-name\]/${BRANCH}/g" "$IMPL_PLAN"
        sed -i '' "s/\[DATE\]/$(date +%Y-%m-%d)/g" "$IMPL_PLAN"
    fi
fi

# Output JSON if requested
if [ "$JSON_OUTPUT" = true ]; then
    cat << EOF
{
    "BRANCH": "${BRANCH}",
    "FEATURE_SPEC": "$(pwd)/${FEATURE_SPEC}",
    "IMPL_PLAN": "$(pwd)/${IMPL_PLAN}",
    "SPECS_DIR": "$(pwd)/${SPECS_DIR}"
}
EOF
else
    echo "Plan setup complete!"
    echo "Spec: ${FEATURE_SPEC}"
    echo "Plan: ${IMPL_PLAN}"
fi
