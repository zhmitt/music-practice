#!/bin/bash

# Create New Feature Script
# Creates a new feature branch and initializes spec structure

set -e

# Parse arguments
JSON_OUTPUT=false
FEATURE_NUMBER=""
SHORT_NAME=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --number)
            FEATURE_NUMBER="$2"
            shift 2
            ;;
        --short-name)
            SHORT_NAME="$2"
            shift 2
            ;;
        *)
            DESCRIPTION="$1"
            shift
            ;;
    esac
done

# Validate inputs
if [ -z "$SHORT_NAME" ] || [ -z "$FEATURE_NUMBER" ]; then
    echo "Error: --short-name and --number are required"
    exit 1
fi

# Format feature number with leading zeros
PADDED_NUMBER=$(printf "%03d" "$FEATURE_NUMBER")

# Create branch name
BRANCH_NAME="${PADDED_NUMBER}-${SHORT_NAME}"

# Create spec directory
SPEC_DIR=".specify/specs/${BRANCH_NAME}"
SPEC_FILE="${SPEC_DIR}/spec.md"

# Create the branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Create spec directory structure
mkdir -p "$SPEC_DIR"
mkdir -p "${SPEC_DIR}/checklists"

# Copy spec template
if [ -f ".specify/templates/spec-template.md" ]; then
    cp ".specify/templates/spec-template.md" "$SPEC_FILE"

    # Replace placeholders
    sed -i '' "s/\[FEATURE NAME\]/${DESCRIPTION:-$SHORT_NAME}/g" "$SPEC_FILE"
    sed -i '' "s/\[###-feature-name\]/${BRANCH_NAME}/g" "$SPEC_FILE"
    sed -i '' "s/\[DATE\]/$(date +%Y-%m-%d)/g" "$SPEC_FILE"
fi

# Create progress.md
cat > "${SPEC_DIR}/progress.md" << EOF
# Progress: ${DESCRIPTION:-$SHORT_NAME}

**Branch**: ${BRANCH_NAME}
**Created**: $(date +%Y-%m-%d)
**Status**: Specification Phase

## Session Log

### $(date +%Y-%m-%d) - Initial Creation
- Feature branch created
- Spec structure initialized
- Ready for specification

## Current State

Phase: Specification
Next Step: Complete spec.md with user stories and requirements

## Blockers

None

## Notes

EOF

# Output JSON if requested
if [ "$JSON_OUTPUT" = true ]; then
    cat << EOF
{
    "BRANCH_NAME": "${BRANCH_NAME}",
    "SPEC_DIR": "$(pwd)/${SPEC_DIR}",
    "SPEC_FILE": "$(pwd)/${SPEC_FILE}",
    "FEATURE_NUMBER": "${FEATURE_NUMBER}",
    "SHORT_NAME": "${SHORT_NAME}"
}
EOF
else
    echo "Feature created successfully!"
    echo "Branch: ${BRANCH_NAME}"
    echo "Spec file: ${SPEC_FILE}"
fi
