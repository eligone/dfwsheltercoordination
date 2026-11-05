# 0007. UI skill is mandatory; `main` is protected

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
Teammates use AI assistants to write UI. Without shared rules, each assistant invents its own styles
and components.

## Decision
- `.claude/skills/ui/SKILL.md` holds the UI rules. Nobody changes UI without it (Claude Code loads it
  automatically; with other tools, paste the file in first). `UI_GUIDE.md` explains this for humans.
- `frontend/scripts/check-ui.mjs` (`npm run check:ui`) checks the rules that can be checked
  automatically: folder placement, imports, tokens-only colors, required `meta`.
- `main` is protected: no direct pushes, changes go through a pull request, the `ui-check` CI job
  (UI check + build) must pass, and CODEOWNERS must approve changes to shared files
  (`components/ui`, tokens, the skill, ADRs, the checker and CI). Admins follow the same rules.

## Consequences
- Nothing that breaks the checkable rules can reach `main`.
- The check cannot prove someone *read* the skill; CODEOWNERS review covers the judgment calls.
- Branch protection on a private repo needs GitHub Pro (free with the Student Developer Pack) or a
  public repo.
