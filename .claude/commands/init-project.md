---
description: Initialize a new project from template with dynamic configuration.
---

## User Input

```text
$ARGUMENTS
```

## Outline

This command initializes a new project from the template, configuring project-specific settings through interactive questions.

**Run this command ONCE when setting up a new project from the template.**

## Initialization Flow

### Step 1: Basic Project Information

Ask the user for basic project details:

1. **Project Name**: What is the project name?
   - Used in CLAUDE.md, constitution, NEXT-SESSION.md
   - Should be kebab-case or simple name

2. **Project Description**: Brief description of what this project does?
   - One sentence summary
   - Used in documentation headers

### Step 2: Project Complexity

Ask about the desired workflow complexity:

**Question**: What level of spec-driven workflow do you need?

| Option | Description |
|--------|-------------|
| Lean | Basic: settings.json, CLAUDE.md, .specify with templates, core speckit commands. Quick to start. |
| Standard | Lean + all speckit commands, Working Memory folder, Session protocols, Agents |
| Full | Everything: 30+ commands, Personas, Post-implementation chain, strict workflows |

### Step 3: Tech Stack (Optional)

**Question**: Do you want to configure a specific tech stack now?

| Option | Description |
|--------|-------------|
| Agnostic | No specific stack - configure later as needed |
| Node/TypeScript | Setup package.json template, tsconfig, pnpm workspace |
| Python | Setup pyproject.toml, pytest, requirements structure |
| Custom | Specify your own stack |

### Step 4: User Personas

**Question**: Who are the primary users of this application?

Guide the user to define 2-4 personas:

For each persona, collect:
- **Name**: A memorable name (e.g., "Power User Paula", "Admin Alex")
- **Role**: Their job/function
- **Technical Level**: 1-5 (1=novice, 5=expert)
- **Primary Goal**: What they want to achieve
- **Key Pain Point**: What frustrates them most

### Step 5: Constitution Customization

**Question**: Do you have any specific principles to add to the constitution?

Options:
- Use default constitution (recommended for most projects)
- Add domain-specific principles (e.g., legal compliance, accessibility requirements)

## Actions

After collecting answers, perform these actions:

### 1. Update CLAUDE.md

Replace placeholders:
- `{{PROJECT_NAME}}` → user's project name
- `{{PROJECT_DESCRIPTION}}` → user's description
- `{{DATE}}` → current date
- `{{LANGUAGE}}`, `{{FRAMEWORK}}`, etc. → tech stack choices

### 2. Update Constitution

Replace placeholders:
- `{{PROJECT_NAME}}` → user's project name
- `{{DATE}}` → current date
- Add any custom principles

### 3. Update NEXT-SESSION.md

Replace placeholders:
- `{{PROJECT_NAME}}` → user's project name
- `{{DATE}}` → current date

### 4. Create Personas

For each persona defined, create:
`.claude/personas/[persona-name].md`

Using the template:
```markdown
# Persona: [Name]

## Overview
**Name**: [Name]
**Role**: [Role]
**Technical Level**: [1-5]

## Goals
- [Primary goal from input]

## Pain Points
- [Key pain point from input]

## Workflows
[To be expanded based on feature development]

## Use Cases
[To be expanded based on feature development]
```

### 5. Configure Tech Stack (if not agnostic)

For **Node/TypeScript**:
- Create basic `package.json`
- Create `tsconfig.json`
- Update .gitignore for node

For **Python**:
- Create `pyproject.toml`
- Create `requirements.txt` structure
- Update .gitignore for python

### 6. Setup Working Memory

Create `.specify/memory/` structure:
- `status.md` - Project status tracking
- `decisions/` - Architecture decisions
- `README.md` - Working memory guide

### 7. Initialize Git

If not already initialized:
```bash
git init
git add .
git commit -m "Initial project setup from template"
```

## Completion Report

After initialization, display:

```markdown
# Project Initialized: [Project Name]

## Configuration

- **Complexity**: [Lean/Standard/Full]
- **Tech Stack**: [Agnostic/Node/Python/Custom]
- **Personas**: [count] defined

## Files Updated

- CLAUDE.md
- .specify/memory/constitution.md
- .specify/memory/NEXT-SESSION.md
- .claude/personas/[...].md
- .specify/memory/status.md

## Next Steps

1. Review the generated files
2. Run `/specify` to start development
3. Use `/speckit.specify "{description}"` for your first feature

## Quick Start

```bash
cat .specify/memory/NEXT-SESSION.md
/specify
```
```

## Re-running Init

If `/init-project` is run again on an already-initialized project:

```markdown
## Warning: Project Already Initialized

This project appears to already be initialized.

**Options**:
1. **Update**: Modify specific settings (personas, tech stack)
2. **Reset**: Start fresh (will overwrite existing configuration)
3. **Cancel**: Keep existing configuration

What would you like to do?
```
