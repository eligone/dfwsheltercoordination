# UC-8 Shared Dashboard contribution

Owner: Saif Yusuff. Implemented with Codex assistance on November 15, 2026.

## Implementation

`frontend/src/features/saif/SharedDashboard.jsx` displays authenticated shelter capacity data using the existing shelter store, status utility and shared components. It supplies a working sign-in boundary based on the existing static sign-in wireframe, shows exact empty-state wording, and removes protected rows after sign-out (external session changes detected within 250 ms). It does not create a backend or duplicate capacity rules.

`demo.jsx` creates an isolated in-memory application. `saif-demo.html` is the browser entry. The Vite build now includes the original viewer and this entry. No teammate's services or screens were changed.

Run `cd frontend && npm ci && npm run dev`, then open `/saif-demo.html?fixture=true`. Use the mock account `jdoe@richardson.example` / `pw-rich`. The fixture explicitly fixes time at November 4, 2026, 10:00 UTC. Without fixture mode, the clock uses current time, so the old seed records correctly appear Outdated. Add `&scenario=empty` for empty data.

The submitted Assignment 3 Nearby Shelters list informed the overview. The map, colors, four-tab navigation and old sample numbers were adapted to current repo conventions and test fixtures. No map integration or new search/filter/sort/refresh feature is included.

## Automated results

Local environment: macOS arm64, Node 25.9.0, npm 11.12.1, Vitest 5.1.0, Vite 8.3.8. npm reported an engine warning because Vitest supports Node 22/24/26 rather than 25; execution nevertheless succeeded. CI uses Node 22.

| Case | Expected | Observed | Status |
| --- | --- | --- | --- |
| TC-8-01 | Six shelters with capacity fields and expected statuses | All six seeded rows and counts matched; UTC update rendered | Pass, component + service |
| TC-8-02 | 50/60 Open; 51/60 and 59/60 Near Full; 60/60 Full; 0/60 Open | All five boundary renderings matched | Pass, component + service |
| TC-8-03 | No shelter data available. | Exact message; no table | Pass, component + service |
| TC-8-04 | Signed-out/expired session returns to sign-in without protected data | Initial visitor saw form only; wrong credentials rejected; correct login displayed rows; external sign-out removed rows | Pass, component + service |
| NTC-12 | Three tabs on all five specified screens | Home has exactly Home, My Dogs, Settings; remaining screens not checked | Not Run for full scenario |
| NTC-13 | At least 4/5 new users find Collin kennel count within 60 seconds | Requires real participants; none tested | Not Run |

Commands executed from `frontend/`:

- `npm ci`: completed, zero vulnerabilities; engine warning above.
- `npm run test -- src/features/saif/SharedDashboard.test.jsx src/services/dashboard.test.js`: 27 passed, 2 files.
- `npm run test:coverage`: 127 passed, 13 files. Overall 94.38% statements / 85.74% branches; services 96.29% statements. Full output: `unit-coverage.txt`.
- `npm run build`: passed; built viewer and UC-8 entry.
- `npm run check:ui`: failed with six existing Rule 2 violations under `src/featuresjoshua/joshua/`. The same errors existed before this work; no new UC-8 violations were reported. Team correction needed before green CI.

Browser verification: `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/saif-uc8-browsers npx playwright test --config playwright.saif.config.js` passed both tests in 3.2 seconds. The dedicated config uses port 5188 and refuses to reuse another app. Initial attempts were blocked by sandbox server permissions, missing Chromium, and then an unrelated app occupying the default port; these were resolved for the final run. Browser checks verified sign-in, six rows, expected Richardson/Irving statuses, three labels, empty message and sign-out. Screenshots were visually inspected: [dashboard](dashboard.png), [empty](empty.png).

To reproduce on a normal machine: `npx playwright install chromium`, then `npx playwright test --config playwright.saif.config.js` (no custom browser path needed).

## Integration limits

This is a dedicated runnable feature entry, following teammates' demo pattern. The shared NavBar still renders static labels: global routing and My Dogs integration remain future work. No claim of complete app navigation, production authentication, server-enforced security, or manual usability validation is made. Session expiry is simulated by clearing the in-memory session; the existing auth service has no token expiry model.

## AI-use record

Tool: Codex. Representative request: “okay then make it and push or whattver to the repo,” referring to UC-8. Codex inspected current main, UI rules, ADRs, existing services and supplied Assignment 3 wireframes; implemented the screen, sign-in boundary, isolated demo, component tests, browser tests and this evidence. Codex ran the commands above and reviewed results. Saif's own code review, explanation and manual verification remain pending; this document does not claim they occurred.
