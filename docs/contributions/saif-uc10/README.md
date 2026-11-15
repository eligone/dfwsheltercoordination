# UC-10 My Dogs transfers contribution

Owner: Saif Yusuff. Implemented with Codex assistance on November 15, 2026.

## Contribution for the SE Document

Saif's UC-10 screen displays the signed-in shelter's transfer requests with dog name, breed, size, destination, request time and status. Completed transfers remain visible. Staff can open and close transfer details containing the receiving shelter's phone/email and request timestamp. The exact empty message is `No active transfers.` The screen reads only through the existing authorized `listMyDogs()` and `getMyDogTransfer()` methods, including when a request ID is supplied in the URL. A `transfer-changed` event updates both the list and any open details without a reload. Shared auth handling removes the screen after sign-out; switching staff resets the selected details.

Modules: `frontend/src/features/saif/MyDogsTransfers.jsx` owns list/details rendering and subscriptions. `SharedDashboard.jsx` now hosts both use cases with View my dogs / Back to Home actions and shared sign-in. `demo.jsx` creates the mock app and supports direct My Dogs/detail links. Component tests sit beside the screen; browser tests are in `frontend/e2e/saif-transfers.spec.js`.

Cross-team integration: `frontend/src/services/index.js` adds an optional, idempotent unsubscribe return value to the existing event bus and emits over a snapshot so listener cleanup cannot skip the next listener. Existing callers may continue ignoring the return value. `events.test.js` tests cleanup and duplicate subscriptions. No transfer creation, matching, acceptance rules, shared UI components or design tokens were changed.

This branch builds on the UC-8 work in PR #5. It includes that commit until the parent feature is integrated. Only the later UC-10 commit adds this contribution.

## Preview and reproduce

From `frontend/`, run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 5188 --strictPort`.

- Home: `/saif-demo.html?fixture=true`; choose View my dogs after signing in.
- My Dogs: `/saif-demo.html?fixture=true&view=dogs`.
- Details: `/saif-demo.html?fixture=true&view=dogs&request=T-301`.
- Richardson mock staff: `jdoe@richardson.example` / `pw-rich`.
- Dallas mock staff: `staff@dallas.example` / `pw-dal`. Dallas sees the empty state, and Richardson request details are refused.

The explicit fixture fixes the clock at November 4, 2026, 10:00 UTC. Data lives in memory and resets on reload. The browser live-update test temporarily signs in the receiving mock user, invokes the existing acceptance service, and restores Richardson synchronously; this simulates a change elsewhere in the same in-memory instance. It does not imply cross-browser synchronization or a production backend.

## Functional test results

| Test | Expected | Actual | Status |
| --- | --- | --- | --- |
| TC-10-01 | Biscuit Pending to Collin; Pepper Accepted to Plano; Luna Completed to Irving; breed/size/date shown | Three rows matched all listed fields and order; Completed stayed visible | Pass: service, component, browser |
| TC-10-02 | Biscuit requested 2026-11-03 14:20; Collin phone (972) 555-0103 and email staff@collin.example | Details showed exact values and could be closed | Pass: service, component, browser |
| TC-10-03 | Exact empty message; acceptance updates the page without reload | Dallas saw No active transfers.; Biscuit changed to Accepted in both list and details while the same browser document remained loaded | Pass: service, component, browser |
| TC-10-04 | Other shelters cannot list Richardson dogs or retrieve their details | Dallas saw none of Biscuit/Pepper/Luna; direct T-301 request refused, with no contact disclosure | Pass: service, component, browser |

Additional authorization/lifecycle checks: anonymous list/details refused; unverified contacts hidden; missing request handled; external sign-out removes open details; changing staff clears the prior selection. These are automated checks for Part 1 services and screens, not production security validation.

## Commands and evidence

Environment: macOS arm64, Node 25.9.0, npm 11.12.1, Vitest 5.1.0, Vite 8.3.8, Playwright Chromium. Existing dependency engine warning applies to Node 25; CI uses Node 22.

- `npm run test -- src/features/saif/MyDogsTransfers.test.jsx src/services/myDogs.test.js src/services/events.test.js`: 16 passed across 3 files.
- `npm run test:coverage`: all 138 tests passed across 15 files in 10.65 seconds. Overall statements 94.50%, branches 86.28%; services statements 96.49%. Raw output: [unit-coverage.txt](unit-coverage.txt).
- `npm run build`: passed; viewer and Saif feature entry built.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/saif-uc8-browsers npx playwright test --config playwright.saif.config.js`: all 6 browser tests passed in 3.3 seconds, covering both UC-8 and UC-10. Standard setup: `npx playwright install chromium`, then omit the custom browser path.
- `npm run check:ui`: failed on the same 6 existing Rule 2 folder violations under `src/featuresjoshua/joshua/`; no UC-10 violations reported. This team issue still blocks green UI CI.
- Deliberate-fault check: temporarily disabled the transfer-change listener; the live-update component test failed because Biscuit remained Pending. Restored the original source and reran that test successfully. This was an automated Codex check, not human verification.

Screenshots reviewed by Codex: [list](list.png), [details](details.png), [live update](live-update.png), [empty list and denied access](denied.png).

## Remaining team and manual items

NTC-12: the existing three navigation labels were checked on Home and My Dogs. The complete five-screen scenario (including Settings, Alerts and Shelter Details) remains Not Run. Top navigation labels are still static; this feature provides functional Home/My Dogs action buttons without changing the shared UI library. The shared navbar also retains its existing default Richardson label even for a different mock account; the signed-in line below the heading shows the actual account/shelter. Correcting shared navigation is a separate team component change.

NTC-13: the five-person usability test remains Not Run. Saif's human review, explanation and any manual test timings remain pending. The team's live testing document was not edited; this contribution text is ready to paste into it. Two additional shared team tasks are separate from this use-case contribution.

## AI-use log

Tool: Codex. Representative prompt: “okay now go ahead and do the next use case,” following the approved UC-8/UC-10 plan. Codex inspected the existing service authorization, event bus and UI rules; implemented UC-10, Home/My Dogs actions, subscription cleanup and automated tests; ran functional, authorization, browser and regression checks; inspected real screenshots; and recorded limitations. The deliberate-fault check verified the live-update test detects a disabled listener. No claim is made that Saif or five human participants performed these checks. Saif should review the implementation and record any later changes before submitting his own AI-use statement.
