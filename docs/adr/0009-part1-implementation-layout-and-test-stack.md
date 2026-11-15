# 0009. Part 1 implementation layout and test stack

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Group 2 (Hoang Pham, Joshua Nakka, Anais Elizabeth Gonzalez, Avalon Austin, Saif Yusuff, Awais Afridi)

## Context
Assignment 4 (Implementation & Coding Part 1) needs working code for two use cases per student, plus
unit tests. Until now `frontend/src` held only wireframes, mock data and shared UI components, and
`scripts/check-ui.mjs` (Rule 2) rejects any file outside `components/ui`, `mock`, `viewer` and
`wireframes`, so feature code or test files would turn the `ui-check` job red. There is no backend
yet (the Assignment 3 architecture lists Next.js/Express/Supabase, but the repo is Vite + React).

## Decision
1. **Frontend + in-memory mock service layer for Part 1.** Business rules live in plain JavaScript
   modules in `frontend/src/services/` (shelter store, transfer service, alert service, auth).
   They are seeded from `src/mock/` and expose the same functions a REST API will expose in Part 2.
2. **One folder per person for feature code:** `frontend/src/features/<name>/` (same names as
   `wireframes/<name>/`). A feature imports only `react`, `components/ui`, `services/`, `mock/` and
   its own folder, never another person's feature folder (new check-ui Rule 6).
3. **Tests sit next to the code** as `*.test.js(x)` inside `services/` and `features/<name>/`;
   shared test helpers go in `src/test/`. End-to-end tests live in `frontend/e2e/` (outside `src/`).
4. **Test stack:** Vitest + jsdom (unit/component), React Testing Library with user-event and
   jest-dom, Playwright (end-to-end and timing checks), `@vitest/coverage-v8` for coverage.
5. **check-ui change:** `ALLOWED_TOP` gains `services/`, `features/`, `test/`; Rule 6 enforces the
   per-owner layout. Rules 3 (token colors) and the wireframe rules are unchanged. Wireframes stay
   mock-only; they are not turned into working screens.
6. **CI:** `ui-check` is unchanged in behavior; two jobs are added, `unit-tests` (Vitest with
   coverage) and `e2e` (Playwright, Chromium only). All three must be green before a PR merges.

## Consequences
- Easier: tests run without a server or database; each person can work and test alone; the service
  functions become the API contract for Part 2.
- Harder: mock data and real behavior can drift, so the services keep all rules (validation, status
  changes) in one place and the Part 2 backend must reuse the same test cases.
- To do: install dev dependencies (`npm i -D vitest @vitest/coverage-v8 jsdom @testing-library/react
  @testing-library/jest-dom @testing-library/user-event @playwright/test`), commit the lockfile,
  and update `.claude/skills/ui/SKILL.md` to mention `features/` (wireframe rules still apply to
  `wireframes/`).
