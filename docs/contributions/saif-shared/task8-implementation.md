# 6 Implementation

Prepared by Saif Yusuff for shared task #8, November 15, 2026. This section updates the team's earlier implementation draft using the inspected repository and executed tests. The implementation baseline is commit 9911f38 on feat/saif-uc10-transfers, incorporating main through 00b2629. Proposed workflow is distinguished from observed results so the team can incorporate this section into the SE Document without claiming unfinished work.

## 6.1 Development strategy research and selected approach

The team draft records iterative and incremental Agile, described as light Scrum, as its selected approach. This fits delivery of small use-case increments with feedback and repeated testing. The Agile Manifesto supports frequent working releases, responsiveness to changing requirements and regular improvement [1]. NASA's lifecycle guidance describes several viable models and emphasizes documenting why a model fits the project [2]. The comparisons below apply those ideas to this six-person course project; the fit judgments are our project assessment.

| Strategy | Characteristics | Assessment for this project |
| --- | --- | --- |
| Waterfall | Work progresses through planned requirements, design, implementation and verification stages [2]. | Useful for the assignment's formal documents, but a single late integration/test phase would delay discovery of shared-service conflicts. |
| Incremental delivery | Each build adds a subset of behavior with its own development and integration activities [2]. | Strong fit. A dashboard or transfer flow can be implemented and tested before the whole system is integrated. |
| Agile with Scrum practices | Short increments use inspection and adaptation; formal Scrum also defines accountabilities, events and artifacts [1, 3]. | Strong fit for changing implementation details. The supplied draft's light Scrum label describes intent; the repository alone does not establish that all Scrum events or accountabilities were used. |
| Kanban | The workflow is made explicit, work in progress is controlled and flow is improved [4]. | Useful alongside the chosen approach for tracking shared tasks and blocked PRs. A Kanban board or WIP policy has not been verified in this review. |
| Spiral | Development cycles use explicit risk assessment to guide the next work [2]. | Risk reviews are useful, but a full risk-driven process would add coordination overhead for the assignment's limited mock implementation. |

We implement the selected approach through small feature slices: agree on observable results, reuse the shared service contract, build the screen, run tests, and submit a focused PR. Existing code shows incremental delivery through owner feature folders, service tests and separate demo flows. Weekly check-ins and other ceremonies remain a team process commitment, not a result inferred from the code.

## 6.2 Architecture and implementation scope

The Part 1 implementation is a desktop-browser React application built with Vite and Tailwind. Plain JavaScript services hold the current business rules and share one in-memory state object created by createApp(). Services use injected clocks, a small event bus and stub mapping/notification adapters. Feature screens compose the shared UI library and consume those services. Wireframes remain separate mock-only artifacts under wireframes/.

This implements the presentation and service responsibilities of the Assignment 3 layered design without deploying its proposed cloud architecture. Next.js, Express, Supabase, a production database, Petfinder integration, real mapping and real email/SMS delivery are not present. Service signatures are a starting contract for future APIs; a production backend must enforce its own authorization, validation and concurrency rules.

| Area | Current implementation |
| --- | --- |
| components/ui/ | Shared Button, Card, Table, Badge, fields, page shell and three-label navbar; grayscale design tokens in index.css |
| mock/ and services/seed.js | Six shelters, dogs, transfers, staff accounts and related fixture data; no production credentials |
| services/ | Shelter/capacity history/PDF, transfer lifecycle/audit, matching, alerts, notifications, authentication and dashboard selectors |
| features/anais/ | UC-5 and UC-7 screens, flow and component tests |
| features/joshua/ | UC-3 and UC-4 screens, flow and component tests |
| features/saif/ | UC-8 and UC-10 screens, common sign-in boundary, Home/My Dogs actions and component tests |
| test/ and e2e/ | Fixed-clock factories, RTL setup, and Playwright browser tests |

The default index.html still mounts the wireframe viewer, rather than a unified production app. Anais and Joshua have separate development demo entries; Vite's current production input includes the viewer and Saif's entry. Saif's entry supports both Home and My Dogs. The shared navbar labels are not a global router, and Settings/Alerts/Shelter Details are not all integrated working screens.

