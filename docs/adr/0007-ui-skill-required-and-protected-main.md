# 0007. UI skill is mandatory; PRs run an automatic check

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
Teammates use AI assistants (Claude Code, GitHub Copilot) to write UI. Without shared rules, each
assistant invents its own styles and components.

## Decision
- `.claude/skills/ui/SKILL.md` holds the UI rules. Every UI prompt starts with `/ui` (Claude Code) or
  `#file:.claude/skills/ui/SKILL.md` (Copilot); `.github/copilot-instructions.md` also points Copilot at
  it. `UI_GUIDE.md` gives the exact prompts.
- `frontend/scripts/check-ui.mjs` (`npm run check:ui`) checks the rules that can be checked
  automatically: folder placement, imports, tokens-only colors, required `meta`. The `ui-check` GitHub
  Actions job runs it plus a build on every pull request.
- We chose **not** to lock `main` with branch protection; we are a small team and trust each other
  to use pull requests and fix a red check before merging.

## Consequences
- Rule breaks are visible (red X on the PR) but not technically blocked.
- If that stops working, turn on branch protection requiring the `ui-check` job (new ADR).
