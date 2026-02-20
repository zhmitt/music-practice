#!/bin/bash

set -euo pipefail

feature_filter=""
dry_run=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --feature)
            feature_filter="${2:-}"
            if [[ -z "$feature_filter" ]]; then
                echo "Missing value for --feature" >&2
                exit 1
            fi
            shift 2
            ;;
        --dry-run)
            dry_run=true
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

registry_path=".specify/memory/task-registry.md"
now="$(date '+%Y-%m-%d %H:%M')"

declare -a active_blocks
declare -a backlog_blocks
declare -a completed_blocks

total_features=0
active_features=0
completed_features=0
backlog_features=0
total_tasks=0
completed_tasks=0
pending_tasks=0
in_progress_tasks=0

feature_dirs=$(find .specify/specs -mindepth 1 -maxdepth 1 -type d | sort)

for feature_dir in $feature_dirs; do
    feature_key="$(basename "$feature_dir")"
    tasks_file="${feature_dir}/tasks.md"
    spec_file="${feature_dir}/spec.md"

    if [[ ! -f "$tasks_file" ]]; then
        continue
    fi

    if [[ -n "$feature_filter" ]]; then
        case "$feature_key" in
            "${feature_filter}"*|*"-${feature_filter}"|*"-${feature_filter}-"*)
                ;;
            *)
                continue
                ;;
        esac
    fi

    total_features=$((total_features + 1))

    if [[ "$feature_key" == *-* ]]; then
        feature_id="${feature_key%%-*}"
        feature_slug="${feature_key#*-}"
    else
        feature_id="$feature_key"
        feature_slug="$feature_key"
    fi

    feature_name="$(echo "$feature_slug" | tr '-' ' ')"

    feature_total_tasks=$(rg -N '^- \[( |x|X)\]' "$tasks_file" | wc -l | tr -d ' ')
    feature_completed_tasks=$(rg -N '^- \[[xX]\]' "$tasks_file" | wc -l | tr -d ' ')
    feature_in_progress_tasks=$(rg -N 'In Progress|🚧' "$tasks_file" | wc -l | tr -d ' ')
    feature_pending_tasks=$((feature_total_tasks - feature_completed_tasks))

    total_tasks=$((total_tasks + feature_total_tasks))
    completed_tasks=$((completed_tasks + feature_completed_tasks))
    pending_tasks=$((pending_tasks + feature_pending_tasks))
    in_progress_tasks=$((in_progress_tasks + feature_in_progress_tasks))

    priority="P1"
    if [[ -f "$spec_file" ]]; then
        parsed_priority="$(rg -N -o 'Priority:\s*(P[0-3])' "$spec_file" -r '$1' | head -n 1 || true)"
        if [[ -n "$parsed_priority" ]]; then
            priority="$parsed_priority"
        fi
    fi

    if [[ "$feature_total_tasks" -gt 0 && "$feature_completed_tasks" -eq "$feature_total_tasks" ]]; then
        completed_features=$((completed_features + 1))
        completed_blocks+=("### Feature #${feature_id} - ${feature_name} (✅ Complete)

**Priority**: ${priority}
**Status**: ✅ Complete
**Progress**: ${feature_completed_tasks}/${feature_total_tasks} tasks (100%)
**Last Updated**: ${now}

**Quick Links**:
- Spec: \`${feature_dir}/spec.md\`
- Tasks: \`${feature_dir}/tasks.md\`
- Progress: \`${feature_dir}/progress.md\`
")
    elif [[ "$feature_completed_tasks" -gt 0 ]]; then
        active_features=$((active_features + 1))
        progress_pct=$((feature_completed_tasks * 100 / feature_total_tasks))
        active_blocks+=("### Feature #${feature_id} - ${feature_name} (🚧 In Progress - ${progress_pct}%)

**Priority**: ${priority}
**Status**: 🚧 Implementation
**Progress**: ${feature_completed_tasks}/${feature_total_tasks} tasks (${progress_pct}%)
**Blockers**: None
**Last Updated**: ${now}

**Quick Links**:
- Spec: \`${feature_dir}/spec.md\`
- Tasks: \`${feature_dir}/tasks.md\`
- Progress: \`${feature_dir}/progress.md\`
")
    else
        backlog_features=$((backlog_features + 1))
        backlog_blocks+=("### Feature #${feature_id} - ${feature_name} (📋 Backlog)

**Priority**: ${priority}
**Status**: 📋 Backlog
**Estimated Tasks**: ${feature_total_tasks}
**Last Updated**: ${now}

**Quick Links**:
- Spec: \`${feature_dir}/spec.md\`
- Tasks: \`${feature_dir}/tasks.md\`
")
    fi
done

overall_progress=0
if [[ "$total_tasks" -gt 0 ]]; then
    overall_progress=$((completed_tasks * 100 / total_tasks))
fi

tmp_file="$(mktemp)"

cat > "$tmp_file" <<EOF
# Task Registry

**Single Source of Truth for ALL Tasks**

**Last Updated**: ${now}
**Auto-Sync**: Enabled (via /tasks sync)

---

## Statistics

**Total Features**: ${total_features}
**Active Features**: ${active_features}
**Completed Features**: ${completed_features}
**Pending Tasks**: ${pending_tasks}
**In Progress**: ${in_progress_tasks}
**Completed Tasks**: ${completed_tasks}
**Overall Progress**: ${overall_progress}%

---

## Active Features

EOF

if [[ ${#active_blocks[@]} -eq 0 ]]; then
    echo "*No active features*" >> "$tmp_file"
else
    printf '%s\n' "${active_blocks[@]}" >> "$tmp_file"
fi

cat >> "$tmp_file" <<EOF

---

## Backlog

EOF

if [[ ${#backlog_blocks[@]} -eq 0 ]]; then
    echo "*No backlog features*" >> "$tmp_file"
else
    printf '%s\n' "${backlog_blocks[@]}" >> "$tmp_file"
fi

cat >> "$tmp_file" <<EOF

---

## Recently Completed

EOF

if [[ ${#completed_blocks[@]} -eq 0 ]]; then
    echo "*No completed features*" >> "$tmp_file"
else
    printf '%s\n' "${completed_blocks[@]}" >> "$tmp_file"
fi

cat >> "$tmp_file" <<EOF

---

## User Test Queue

*No pending user tests*

---

## Session Todos

*No session todos*

---

Generated by \`codex/scripts/tasks-sync.sh\`.
EOF

if [[ "$dry_run" == true ]]; then
    cat "$tmp_file"
    rm -f "$tmp_file"
    exit 0
fi

mv "$tmp_file" "$registry_path"
echo "✅ Task registry rebuilt: ${registry_path}"
