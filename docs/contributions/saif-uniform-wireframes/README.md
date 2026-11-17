# Saif UC-8 / UC-10 — uniform wireframes and working screens

Updated November 16, 2026, with Codex assistance.

## What is implemented

PR #6 already merged both use cases into main: staff sign-in, six-shelter capacity/status display, protected own-shelter transfer listing, open/close details, contact authorization, empty states, live transfer changes, and session-loss handling. This update adds immediate capacity-event rendering, a five-second refresh for current data/status labels, and a working Refresh button. It retains the team's React/Vite/Tailwind and in-memory service architecture (ADR-0009); it does not claim a production backend or cross-browser synchronization.

Both static wireframes now appear under Saif in the shared gallery. They use the same shared PageShell, Card, Table, Badge and Button components and 1024 px labeled Frame used by the other owners. Static states use props and mock data only. The working screens use the same layout and call the shared services.

- UC-8: default, outdated, empty.
- UC-10: default, details, empty.
- Six PNGs in this folder are real rendered gallery captures, not AI-generated approximations.

The gallery also links to the working `/saif-demo.html` entry. Module imports are isolated: Joshua's existing `respond-transfer.wf.jsx` references a missing T-305 fixture and previously blanked the entire gallery. It now reports the failed module and continues displaying valid owners. His files and shared mock rows were not modified.

## Reproduce

From frontend, run `npm ci` then `npm run dev`.

- Gallery: `/#saif` (or `/#saif/shared-dashboard`, `/#saif/my-dogs`).
- Interactive Home: `/saif-demo.html?fixture=true`.
- Interactive My Dogs: `/saif-demo.html?fixture=true&view=dogs`.
- Mock credentials: `jdoe@richardson.example` / `pw-rich`.
- Sign in, choose View my dogs, open/close details, return Home, and sign out.
- `npm run check:ui`, `npm run build`, `npm run test:coverage`.
- `npx playwright install chromium`; `npx playwright test --config playwright.saif.config.js`.
- Gallery tests export images to `frontend/test-results/saif-wireframes/`.

## Validation

UI checker and production build pass. All 155 unit/component tests pass, including capacity-event/manual-refresh behavior. Six existing UC-8/UC-10 browser tests and two gallery tests pass (eight total). Gallery tests check all six state frames, three navigation labels, and no horizontal overflow at the team's frame width. Default dashboard and transfer-detail exports were visually inspected.

## Scope and AI use

Shared navigation remains the team's existing display component; Home/My Dogs actions are functional in the screen header. Settings and bell behavior belong to other team work. Five-person usability testing and full multi-screen manual navigation remain unperformed. Codex inspected the repository and UI skill, implemented these changes, ran automated tests and exported/inspected images. Saif must review the implementation before claiming personal manual validation. No Google Docs were edited.