## 6.3 Work organization and contribution ownership

Each student implements two selected use cases, with module-purpose comments, tests, actual results and an AI-use note. Shared task ownership is separate from use-case ownership. Saif has confirmed shared tasks #6 (the RTM) and #8 (this implementation section).

| Owner | Selected Part 1 use cases | State in inspected checkout |
| --- | --- | --- |
| Hoang Pham | UC-1 capacity update; UC-2 history | Service/tests present. Separate supplied UI evidence exists; integrated feature screens are absent here. |
| Joshua Nakka | UC-3 request transfer; UC-4 respond | Feature screens and component tests present. |
| Anais Elizabeth Gonzalez | UC-5 available shelters; UC-7 request dog transfer | Feature screens, component tests and a browser matching/request flow present. |
| Avalon Austin | UC-14 inbox; UC-15 notification preferences | Service/tests and wireframes present; working feature screens absent here. |
| Saif Yusuff | UC-8 shared dashboard; UC-10 My Dogs transfers | Both implemented with component/browser evidence in open draft PRs #5 and #6. |
| Awais Afridi | UC-11 search/filter; UC-13 refresh | Shared selectors, auth and test factories present; working dashboard toolbar absent here. |

Shared-service stewardship follows the supplied team plan: Hoang for shelterStore, Joshua for transferService, Anais for matchEngine, Avalon for alerts/notifications, Saif for dashboard status/selectors, and Awais for authentication and factories. Existing status utilities remain in shelterStore; stewardship does not justify moving tested logic solely to match the ownership table. Changes crossing these boundaries should be explicit in review.

The planned work sequence is: establish services and tools; complete owner screens with component tests; integrate flows and browser tests; then reconcile results, RTM, diagrams and presentation. These are dependency stages, not claimed dated sprints. Before the team submits, each owner supplies actual results and a reviewer confirms that the documented behavior matches the integrated version.

## 6.4 Tools and verification practice

The repository uses JavaScript ES modules, React 19, Vite 8, Tailwind 4, Vitest with jsdom, React Testing Library/user-event/jest-dom, V8 coverage and Playwright Chromium. Node 22 is configured in CI. npm ci uses the committed lockfile. The observed local machine used Node 25.9.0, which generated a Vitest engine warning; CI's supported Node 22 run passed.

Tests sit beside services or feature screens. Service tests cover validation, status boundaries, ranking, transitions, authorization, retries and retention. Component tests exercise rendered data, user actions and messages. Browser tests exercise selected complete flows. Fixed clocks make timestamp-dependent assertions reproducible. Mapping and notification stubs provide controlled delays/failures, so their results must not be described as production performance.

The RTM maps requirement IDs to test IDs, code and evidence levels. Coverage measures executed source, not requirement completion. For UC-10, disabling the transfer-change callback caused the live-update test to fail; restoring it made the test pass. This provides specific evidence that the test catches a lost subscription rather than merely checking seeded Accepted data.

| Command from frontend/ | Purpose / observed result |
| --- | --- |
| npm ci | Install locked dependencies; initial install completed with zero reported vulnerabilities. |
| npm run check:ui | Enforce allowed folders/imports/token rules; passed after the team's folder correction. |
| npm run test:coverage | 138 tests passed in 15 files; 89.89% overall statements, 82.37% branches; services statements 96.49%. |
| npm run build | Built the wireframe viewer and Saif entry successfully. |
| npx playwright install chromium | Standard browser setup; local execution used a downloaded temporary browser directory. |
| npx playwright test --config playwright.saif.config.js | Six local UC-8/UC-10 browser tests passed; dedicated strict port 5188 prevents reusing an unrelated app. |

GitHub Actions has ui-check/build, unit-tests/coverage and e2e jobs. The final PR #6 run passed all three, including the repository's existing matching browser flow [5]. CI does not yet enforce an 80% coverage threshold in configuration; the supplied plan's 80% service statement target is a review criterion. A screen without an executable test must not inherit Pass solely from a service test.

