# Tasks: openspec-verification-toolchain

## Installation Tasks

- [x] Create `workflow/scripts/spec-drift-check.sh` (chmod +x)
- [x] Create `workflow/scripts/claim-evidence-check.sh` (chmod +x)
- [x] Create `workflow/scripts/change-done.sh` (chmod +x)
- [x] Apply 3 diffs to `workflow/scripts/post-impl-check.sh` (auto-derive --change, task_user_action_pending, exit 0)
- [x] Append Check A + Check B to `.git-hooks/pre-commit`
- [x] Create `.github/workflows/openspec-gate.yml`
- [x] Append Definition of Done + Parallel Work Limit + Sub-Agent Output Format to `AGENTS.md`
- [x] Append Done-Disziplin section to `CLAUDE.md`
- [x] Set `core.hooksPath` to `.git-hooks` via git config

## Adaptation Tasks

- [x] REPO_PREFIXES adapted to music-practice top-level dirs: `frontend/`, `scripts/`, `workflow/`, `docs/`, `openspec/`, `.github/`, `.git-hooks/`, `mockup/`, `codex/`
- [x] find-fallback in verify_claims uses same dirs
- [x] Change-ID regex adapted: `[A-Za-z0-9][A-Za-z0-9._-]*` (slug-only, 4 places)
- [x] rg scope set to `.` (whole repo)
- [x] Historical cutoff set to `openspec-verification-toolchain` in AGENTS.md
- [x] Pre-commit emoji style preserved

## Self-Apply Tasks

- [x] Created `openspec/changes/openspec-verification-toolchain/proposal.md`
- [x] Created `openspec/changes/openspec-verification-toolchain/tasks.md`
- [x] Created `openspec/changes/openspec-verification-toolchain/verification.md`
- [x] Added status entry in `workflow/state/status.md`
- [x] Created report in `workflow/state/reports/`
