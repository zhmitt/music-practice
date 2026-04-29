#!/usr/bin/env bash

# change-done.sh — verifies a change is truly done by running the full done-pipeline.
#
# Usage: change-done.sh --change <change-id> [--quiet] [--skip-drift]
#
# Phases (all must exit 0 for overall exit 0):
#   1. Spec-Drift Check       (skippable with --skip-drift)
#   2. tasks.md consistency   (unchecked [ ] without annotation -> fail)
#   3. post-impl-prepare      (scaffold verification.md / report if missing)
#   4. post-impl-check        (canonical readiness check)
#   5. Claim-Evidence Check   (warning only -- reports are often prose)
#
# Exit 0:  "Change <id> is verifiably done."
# Exit 1:  one or more phases failed -- lists which phase(s) and remediation hint.

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

change_id=""
quiet=false
skip_drift=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change)
      change_id="${2:-}"
      if [[ -z "$change_id" ]]; then
        echo "Missing value for --change" >&2
        exit 1
      fi
      shift 2
      ;;
    --quiet)
      quiet=true
      shift
      ;;
    --skip-drift)
      skip_drift=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$change_id" ]]; then
  echo "Usage: change-done.sh --change <change-id> [--quiet] [--skip-drift]" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Repo root + path validation
# ---------------------------------------------------------------------------

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

scripts_dir="workflow/scripts"
change_dir="openspec/changes/${change_id}"

if [[ ! -d "$change_dir" ]]; then
  echo "Change not found: ${change_id}  (expected directory: ${change_dir})" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

phase_header() {
  local num="$1" label="$2"
  [[ "$quiet" == false ]] && echo ""
  [[ "$quiet" == false ]] && echo "=== Phase ${num}: ${label} ==="
  return 0
}

phase_skip() {
  local num="$1" label="$2" reason="$3"
  [[ "$quiet" == false ]] && echo "Phase ${num} (${label}): skipped -- ${reason}"
  return 0
}

phase_pass() {
  local num="$1" label="$2"
  [[ "$quiet" == false ]] && echo "Phase ${num} (${label}): PASS"
  return 0
}

phase_fail() {
  local num="$1" label="$2"
  echo "Phase ${num} (${label}): FAIL" >&2
}

phase_warn() {
  local num="$1" label="$2"
  echo "Phase ${num} (${label}): WARN (non-blocking)" >&2
}

failed_phases=()

# ---------------------------------------------------------------------------
# Phase 1 -- Spec-Drift Check
# ---------------------------------------------------------------------------

phase_header 1 "Spec-Drift Check"

spec_drift_script="${scripts_dir}/spec-drift-check.sh"

if [[ "$skip_drift" == true ]]; then
  phase_skip 1 "Spec-Drift" "--skip-drift flag set"
elif [[ ! -f "$spec_drift_script" ]]; then
  phase_skip 1 "Spec-Drift" "script not yet available (${spec_drift_script})"
else
  drift_args=(--change "$change_id")
  [[ "$quiet" == true ]] && drift_args+=(--quiet)
  if "${scripts_dir}/spec-drift-check.sh" "${drift_args[@]}"; then
    phase_pass 1 "Spec-Drift"
  else
    phase_fail 1 "Spec-Drift"
    failed_phases+=("1:Spec-Drift -- run: ${scripts_dir}/spec-drift-check.sh --change ${change_id}")
  fi
fi

# ---------------------------------------------------------------------------
# Phase 2 -- tasks.md consistency
# ---------------------------------------------------------------------------

phase_header 2 "tasks.md Consistency"

tasks_file="${change_dir}/tasks.md"

if [[ ! -f "$tasks_file" ]]; then
  phase_fail 2 "tasks.md Consistency"
  failed_phases+=("2:tasks.md missing -- create ${tasks_file}")