## 6.5 Configuration management and integration

The team hosts the private repository on GitHub [6]. Feature branches and draft PRs keep owner contributions reviewable. Saif used feat/saif-uc8-dashboard and feat/saif-uc10-transfers. The latter builds on UC-8 and includes the team's concurrent main change moving Joshua's files into the approved features/joshua folder. That correction resolved the earlier UI-check failure without weakening the checker.

The proposed merge policy is to keep main passing, require a teammate review and green checks, and document shared-service changes in the PR. No branch-protection settings were verified, so this is a team policy rather than a claim of enforcement. Saif's two PRs remain open drafts and have not been merged by Codex. The team must coordinate their dependency when integrating them. A submission tag should be created only after integration and final evidence review; no submission tag or deployment is claimed here.

The default feature isolation remains useful, but a passing build does not mean all separate demos form a complete app. Integrate entry points, global navigation and shared state deliberately, preserving each owner's service contracts. Re-run the relevant checks after integration and resolve stale documentation against the actual submission commit.

## 6.6 Delivered behavior and remaining work

Saif delivered the capacity overview, sign-in boundary, exact dashboard empty state, own-shelter transfer list/details, Completed visibility, live transfer-event updates, session-loss handling and Home/My Dogs actions. The transfer service already enforced list/detail scope; the new screen uses it. The only cross-team service change adds idempotent event unsubscribe and snapshot iteration, with regression tests.

Several requirements remain partial despite passing automated tests. The five-second scheduler is service-tested but not started by the UC-8 screen. Search/filter/sort/manual refresh controls and a standalone shelter details page are not integrated. Current scoring does not use breed, and medical data editing is not demonstrated. Stub mapping, email/SMS and in-memory storage cannot establish production reliability or security. The RTM records these gaps instead of changing requirements to fit the implementation.

NTC-12 is checked only on Home/My Dogs, so the full five-screen scenario remains Not Run. NTC-13 still requires five real first-time users with measured times. Hoang's NTC-02 PDF reports 20/20 runs, average 891.62 ms and maximum 917.04 ms, but its test/UI are not present in this checkout and were not reproduced here. Saif must review and explain the implementation and record his own checks before submitting his AI-use note.

## 6.7 References and preparation record

[1] Agile Manifesto authors, Principles behind the Agile Manifesto. https://agilemanifesto.org/principles.html

[2] NASA Software Engineering Handbook, SWE-019 Software Life Cycle, Version B guidance. https://swehb.nasa.gov/spaces/SWEHBVB/pages/32604451/SWE-019%2B-%2BSoftware%2BLife%2BCycle

[3] Ken Schwaber and Jeff Sutherland, The 2020 Scrum Guide. https://scrumguides.org/scrum-guide.html

[4] Kanban Guides, The Kanban Guide, May 2025. https://kanbanguides.org/the-kanban-guide/2025.5/

[5] Final verified UC-10 CI run. https://github.com/eligone/dfwsheltercoordination/actions/runs/43777684176

[6] Repository and code review: https://github.com/eligone/dfwsheltercoordination ; UC-8 https://github.com/eligone/dfwsheltercoordination/pull/5 ; UC-10 https://github.com/eligone/dfwsheltercoordination/pull/6

Internal sources: the Assignment 3 SE Document, Sections 2, 3 and 5; Hoang's supplied Assignment 4 Markdown draft, Part 2; Assignment4_Who_Does_What.docx.pdf; Assignment 4 Test stuff.pdf; README, UI_GUIDE, UI skill, ADR-0009, package/lock files, CI configuration, current source, tests and execution output. External references accessed November 15, 2026. Fit assessments are project judgments informed by these sources.

Contribution: Saif Yusuff owns shared task #8. Codex prepared this section from the sources, verified code paths and recorded test evidence. Human review, process-ceremony confirmation and final team approval remain pending; no teammate's historical AI-use verification was invented or attributed to Saif.
