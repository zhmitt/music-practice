# Spec: Workflow Workspace Governance

## Requirement: The hybrid workflow SHALL define workspace ownership modes

The repository workflow SHALL distinguish between a tool-managed workspace, a manual git worktree, and the primary workspace so branch ownership is explicit before agent work continues.

#### Scenario: A branch is continued in an existing chat

- **Given** a user wants to continue work in an existing chat or tool session
- **When** the branch for that work is selected
- **Then** the branch remains owned by the tool-managed workspace instead of being checked out concurrently in a manual external worktree

## Requirement: Manual worktrees SHALL use isolated chat context

When a branch is moved into a manual git worktree, that worktree SHALL become the active execution context and work SHALL continue in a chat opened in that exact workspace.

#### Scenario: A manual worktree is created for isolated work

- **Given** a branch is checked out in a manually created git worktree
- **When** additional agent work continues on that branch
- **Then** the active chat or session is opened in that specific worktree instead of rebinding an older chat that still points to another workspace

## Requirement: Branch handoff SHALL checkpoint work before ownership changes

Before a branch moves from a manual worktree back to a tool-managed workspace, the workflow SHALL preserve the in-progress state through a checkpoint commit or explicit stash and SHALL record the handoff metadata.

#### Scenario: A manual worktree is freed for app-managed reuse

- **Given** a branch currently lives in a manual git worktree
- **When** the team wants an app-managed chat to take ownership again
- **Then** the manual workspace preserves its state with a checkpoint commit or explicit stash
- **And** the handoff records the branch name, commit or stash reference, workspace mode, and intended target workspace

## Requirement: The workflow SHALL expose deterministic workspace inspection

The canonical workflow surface SHALL provide a deterministic status command that shows the current workspace mode and known branch ownership before a branch or worktree move.

#### Scenario: An agent prepares to switch branches or workspaces

- **Given** a branch handoff or workspace switch is about to happen
- **When** the agent or human runs the canonical workspace status command
- **Then** they can see the current worktree, its branch or detached-head state, whether it is dirty, and the known worktree owners for relevant branches