else
  # Annotation patterns that legitimately excuse an unchecked item
  allowed_open_pattern='\(User-Action — pending\)|\(User-Action -- pending\)|\(P3 follow-up\)|\(out of scope\)|\(out-of-scope\)|\(pending CI run\)'

  bad_open_items=()
  bad_checked_items=()

  line_num=0
  while IFS= read -r line; do
    line_num=$(( line_num + 1 ))

    # Unchecked items: must have an allowed annotation
    if echo "$line" | grep -qE '^\- \[ \]'; then
      if ! echo "$line" | grep -qiE "$allowed_open_pattern"; then
        bad_open_items+=("  line ${line_num}: ${line}")
      fi
    fi

    # Checked items: warn if suspiciously short (< 20 chars after stripping checkbox prefix)
    if echo "$line" | grep -qE '^\- \[[xX]\]'; then
      rest="${line#- [?]}"   # crude strip -- refine below
      rest="$(echo "$line" | sed 's/^- \[[xX]\] *//')"
      if [[ "${#rest}" -lt 20 ]]; then
        bad_checked_items+=("  line ${line_num}: ${line}  (annotation too short -- add evidence reference)")
      fi
    fi
  done < "$tasks_file"

  tasks_ok=true

  if [[ ${#bad_open_items[@]} -gt 0 ]]; then
    echo "tasks.md has unchecked items without required annotation:" >&2
    for item in "${bad_open_items[@]}"; do
      echo "$item" >&2
    done
    echo "  Required annotation: (User-Action -- pending) | (P3 follow-up) | (out of scope) | (pending CI run)" >&2
    tasks_ok=false
  fi

  if [[ ${#bad_checked_items[@]} -gt 0 ]]; then
    [[ "$quiet" == false ]] && {
      echo "tasks.md has checked items with very short text (warnings only):"
      for item in "${bad_checked_items[@]}"; do
        echo "$item"
      done
    }
    # Short checked items are warnings, not failures
  fi

  if [[ "$tasks_ok" == true ]]; then
    phase_pass 2 "tasks.md Consistency"
  else
    phase_fail 2 "tasks.md Consistency"
    failed_phases+=("2:tasks.md -- edit ${tasks_file} and annotate open items")
  fi
fi

# ---------------------------------------------------------------------------
# Phase 3 -- post-impl-prepare (scaffold if missing)
# ---------------------------------------------------------------------------

phase_header 3 "post-impl-prepare (scaffold)"

verification_file="${change_dir}/verification.md"
report_exists=false
if find workflow/state/reports -maxdepth 1 -type f -name "*${change_id}*.md" 2>/dev/null | grep -q .; then
  report_exists=true
fi

if [[ ! -f "$verification_file" || "$report_exists" == false ]]; then
  [[ "$quiet" == false ]] && echo "Scaffolding missing artifacts for ${change_id}..."
  if "${scripts_dir}/post-impl-prepare.sh" --change "$change_id" --touch; then
    phase_pass 3 "post-impl-prepare"
  else
    phase_fail 3 "post-impl-prepare"
    failed_phases+=("3:post-impl-prepare failed -- run: ${scripts_dir}/post-impl-prepare.sh --change ${change_id} --touch")
  fi
else
  phase_skip 3 "post-impl-prepare" "artifacts already exist"
fi

# ---------------------------------------------------------------------------
# Phase 4 -- post-impl-check
# ---------------------------------------------------------------------------

phase_header 4 "post-impl-check"

check_args=(--change "$change_id")
[[ "$quiet" == true ]] && check_args+=(--quiet)

if "${scripts_dir}/post-impl-check.sh" "${check_args[@]}"; then
  phase_pass 4 "post-impl-check"
else
  phase_fail 4 "post-impl-check"
  failed_phases+=("4:post-impl-check -- run: ${scripts_dir}/post-impl-check.sh --change ${change_id}")
fi

# ---------------------------------------------------------------------------
# Phase 5 -- Claim-Evidence Check on report (warning only)
# ---------------------------------------------------------------------------

phase_header 5 "Claim-Evidence Check (report)"

claim_script="${scripts_dir}/claim-evidence-check.sh"
report_file="$(find workflow/state/reports -maxdepth 1 -type f -name "*${change_id}*.md" 2>/dev/null | sort | tail -n 1 || true)"

if [[ ! -f "$claim_script" ]]; then
  phase_skip 5 "Claim-Evidence" "claim-evidence-check.sh not found"
elif [[ -z "$report_file" ]]; then
  phase_skip 5 "Claim-Evidence" "no report found for ${change_id}"
else
  [[ "$quiet" == false ]] && echo "Checking: ${report_file}"
  if bash "$claim_script" "$report_file" --quiet; then
    phase_pass 5 "Claim-Evidence"
  else
    phase_warn 5 "Claim-Evidence"
    # Not a hard failure -- reports are prose
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

[[ "$quiet" == false ]] && echo ""

if [[ ${#failed_phases[@]} -eq 0 ]]; then
  echo "Change ${change_id} is verifiably done."
  exit 0
fi

echo "Change ${change_id} is NOT done. Failed phases:" >&2
for entry in "${failed_phases[@]}"; do
  phase_num="${entry%%:*}"
  detail="${entry#*:}"
  echo "  [Phase ${phase_num}] ${detail}" >&2
done
exit 1
