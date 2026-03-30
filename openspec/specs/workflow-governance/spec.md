# Capability Spec: Workflow Governance

## Purpose

Define the canonical workflow contract for this repository.

## Current State

- `AGENTS.md`, `openspec/`, and `workflow/` are the only canonical workflow layers.
- `.claude/`, `.codex/`, `.gemini/`, `CLAUDE.md`, `CODEX.md`, and `GEMINI.md` are adapters only.
- `.specify/` remains as frozen legacy reference and must not receive new operational writes.

## Requirements

### Requirement: Spec-first development

Non-trivial product and implementation work MUST start from an OpenSpec change.

#### Scenario: starting new work

- **WHEN** a change goes beyond a trivial edit
- **THEN** work starts in `openspec/changes/<change-id>/`
- **AND** the repo does not re-activate `.specify/specs/` as the live feature workflow

### Requirement: Tool-neutral repo truth

The repository MUST keep one workflow truth for Claude Code, Codex, and Gemini CLI.

#### Scenario: using native tool features

- **WHEN** a tool uses commands, subagents, prompts, or hooks
- **THEN** those accelerators operate against `AGENTS.md`, `openspec/`, and `workflow/`
- **AND** they do not invent tool-local lifecycle state
