# Saif Yusuff Assignment 4 team handoff

Prepared November 15, 2026. This package covers Saif's implemented UC-8 and UC-10 contribution and is ready to copy into the team's testing document and SE Document. It does not claim human review or usability testing has happened.

## Code ready for review

- [UC-8 draft PR #5](https://github.com/eligone/dfwsheltercoordination/pull/5): Shared Dashboard, sign-in boundary, capacity/status display and empty state.
- [UC-10 draft PR #6](https://github.com/eligone/dfwsheltercoordination/pull/6): own-shelter transfer list, transfer details, event-driven updates and Home/My Dogs actions. This branch includes UC-8 and the team's current-main folder correction. Coordinate integration of #5 and #6 to avoid duplicating the parent work.

Both PRs remain open drafts; neither has been merged by Codex. On PR #6, GitHub's ui-check, unit-tests and e2e jobs all passed. [Final CI run](https://github.com/eligone/dfwsheltercoordination/actions/runs/43777684176).

## Implementation contribution for Section 6

Saif's contribution implements two React web use cases using the team's existing in-memory service layer and grayscale shared UI components. UC-8 displays six participating shelters with dogs housed, total kennels, available kennels, status and last-update time. It reuses the existing 85% Near Full, 100% Full and 24-hour Outdated rules, handles the exact no-data message, and requires staff sign-in.

UC-10 displays transfer requests sent by the signed-in shelter, with dog name, breed, size, receiving shelter, request date and status. Pending, Accepted and Completed seeded transfers are visible. Staff can open and close details showing request time and receiving-shelter contact information. Service authorization refuses another shelter's list/detail access, and the service redacts contacts for unverified accounts. The screen subscribes to the existing transfer-change event so both the table and open details update without a reload. Sign-out removes protected content, and changing staff resets selected details.

Main modules:

| Module | Purpose |
| --- | --- |
| frontend/src/features/saif/SharedDashboard.jsx | Shared sign-in boundary and Home/My Dogs screen flow; shelter capacity overview |
| frontend/src/features/saif/MyDogsTransfers.jsx | Authorized transfer list, details and event subscription |
| frontend/src/features/saif/demo.jsx | Isolated in-memory preview and explicit fixed-clock fixture mode |
| frontend/src/services/index.js | Small backward-compatible event unsubscribe addition, with listener snapshot delivery |
| frontend/src/features/saif/*.test.jsx | Component and integration checks for both screens |
| frontend/src/services/events.test.js | Event-subscription cleanup regression checks |
| frontend/e2e/saif-dashboard.spec.js and saif-transfers.spec.js | Browser acceptance checks and screenshot capture |

The event-bus cleanup change is shared-service integration and should be reviewed by the team. Transfer creation, matching and acceptance business rules were reused, not rewritten. No backend, database, external map, Petfinder integration or cloud infrastructure was added.

## Test execution contribution for Section 7

Environment: local macOS arm64, Node 25.9.0, npm 11.12.1, Vitest 5.1.0, React Testing Library and Playwright Chromium. CI uses Node 22 on Ubuntu. Fixture clock: November 4, 2026, 10:00 UTC; seeded mock accounts and data. Session expiry is represented by clearing the existing in-memory session; the auth service has no production token-expiry model.

| Case | Expected result | Actual result | Status and evidence level |
| --- | --- | --- | --- |
| TC-8-01 | Six shelters with capacity values and correct statuses | Six rendered rows matched all seeded counts/statuses; UTC timestamp rendered | Pass: service/component; browser confirmed six rows and representative statuses |
| TC-8-02 | 50/60 Open; 51/60 and 59/60 Near Full; 60/60 Full; 0/60 Open | All five boundaries matched | Pass: service/component |
| TC-8-03 | No shelter data available. | Exact message and no table | Pass: service/component/browser |
| TC-8-04 | Signed-out/session-cleared staff return to Sign In without protected data | Anonymous visitor saw sign-in, incorrect password rejected, valid login displayed data, cleared session removed data | Pass: service/component/browser |
| TC-10-01 | Biscuit Pending to Collin; Pepper Accepted to Plano; Luna Completed to Irving | All three rendered with expected breed, size, destination, date and status; Completed remained visible | Pass: service/component/browser |
| TC-10-02 | Biscuit request time 2026-11-03 14:20; Collin phone/email | Exact timestamp, (972) 555-0103 and staff@collin.example shown in authorized details | Pass: service/component/browser |
| TC-10-03 | Exact empty message; status updates without reload | Dallas showed No active transfers.; acceptance changed Biscuit to Accepted in list and open details without replacing the browser document | Pass: service/component/browser |
| TC-10-04 | Dallas cannot see Richardson's dogs or their transfer details | No Biscuit/Pepper/Luna rows or contacts; T-301 detail access refused | Pass: service/component/browser |
| NTC-12 | Exactly Home, My Dogs, Settings on all five specified screens | Home/My Dogs labels checked; Settings, Alerts and Shelter Details not all verified | Not Run for the full scenario |
| NTC-13 | At least 4 of 5 first-time users find Collin's available kennel count in 60 seconds | No participants tested | Not Run |

Additional automated checks cover missing request IDs, unverified contact redaction, session loss, switching staff and safe subscription cleanup. A deliberate-fault check temporarily disabled the transfer-change callback: the live-update test failed because Biscuit stayed Pending. The source was restored and the test passed again.

Final local validation:

- `npm run test:coverage`: 138 tests passed across 15 files; final run 10.63 seconds.
- Coverage: 89.89% statements, 82.37% branches overall; services 96.49% statements. Overall coverage includes Joshua's files after the team's folder correction.
- `npx playwright test --config playwright.saif.config.js`: six UC-8/UC-10 browser tests passed in 3.3 seconds. The local run used an explicit temporary Chromium path; standard setup uses `npx playwright install chromium` first.
- `npm run build`: passed.
- `npm run check:ui`: passed after incorporating the team's folder correction from main. Earlier failures in the historical UC-8 report predate that correction.
- GitHub ui-check, unit-tests and e2e: all passed on the final UC-10 revision.

## Screenshots and detailed reports

- [Dashboard](../saif-uc8/dashboard.png) and [dashboard empty state](../saif-uc8/empty.png).
- [Transfer list](../saif-uc10/list.png), [transfer details](../saif-uc10/details.png), [live status change](../saif-uc10/live-update.png), [Dallas empty list and denied detail](../saif-uc10/denied.png).
- [Detailed UC-8 report](../saif-uc8/README.md), [detailed UC-10 report](../saif-uc10/README.md), [latest test output](../saif-uc10/unit-coverage.txt).

Screenshots are actual browser captures inspected by Codex. Historical UC-8 results remain available; the combined status above reflects the later UC-10 integration.

## AI-use note for review before submission

Tool: Codex. Representative requests were “make it and push … to the repo” for UC-8 and “go ahead and do the next use case” for UC-10. Codex read the team specifications, prior wireframes, current repository, UI skill and architecture decisions; implemented the two screens; added component/browser tests and event cleanup; executed the commands; inspected screenshots; and prepared evidence and draft PRs. A disabled-listener fault was caught by the live-update test. The team's concurrent folder correction was integrated before final checks.

Saif's personal review, ability to explain the implementation, manual verification and any revisions following review must be recorded after they actually occur. This note deliberately does not attribute Codex's automated verification to Saif.

## Quick demo for Saif and the team

Check out the UC-10 branch, enter `frontend/`, run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 5188 --strictPort`.

Open `http://127.0.0.1:5188/saif-demo.html?fixture=true`. Sign in with the mock Richardson account `jdoe@richardson.example` / `pw-rich`. Check the dashboard, choose View my dogs, inspect Biscuit, and return with Back to Home. For the Dallas access check, sign out and use `staff@dallas.example` / `pw-dal`; the My Dogs list should be empty. A direct link with `&view=dogs&request=T-301` must refuse Richardson details for Dallas.

The fixed-clock fixture is important: without it, old seed update dates correctly become Outdated. Data resets on reload. Live updates work within the same mock service instance; there is no cross-browser synchronization.

## Remaining handoff items

- Saif reviews the code, runs a personal walkthrough and records his own observations.
- Team reviews and integrates the draft PRs; no merges have been performed here.
- Paste the contribution, actual test results and reviewed AI-use note into the live team testing document. That document has not been edited by Codex.
- Complete NTC-12 across all required screens and NTC-13 with five actual first-time users.
- Shared navbar labels remain static; functional Home/My Dogs actions are provided separately. The navbar's existing default Richardson label is unchanged; the signed-in line shows the actual shelter.
- Shared-task assignments confirmed by Saif: #6 (RTM) and #8 (implementation section). See Assignment4-Task6-RTM and Assignment4-Task8-Implementation deliverables; team review remains pending.
