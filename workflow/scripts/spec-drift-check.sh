#!/usr/bin/env bash
# spec-drift-check.sh — Verify code-level claims in a Change's proposal.md + tasks.md
# against the actual state of the codebase.
#
# Usage:
#   workflow/scripts/spec-drift-check.sh --change <change-id> [--quiet]
#   workflow/scripts/spec-drift-check.sh           (auto-select if exactly one active change)
#
# Exit 0: all verifiable claims passed.
# Exit 1: one or more claims are drifted, or the change was not found.
#
# Audit trail written to: workflow/state/drift/<change-id>.md

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
requested_change=""
quiet=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change)
      requested_change="${2:-}"
      if [[ -z "$requested_change" ]]; then
        echo "Missing value for --change" >&2
        exit 1
      fi
      shift 2
      ;;
    --quiet)
      quiet=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Repo root + change resolution  (mirrors post-impl-check.sh logic)
# ---------------------------------------------------------------------------
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

active_changes=()
while IFS= read -r line; do
  active_changes+=("$line")
done < <(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

if [[ ${#active_changes[@]} -eq 0 ]]; then
  [[ "$quiet" == false ]] && echo "No active changes found."
  exit 0
fi

change_dir=""
if [[ -n "$requested_change" ]]; then
  change_dir="openspec/changes/$requested_change"
  if [[ ! -d "$change_dir" ]]; then
    echo "Active change not found: $requested_change" >&2
    exit 1
  fi
elif [[ ${#active_changes[@]} -gt 1 ]]; then
  echo "Multiple active changes detected. Use --change <change-id>." >&2
  exit 1
else
  change_dir="${active_changes[0]}"
fi

change_id="$(basename "$change_dir")"

# ---------------------------------------------------------------------------
# Python extractor — write to a temp file to avoid bash 3.2 heredoc-in-$()
# limitations with single-quotes inside heredoc bodies.
# ---------------------------------------------------------------------------
py_extractor="$(mktemp /tmp/spec-drift-extractor-XXXXXX)"
trap 'rm -f "$py_extractor"' EXIT

cat > "$py_extractor" << 'PYEOF'
#!/usr/bin/env python3
"""
Extract verifiable code-level claims from a markdown file.
Outputs: TYPE<TAB>VALUE per line.

Claim types:
  file          - backtick path or markdown link to a local file
  function      - backtick token that looks like a function call
  symbol        - backtick PascalCase identifier
  config        - backtick key:value config assertion
  import-module - 'import ... from <module>' reference to an npm module
"""
import sys
import re

path = sys.argv[1]
with open(path) as f:
    text = f.read()

# 1. Markdown links [text](target) — local paths only
for m in re.finditer(r'\[([^\]]*)\]\(([^)]+)\)', text):
    target = m.group(2)
    if re.match(r'^(https?|mailto|#)', target):
        continue
    if not target:
        continue
    # Strip anchor fragments
    target = target.split('#', 1)[0]
    if not target:
        continue
    # Same noise filters as backtick paths
    if '**' in target or target.endswith('/*') or '/*.' in target:
        continue
    if '{' in target and '}' in target:
        continue
    if re.search(r'-[A-Za-z0-9_]{8,}\.(js|mjs|css|map)$', target):
        continue
    if re.match(r'^[a-z][a-z0-9_]*\.md$', target) and '/' not in target:
        continue
    if '|' in target:
        continue
    # Strip leading ./ only — preserve .github/ etc.
    if target.startswith('./'):
        target = target[2:]
    elif target.startswith('/'):
        target = target.lstrip('/')
    print("file\t" + target)

# 2. Backtick tokens
for m in re.finditer(r'`([^`]+)`', text):
    token = m.group(1)

    # a. File path: contains slash OR ends with known extension
    # Exclusions:
    # - HTML tags (<script>...)
    # - Directory-only paths ending with /
    # - npm scope packages (@types/foo) — not real repo paths
    # - /tmp/ paths (ephemeral artifacts)
    has_slash = '/' in token
    has_ext = bool(re.search(r'\.(ts|tsx|js|jsx|json|md|sh|mjs|cjs|py|yaml|yml|css|html|rules)$', token))
    if has_slash or has_ext:
        if ' ' not in token and '<' not in token and '>' not in token:
            # Skip directory-only paths (no basename with extension)
            if token.endswith('/'):
                pass  # fall through to other checks
            # Skip npm @scope packages without a real file extension
            elif re.match(r'^@[a-zA-Z]', token) and not has_ext:
                pass  # fall through to other checks
            # Skip /tmp/ ephemeral paths
            elif token.startswith('/tmp/') or token.startswith('tmp/'):
                pass  # not a repo file
            # Skip glob patterns (packages/**/x, src/* etc.) — not single files
            elif '**' in token or token.endswith('/*') or '/*.' in token:
                pass
            # Skip placeholder paths (Firestore docs, route templates) — contain {x} or :param
            elif '{' in token and '}' in token:
                pass
            elif re.search(r'/:[a-zA-Z]', token):
                pass
            # Skip generated bundle artifacts (foo-AbCd1234.js) — hash suffix
            elif re.search(r'-[A-Za-z0-9_]{8,}\.(js|mjs|css|map)$', token):
                pass
            # Skip memory-file basenames (snake_case .md without path) —
            # references to ~/.claude/.../memory/ files, not repo files
            elif re.match(r'^[a-z][a-z0-9_]*\.md$', token) and not has_slash:
                pass
            # Skip pipe-separated unions (regex alternations, role lists)
            elif '|' in token:
                pass
            # Skip GitHub Action refs (actions/setup-java@v4)
            elif re.search(r'@v?\d', token):
                pass
            # Skip slash-paths with no extension that are not anchored in a repo dir
            # (eslint rules like jsx-a11y/no-autofocus, package-internals firebase/app-check)
            elif has_slash and not has_ext:
                REPO_PREFIXES = (
                    'frontend/', 'scripts/', 'workflow/',
                    'docs/', 'openspec/', '.github/', '.git-hooks/',
                    'mockup/', 'codex/'
                )
                stripped = token[2:] if token.startswith('./') else token.lstrip('/')
                if not any(stripped.startswith(p) for p in REPO_PREFIXES):
                    pass  # skip non-repo slash-token
                else:
                    print("file\t" + stripped)
                    continue
            else:
                # Strip leading ./ only (not all dots — preserves .github/ etc.)
                clean = token[2:] if token.startswith('./') else token.lstrip('/')
                print("file\t" + clean)
                continue

    # b. Function call: identifier followed by (
    fm = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', token)
    if fm:
        print("function\t" + fm.group(1))
        continue

    # c. Config key: value pair (e.g. "noUncheckedIndexedAccess": true)
    cm = re.match(r'^"?([a-zA-Z_][a-zA-Z0-9_]+)"?\s*:\s*(true|false|[0-9]+|"[^"]*")$', token)
    if cm:
        print("config\t" + cm.group(1))
        continue

    # d. PascalCase symbol (no parens, no slash, no dot)
    if re.match(r'^[A-Z][a-zA-Z0-9]{2,}$', token):
        print("symbol\t" + token)
        continue

# 3. Import statements in prose
# Use chr(39) for single-quote to avoid bash 3.2 parser issues with \' in heredoc
sq = chr(39)
import_re = re.compile(r'import\s+.*?from\s+[' + sq + r'"]([^' + sq + r'"]+)[' + sq + r'"]')
for m in import_re.finditer(text):
    print("import-module\t" + m.group(1))
PYEOF

# ---------------------------------------------------------------------------
# Resolve rg binary: prefer system rg, fall back to Claude Code bundled binary
# ---------------------------------------------------------------------------
_RG=""
if command -v rg >/dev/null 2>&1 && rg --version >/dev/null 2>&1; then
  _RG="rg"
else
  # Claude Code bundles rg under its node_modules
  _claude_rg="$(find /opt/homebrew/lib/node_modules /usr/local/lib/node_modules \
    -name "rg" -path "*/ripgrep/arm64-darwin/rg" -o \
    -name "rg" -path "*/ripgrep/x64-darwin/rg" 2>/dev/null | head -1)"
  if [[ -x "$_claude_rg" ]]; then
    _RG="$_claude_rg"
  fi
fi

if [[ -z "$_RG" ]]; then
  echo "rg (ripgrep) not found. Install via: brew install ripgrep" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Search helpers
# ---------------------------------------------------------------------------
# rg_found_fixed: exits 0 if literal string pattern is found, 1 if not
rg_found_fixed() {
  local pattern="$1"
  local scope="${2:-.}"
  "$_RG" -q --fixed-strings "$pattern" "$scope" 2>/dev/null
}

# rg_found_regex: exits 0 if regex pattern is found, 1 if not
rg_found_regex() {
  local pattern="$1"
  local scope="${2:-.}"
  "$_RG" -q "$pattern" "$scope" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Claim storage (parallel arrays)
# ---------------------------------------------------------------------------
claim_types=()
claim_values=()
claim_sources=()

add_claim() {
  [[ -z "$2" ]] && return
  claim_types+=("$1")
  claim_values+=("$2")
  claim_sources+=("$3")
}

# ---------------------------------------------------------------------------
# Claim extraction via Python
# ---------------------------------------------------------------------------
extract_claims_from_file() {
  local src_file="$1"
  [[ -f "$src_file" ]] || return

  local ctype cval
  while IFS=$'\t' read -r ctype cval; do
    [[ -z "$ctype" || -z "$cval" ]] && continue
    add_claim "$ctype" "$cval" "$src_file"
  done < <(python3 "$py_extractor" "$src_file" 2>/dev/null)
}

# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------
dedup_claims() {
  local -a seen_keys new_types new_values new_sources
  seen_keys=()
  new_types=()
  new_values=()
  new_sources=()
  local i key already k
  for (( i=0; i<${#claim_types[@]}; i++ )); do
    key="${claim_types[$i]}::${claim_values[$i]}"
    already=false
    for k in "${seen_keys[@]+"${seen_keys[@]}"}"; do
      if [[ "$k" == "$key" ]]; then
        already=true
        break
      fi
    done
    if [[ "$already" == false ]]; then
      seen_keys+=("$key")
      new_types+=("${claim_types[$i]}")
      new_values+=("${claim_values[$i]}")
      new_sources+=("${claim_sources[$i]}")
    fi
  done
  claim_types=("${new_types[@]+"${new_types[@]}"}")
  claim_values=("${new_values[@]+"${new_values[@]}"}")
  claim_sources=("${new_sources[@]+"${new_sources[@]}"}")
}

# ---------------------------------------------------------------------------
# Noise filter — identifiers that are almost certainly not code claims
# ---------------------------------------------------------------------------
is_noise_word() {
  case "$1" in
    true|false|null|undefined|void|any|string|number|boolean|object|never|\
    const|let|var|export|import|return|if|else|for|while|do|switch|case|\
    break|continue|default|class|extends|implements|interface|type|enum|\
    new|this|super|typeof|instanceof|in|of|from|as|async|await|yield|\
    get|set|static|public|private|protected|readonly|abstract|override|\
    module|require|resolve|reject|catch|finally|throw|try|Error|\
    DOMPurify|Array|Object|Promise|Map|Set|console|process)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

# ---------------------------------------------------------------------------
# Verification — populates result_statuses[] and result_details[]
# All local variable declarations are at the top to satisfy bash 3.2
# ---------------------------------------------------------------------------
result_statuses=()
result_details=()

verify_claims() {
  local i ctype cvalue fpath fname fn fn_pattern sym key mod
  for (( i=0; i<${#claim_types[@]}; i++ )); do
    ctype="${claim_types[$i]}"
    cvalue="${claim_values[$i]}"

    case "$ctype" in

      file)
        # Strip line-number suffixes (file.ts:610) and anchors (#section)
        fpath="${cvalue%%:*}"
        fpath="${fpath%%#*}"
        # Skip relative paths (../foo) — they only make sense from a specific file's location
        if [[ "$fpath" == ../* ]]; then
          result_statuses+=("skip")
          result_details+=("skip relative path: $fpath")
          continue
        fi
        if [[ -f "$repo_root/$fpath" ]]; then
          result_statuses+=("pass")
          result_details+=("file exists: $fpath")
        elif [[ -f "$repo_root/frontend/$fpath" ]]; then
          result_statuses+=("pass")
          result_details+=("file exists under frontend/: $fpath")
        else
          # Fallback: find by filename across known source dirs
          fname="$(basename "$fpath")"
          if find "$repo_root/frontend" "$repo_root/scripts" "$repo_root/workflow" "$repo_root/.github" "$repo_root/.git-hooks" -name "$fname" -type f 2>/dev/null | grep -q .; then
            result_statuses+=("pass")
            result_details+=("file found by name: $fpath")
          else
            result_statuses+=("fail")
            result_details+=("file missing: $fpath")
          fi
        fi
        ;;

      function)
        fn="$cvalue"
        if [[ ${#fn} -le 2 ]] || is_noise_word "$fn"; then
          result_statuses+=("skip")
          result_details+=("skip noise/short: $fn")
          continue
        fi
        fn_pattern="${fn}[[:space:]]*[(]"
        if rg_found_regex "$fn_pattern" "."; then
          result_statuses+=("pass")
          result_details+=("function found: $fn")
        else
          result_statuses+=("fail")
          result_details+=("function not found: $fn")
        fi
        ;;

      symbol)
        sym="$cvalue"
        if [[ ${#sym} -le 2 ]] || is_noise_word "$sym"; then
          result_statuses+=("skip")
          result_details+=("skip noise/short: $sym")
          continue
        fi
        if rg_found_fixed "$sym" "."; then
          result_statuses+=("pass")
          result_details+=("symbol found: $sym")
        else
          result_statuses+=("fail")
          result_details+=("symbol not found: $sym")
        fi
        ;;

      config)
        key="$cvalue"
        if [[ ${#key} -le 2 ]]; then
          result_statuses+=("skip")
          result_details+=("config key too short: $key")
          continue
        fi
        # Search config files and source files
        if rg_found_fixed "$key" "."; then
          result_statuses+=("pass")
          result_details+=("config key found: $key")
        else
          result_statuses+=("fail")
          result_details+=("config key not found: $key")
        fi
        ;;

      import-module)
        mod="$cvalue"
        # Skip relative imports — covered by file claims
        if [[ "$mod" == .* ]]; then
          result_statuses+=("skip")
          result_details+=("skip relative import: $mod")
          continue
        fi
        if rg_found_fixed "from '$mod'" "." || \
           rg_found_fixed "from \"$mod\"" "." || \
           rg_found_fixed "require('$mod')" "."; then
          result_statuses+=("pass")
          result_details+=("import found: $mod")
        else
          result_statuses+=("fail")
          result_details+=("import not found in codebase: $mod")
        fi
        ;;

      *)
        result_statuses+=("skip")
        result_details+=("unknown claim type: $ctype")
        ;;
    esac
  done
}

# ---------------------------------------------------------------------------
# Run extraction and verification
# ---------------------------------------------------------------------------
proposal_file="$change_dir/proposal.md"
tasks_file="$change_dir/tasks.md"

if [[ ! -f "$proposal_file" ]] && [[ ! -f "$tasks_file" ]]; then
  echo "Neither proposal.md nor tasks.md found in $change_dir" >&2
  exit 1
fi

extract_claims_from_file "$proposal_file"
extract_claims_from_file "$tasks_file"
dedup_claims
verify_claims

# ---------------------------------------------------------------------------
# Count results
# ---------------------------------------------------------------------------
pass_count=0
fail_count=0
skip_count=0
s=""
for s in "${result_statuses[@]+"${result_statuses[@]}"}"; do
  case "$s" in
    pass) (( pass_count++ )) || true ;;
    fail) (( fail_count++ )) || true ;;
    skip) (( skip_count++ )) || true ;;
  esac
done

# ---------------------------------------------------------------------------
# Audit trail: workflow/state/drift/<change-id>.md
# ---------------------------------------------------------------------------
drift_dir="$repo_root/workflow/state/drift"
mkdir -p "$drift_dir"
drift_file="$drift_dir/${change_id}.md"
i=0
local_status=""
local_ctype=""
local_cvalue=""
local_detail=""

{
  echo "# Spec-Drift Report: $change_id"
  echo ""
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
  echo "## Summary"
  echo ""
  echo "- Passed: $pass_count"
  echo "- Failed: $fail_count"
  echo "- Skipped: $skip_count"
  echo "- Total:   $(( pass_count + fail_count + skip_count ))"
  echo ""
  echo "## Claims"
  echo ""
  echo "| Status | Type | Value | Detail |"
  echo "|--------|------|-------|--------|"
  for (( i=0; i<${#claim_types[@]}; i++ )); do
    local_status="${result_statuses[$i]:-skip}"
    local_ctype="${claim_types[$i]}"
    local_cvalue="${claim_values[$i]//|/\\|}"
    local_detail="${result_details[$i]:-}"
    local_detail="${local_detail//|/\\|}"
    echo "| $local_status | $local_ctype | \`$local_cvalue\` | $local_detail |"
  done
} > "$drift_file"

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
if [[ $fail_count -gt 0 ]]; then
  {
    echo "Spec-drift check FAILED for ${change_id} (${fail_count} claim(s) drifted):"
    echo ""
    for (( i=0; i<${#claim_types[@]}; i++ )); do
      if [[ "${result_statuses[$i]}" == "fail" ]]; then
        echo "  Claim: ${claim_values[$i]} [${claim_types[$i]}] -- ${result_details[$i]}"
      fi
    done
    echo ""
    echo "Full report: $drift_file"
  } >&2
  exit 1
fi

[[ "$quiet" == false ]] && echo "Spec-drift check passed for ${change_id}. (${pass_count} passed, ${skip_count} skipped)"
[[ "$quiet" == false ]] && echo "Audit trail: $drift_file"
exit 0
