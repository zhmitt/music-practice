#!/usr/bin/env bash
set -euo pipefail

body_file=${1:-}
if [[ -z "$body_file" || ! -f "$body_file" ]]; then
  echo "Usage: $0 <pr-body-file>" >&2
  exit 2
fi

matches=$(sed -nE 's/^[[:space:]]*OpenSpec-Change:[[:space:]]*([A-Za-z0-9][A-Za-z0-9._-]*)[[:space:]]*$/\1/p' "$body_file")
count=$(printf '%s\n' "$matches" | sed '/^$/d' | wc -l | tr -d ' ')
if [[ "$count" != 1 ]]; then
  echo "PR body must contain exactly one 'OpenSpec-Change: <active-id>' declaration." >&2
  exit 1
fi
printf '%s\n' "$matches"
