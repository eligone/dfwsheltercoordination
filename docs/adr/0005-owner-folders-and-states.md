# 0005. One folder per person; wireframes are sections with states

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
We need 12 wireframes (2 per person) plus Sign In. Many use cases share a screen (e.g. Home is used by
UC-8, UC-11, UC-12, UC-13), so 12 full pages would be repetitive. Six people editing the same
files causes merge conflicts.

## Decision
- Each person works only in `frontend/src/wireframes/<name>/`. `shared/` holds Sign In.
- Each wireframe is a `*.wf.jsx` file that exports `meta` (UC, title, owner, states) and a component
  that takes a `state` prop. A wireframe may be a section of a screen instead of a full page.
- The viewer finds these files automatically and renders one labeled frame per state.

## Consequences
- No merge conflicts between people; no shared registry to edit.
- Each frame is labeled with its use case and owner, as the assignment requires.
- Two people working on the same screen (e.g. Saif's table and Awais's toolbar on Home) must agree on
  the layout so their crops fit together.
