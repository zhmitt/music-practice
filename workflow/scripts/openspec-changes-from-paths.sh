#!/usr/bin/env bash
set -euo pipefail
while IFS= read -r path; do
  if [[ "$path" =~ ^openspec/changes/archive/([A-Za-z0-9][A-Za-z0-9._-]*)/ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
  elif [[ "$path" =~ ^openspec/changes/([A-Za-z0-9][A-Za-z0-9._-]*)/ ]]; then
    [[ "${BASH_REMATCH[1]}" != archive ]] && printf '%s\n' "${BASH_REMATCH[1]}"
  fi
done | sort -u
