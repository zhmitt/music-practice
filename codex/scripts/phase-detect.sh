#!/bin/bash

set -euo pipefail

json_output=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            json_output=true
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

branch="$(git branch --show-current)"
feature_dir=".specify/specs/${branch}"

spec_exists=false
plan_exists=false
tasks_exists=false
phase=0
phase_name="No Spec"
next_action="/speckit.specify <feature description>"
total_tasks=0
completed_tasks=0

if [[ -f "${feature_dir}/spec.md" ]]; then
    spec_exists=true
fi

if [[ -f "${feature_dir}/plan.md" ]]; then
    plan_exists=true
fi

if [[ -f "${feature_dir}/tasks.md" ]]; then
    tasks_exists=true
    total_tasks=$(rg -N '^- \[( |x|X)\]' "${feature_dir}/tasks.md" | wc -l | tr -d ' ')
    completed_tasks=$(rg -N '^- \[[xX]\]' "${feature_dir}/tasks.md" | wc -l | tr -d ' ')
fi

if [[ "$spec_exists" == true && "$plan_exists" == false ]]; then
    phase=1
    phase_name="Spec Only"
    next_action="/speckit.plan"
elif [[ "$spec_exists" == true && "$plan_exists" == true && "$tasks_exists" == false ]]; then
    phase=2
    phase_name="Planned"
    next_action="/spec-review then /speckit.tasks"
elif [[ "$spec_exists" == true && "$plan_exists" == true && "$tasks_exists" == true ]]; then
    if [[ "$total_tasks" -gt 0 && "$completed_tasks" -eq "$total_tasks" ]]; then
        phase=4
        phase_name="Implemented"
        next_action="/post-implementation"
    else
        phase=3
        phase_name="Tasked"
        next_action="/speckit.implement"
    fi
fi

if [[ "$json_output" == true ]]; then
    cat <<EOF
{
  "branch": "${branch}",
  "feature_dir": "${feature_dir}",
  "phase": ${phase},
  "phase_name": "${phase_name}",
  "spec_exists": ${spec_exists},
  "plan_exists": ${plan_exists},
  "tasks_exists": ${tasks_exists},
  "total_tasks": ${total_tasks},
  "completed_tasks": ${completed_tasks},
  "next_action": "${next_action}"
}
EOF
else
    echo "Branch: ${branch}"
    echo "Feature Dir: ${feature_dir}"
    echo "Phase: ${phase} - ${phase_name}"
    echo "Spec: ${spec_exists}"
    echo "Plan: ${plan_exists}"
    echo "Tasks: ${tasks_exists}"
    if [[ "$tasks_exists" == true ]]; then
        echo "Tasks Progress: ${completed_tasks}/${total_tasks}"
    fi
    echo "Next: ${next_action}"
fi
