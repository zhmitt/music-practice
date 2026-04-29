# Proposal: Install OpenSpec Verification Toolchain

## Summary

Install the OpenSpec Verification Toolchain in the music-practice repository.
This toolchain closes the "volume trap" failure mode where Changes were
reported as done without verifiable evidence.

## Problem

Without a per-Change gate, Changes can be marked as `done` while core
artefacts are missing or not wired in. Typecheck and tests stay green because
they don't test the uncovered path.

## Solution

Install three new scripts + modifications to existing scripts + CI gate:

- `workflow/scripts/spec-drift-check.sh` -- extracts code-level claims from
  `proposal.md`/`tasks.md` and verifies them against the working tree.
- `workflow/scripts/claim-evidence-check.sh` -- flags claim verbs without
  evidence patterns in Markdown.
- `workflow/scripts/change-done.sh` -- 5-phase pipeline: Spec-Drift +
  Tasks-Consistency + Post-Impl-Scaffold + Post-Impl-Check + Claim-Evidence.
- `workflow/scripts/post-impl-check.sh` -- modified: auto-derive `--change`
  from staged paths; tolerate annotated open tasks; explicit `exit 0`.
- `.git-hooks/pre-commit` -- appended Check A (spec-drift, blocking) +
  Check B (claim-evidence on commit message, warning only).
- `.github/workflows/openspec-gate.yml` -- CI gate: spec-drift,
  pr-claim-evidence, tasks-consistency.
- `AGENTS.md` -- appended Definition of Done, Parallel Work Limit,
  Sub-Agent Output Format sections.
- `CLAUDE.md` -- appended Done-Disziplin section.

## Adaptations

- `REPO_PREFIXES`: `frontend/`, `scripts/`, `workflow/`, `docs/`,
  `openspec/`, `.github/`, `.git-hooks/`, `mockup/`, `codex/`
- Change-ID schema: slug-only regex `[A-Za-z0-9][A-Za-z0-9._-]*`
  (matches `2026-03-31-app-shell-foundation` and `add-canonical-milestone-sync`)
- rg scope: `.` (whole repo, no `packages/` prefix)
- Pre-commit emoji style: preserved (hook uses emoji)
- CLAUDE.md: present, appended Done-Disziplin section
- Historical cutoff: `openspec-verification-toolchain` (2026-04-29)
