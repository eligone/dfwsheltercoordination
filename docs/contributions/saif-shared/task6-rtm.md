# 7.8 Requirements traceability matrix

Prepared by Saif Yusuff for shared task #6, November 15, 2026. This matrix maps all 42 functional and 14 non-functional requirements from Assignment 3 to use cases, current code and test IDs. It updates the earlier team draft against the UC-10 branch at commit 9911f38, including main through 00b2629. It is a review snapshot, not a claim that all requirements are complete.

Evidence legend: S = service/unit test; C = React component/integration test; B = browser test. “Passed” applies to the tested behavior described, not every aspect of the requirement. The full local run passed 138 tests in 15 files; six Saif browser tests passed separately. GitHub’s final UC-10 run also passed the matching browser flow. NTC-02, NTC-12 and NTC-13 have no executable named test in this checkout; their evidence is identified separately.

The requirement summaries preserve Assignment 3 IDs. UC-14 and UC-15 follow the team-approved additions in the Assignment 4 draft. UC-6, UC-9 and UC-12 were not selected as standalone Part 1 implementations; mapping tests to them does not claim their full screens exist. Current feature integration is represented by PRs #5 and #6, both open drafts.

## Code and test key

All paths are relative to frontend/src/, except e2e/ paths relative to frontend/.

| Key | Implementation | Tests |
| --- | --- | --- |
| SH | services/shelterStore.js | services/shelterStore.test.js; services/dashboard.test.js |
| DA | services/dashboard.js | services/dashboard.test.js |
| TR | services/transferService.js | services/transferService.test.js; services/myDogs.test.js; services/matchEngine.test.js |
| MA | services/matchEngine.js | services/matchEngine.test.js |
| AL | services/alertService.js | services/alertService.test.js |
| NO | services/notificationService.js | services/notificationService.test.js |
| AU | services/authService.js | services/dashboard.test.js; services/myDogs.test.js; services/matchEngine.test.js |
| AN | features/anais/ | FindShelters.test.jsx; MatchFlow.test.jsx; RequestTransfer.test.jsx; e2e/anais-match-flow.spec.js |
| JO | features/joshua/ | RequestAnimalTransfer.test.jsx; RespondTransfer.test.jsx |
| SA | features/saif/ | SharedDashboard.test.jsx; MyDogsTransfers.test.jsx; e2e/saif-*.spec.js |
| UI | components/ui/NavBar.jsx | Navigation assertions embedded in Saif component/browser tests |

## Functional requirements 1 to 6

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-1 Update available capacity | UC-1 | TC-1-01, TC-1-02 | SH | S passed. Capacity changes and audit record verified; UC-1 screen is not present in this checkout. |
| FR-2 Reject negative or above-maximum values | UC-1 | TC-1-03, TC-1-04, TC-1-05 | SH | S passed for negative, above-max, boundary, empty and nonnumeric input. Screen validation not rerun here. |
| FR-3 Confirm or cancel before saving | UC-1 | TC-1-01, TC-1-06 | SH | S passed for preview-before-save and dropping a draft. No confirmation/cancel screen is exercised by these service tests. |
| FR-4 View capacity change history (date, time, person) | UC-2 | TC-2-01, TC-2-02 | SH | S passed for history values, staff names and ordering. History screen not in this checkout. |
| FR-5 Filter history: month, six months, year | UC-2 | TC-2-01, TC-2-02, TC-2-03 | SH | S passed for all three ranges and no records; UI range controls not rerun here. |
| FR-6 Download history as PDF | UC-2 | TC-2-04, TC-2-05 | SH | S passed for PDF signature/content and empty-record refusal. Browser download flow not rerun here. |

## Functional requirements 7 to 11

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-7 Update current occupancy | UC-1, UC-4 | TC-1-01, TC-4-01, TC-4-02, TC-4-04 | SH/TR | S/C passed for UC-4 occupancy effects; UC-1 manual occupancy entry has service evidence only. |
| FR-8 Live dashboard of all shelters' capacity | UC-8; A3 also cross-references UC-3 | TC-8-01, NTC-03 | DA/SA | Dashboard display S/C/B passed. Five-second scheduling S passed; UC-8 screen does not start that scheduler. Live refresh remains partial. |
| FR-9 Create transfer request (urgency, needs) | UC-3 | TC-3-01, TC-3-02, TC-3-03 | TR/JO | S/C passed for request creation, missing fields and no-match handling using seeded dog needs. |
| FR-10 Score and rank shelters for a request | UC-3 | TC-3-01, TC-3-05, TC-5-01 | MA/TR/JO | S/C passed for current distance/open-space/size score and medical exclusion. A3 also mentions breed; breed is not a scoring input. Team clarification needed. |
| FR-11 Notify on high-urgency request; accept or decline | UC-3, UC-4 | TC-3-01, TC-4-01, TC-4-03 | TR/AL/JO | S/C passed for high-priority request, accept and decline. Alert delivery uses stubs. |

## Functional requirements 12 to 16

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-12 Auto-search when a shelter is full | UC-5 | TC-5-03, TC-5-05 | MA/AN | S/C passed for full-capacity prompt and search flow; saved-search rerun also verified. |
| FR-13 Manual match request for a dog | UC-5 | TC-5-01, TC-5-02, TC-5-04, TC-5-06, TC-5-09, TC-5-10 | MA/AN | S/C passed for manual selection, validation, cancel and widening; B covers a manual match flow. |
| FR-14 Rank by distance, open spaces, size fit | UC-5 | TC-5-01, TC-5-02, TC-5-07, TC-5-08 | MA/AN | S/C passed for fixed ranking and score boundaries; B covers representative large-dog ranking. Mapping is stubbed. |
| FR-15 Show name, distance, open spaces, contact | UC-6 | TC-5-01 | MA/AN | S/C passed; B checks a selected shelter contact. Match-results display is embedded in UC-5, not a standalone UC-6 page. |
| FR-16 Send transfer request from match results | UC-7 | TC-7-01, TC-7-02, TC-7-03, TC-7-04, TC-7-05, TC-7-06, TC-7-07, TC-7-08 | TR/AN | S/C passed; B covers a successful request. Duplicate-active-transfer and invalid dog checks also exist. |

## Functional requirements 17 to 24

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-17 Alerts to requesting and receiving staff | UC-14 (new) | TC-3-01, TC-7-01, TC-14-01 | AL/TR | S passed for sender/receiver alerts; UC-3/7 C checks consume results. UC-14 inbox screen not present here. |
| FR-18 Medical information; filter shelters that cannot accommodate | UC-3 | TC-3-04 | MA/JO | S/C passed for medical-capability exclusion. Dog medical data is seeded; the requirement to add/edit medical information has no demonstrated editor. |
| FR-19 Accept or decline with optional reason | UC-4 | TC-4-01, TC-4-03, TC-4-04, TC-4-05 | TR/JO | S/C passed for accept, decline with reason, full shelter and illegal transitions. |
| FR-20 Dog status follows transfer status | UC-4, UC-10 | TC-4-01, TC-4-02, TC-4-05, TC-4-06, TC-10-03 | TR/JO/SA | S/C passed for transitions and completion; UC-10 B confirms displayed acceptance without reload. Status is stored on TransferRequest. |
| FR-21 Notify accepted, declined, cancelled | UC-14 | TC-14-05, TC-4-07a, TC-4-07b, TC-4-07c | AL/TR | S passed for accepted/declined/cancelled notices and cancellation recipients. Dedicated inbox UI not verified. |
| FR-22 On-site alert inbox | UC-14 | TC-14-01, TC-14-04 | AL | S passed for inbox contents and exact empty message. Inbox wireframe exists; working UC-14 feature screen not present here. |
| FR-23 Add phone numbers and emails | UC-15 (new) | TC-15-01, TC-15-02, TC-15-06 | NO | S passed for email/phone validation, duplicates and removal. UC-15 working screen not present here. |
| FR-24 Reminder if request not viewed | UC-15 | TC-15-03, TC-15-04, TC-15-04b | NO | S passed for saved reminder settings, delayed unviewed reminder, and suppression after viewing. No running background timer is proven. |

## Functional requirements 25 to 31

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-25 Alerts include animal info and sender contact | UC-14 | TC-14-02 | AL | S passed for dog/sender contact detail. Verification redaction covered by NTC-07c; alert detail screen not verified. |
| FR-26 Read/unread, mark read after viewing | UC-14 | TC-14-01, TC-14-02 | AL | S passed for opening an alert marking it read and explicit unread support. Screen behavior not verified. |
| FR-27 Unread count | UC-14 | TC-14-01, TC-14-02, TC-14-03 | AL | S passed for unread count before/after opening and marking read. Live shared bell integration not verified. |
| FR-28 Priority labels | UC-14 | TC-14-01 | AL | S passed for priority labels and ordering. Inbox screen not verified. |
| FR-29 Filter by priority | UC-14 | TC-14-03 | AL | S passed for high-priority/unread filtering. UI filter not verified. |
| FR-30 View past alerts and outcomes | UC-14 | TC-14-02 | AL | S passed for stored outcome/history when opening a past alert. Screen not verified. |
| FR-31 Prioritize high-risk animals | UC-14 | TC-14-06 | AL | S passed for high-risk/high-urgency priority. Real delivery remains stubbed. |

## Functional requirements 32 to 36

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-32 All shelters within 20 miles on dashboard | UC-8 | TC-8-01, TC-8-03 | SH/SA | S/C/B passed for six participating seeded shelters and empty data. All seed shelters are in range; dashboard has no separate out-of-area exclusion check. |
| FR-33 Dogs housed, available kennels, total capacity | UC-8 | TC-8-01 | SH/SA | S/C passed for every seeded count; B confirms the table and representative values. |
| FR-34 Open / Near Full / Full labels | UC-8 | TC-8-01, TC-8-02 | SH/SA | S/C passed for all five occupancy boundaries; B checks Near Full/Outdated examples. Service gives Outdated precedence at 24 hours. |
| FR-35 Shelter details: address, phone, email, last update | UC-9 | TC-9-01 | SH | S passed for Collin address/contact/time. No standalone UC-9 working page or row-selection UI in this checkout. |
| FR-36 "My Shelter" dogs with transfer status | UC-10 | TC-10-01, TC-10-02, TC-10-03, TC-10-04 | TR/SA | S/C/B passed for own-shelter rows, details, Completed, exact empty state, live acceptance and cross-shelter refusal. |

## Functional requirements 37 to 42

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| FR-37 Filter and sort dashboard by status, distance, kennels | UC-8, UC-12 | TC-11-02, TC-12-01 | DA | S passed for status filtering and kennel/distance ordering. Home toolbar not integrated; no numeric distance filter is demonstrated. |
| FR-38 Search by name or location | UC-11 | TC-11-01, TC-11-03, TC-11-04, TC-11-05 | DA | S passed for case-insensitive name/location, clearing, no match and unusual input. Working UC-11 screen not present here. |
| FR-39 Filter by status | UC-11 | TC-11-02, TC-11-04 | DA | S passed for status and combined search/filter. Dashboard UI control not integrated. |
| FR-40 Sort by available kennels | UC-12 | TC-12-01 | DA | S passed for kennel ordering both directions; distance ordering also asserted. Working sort control not integrated. |
| FR-41 Show last-updated date and time | UC-13 | TC-13-02, TC-8-01 | SH/DA/SA | S passed for timestamps and missing-value label; UC-8 C checks timestamp rendering and missing value. B screenshot includes UTC times. |
| FR-42 Refresh dashboard | UC-13 | TC-13-01, TC-13-03 | DA | S passed for latest data, failure preserving rows and coalesced requests. Refresh control not integrated into UC-8 screen. |

## Non-functional requirements 1 to 7

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| NFR-1 Only authorized staff update capacity | UC-1 | NTC-01 | SH | S passed: all four unauthorized update attempts refused; capacity unchanged. Mock authorization only. |
| NFR-2 Save and show capacity within 2 s | UC-1 | NTC-02 | SH | Not Run in this checkout: no NTC-02 browser test present. Hoang supplied a separate 20/20 browser report (max 917.04 ms); not independently reproduced here. |
| NFR-3 Dashboard refresh 5 s; search within 4 s | UC-8, UC-11 (dashboard scope) | NTC-03, NTC-04 | DA | S passed: six scheduled callbacks in simulated 30 seconds and timed search calls under 4 s. Scheduler is not wired into current UC-8 UI; screen-level live refresh remains open. |
| NFR-4 Staff only; edit own shelter only | System-wide (UC-1, UC-4, UC-10) | NTC-05, TC-10-04, TC-8-04 | AU/TR | S/C/B passed for sampled own-shelter restrictions, anonymous refusal and UC-10 access. This is not a complete security audit or a production backend. |
| NFR-5 Match results within 5 s | UC-5, UC-7 | NTC-06 | MA | S passed for 30 mock match requests under 5 s. B evidence from the CI matching flow covers a representative 300 ms mapping-delay case. |
| NFR-6 Only verified accounts see matches and contacts | UC-6, UC-7; contacts in UC-8, UC-10, UC-14 | NTC-07, NTC-07b, NTC-07c, TC-10-02 | AU/MA/TR | S/C passed for unverified match refusal and redacted contacts; UC-10 C checks redaction. Seeded verification is not real account verification. |
| NFR-7 Retry failed notifications and log | UC-15 | NTC-08, TC-15-05 | NO | S passed for three failed attempts and one logged failure, using stub channels. Real email/SMS outage recovery not verified. |

## Non-functional requirements 8 to 14

| Requirement | Use cases | Tests | Code key | Observed evidence and remaining gap |
| --- | --- | --- | --- | --- |
| NFR-8 No two active transfers for one animal | UC-3, UC-7 (transfer service) | NTC-09, TC-7-06 | TR | S passed for two concurrent attempts in 100 fresh apps and duplicate match requests. Browser-local integrity only; no database concurrency test. |
| NFR-9 Record of every request, sender, recipient, outcome | UC-3, UC-4, UC-7 (transfer service) | NTC-10, TC-7-07 | TR | S passed for audit fields and retention at 364/366 days. In-memory records are not persistent production audit storage. |
| NFR-10 Staff see only their own inbox | UC-14 | NTC-11 | AL | S passed for own inbox and denied other-shelter alert ID. Working inbox UI not verified. |
| NFR-11 At most three main tabs | UC-8 (all screens) | NTC-12 | SA/UI | Not Run for full scenario. Home/My Dogs each have three labels in C/B; Settings, Alerts and Shelter Details were not all verified. |
| NFR-12 New user finds kennels within 1 minute | UC-8 | NTC-13 | SA | Not Run. Requires five actual first-time users and measured task times; no participants or timings fabricated. |
| NFR-13 Search/filter in 4 s for 95% of requests (500 records) | UC-11 | NTC-14 | DA | S passed for 100 search/filter operations over 500 generated records. Rendering/network time and production load are not measured. |
| NFR-14 Sign-in required | System-wide; UC-8, UC-10, UC-11, UC-12 | NTC-15, TC-8-04 | AU/SA | S/C/B passed for sign-in boundary, bad credentials, successful sign-in and cleared-session removal. Auth is an in-memory mock, not token-based production login. |

## Review decisions and completion gaps

The following items need team decisions or further evidence before requirements are marked complete:

1. FR-8 / NFR-3: the service has a five-second refresh scheduler, but the current UC-8 screen does not start it. Passing the scheduler unit test does not establish live capacity refresh in the screen.
2. FR-10: Assignment 3 mentions breed among scoring factors. Current scoring uses distance, open spaces and size fit, with medical-capability exclusion. Decide whether to amend the requirement or add behavior/tests; the RTM does not silently remove breed.
3. FR-18: medical filtering is demonstrated with seeded dog data; adding/editing medical information is not demonstrated.
4. FR-32: the seed has six in-area shelters. The dashboard lists participating records without a separate radius exclusion test; avoid claiming arbitrary out-of-area data is rejected.
5. FR-35 / UC-9 and FR-37 to FR-42 / UC-11 to UC-13: service tests exist, but the complete details/toolbar screens are not integrated in this checkout. TC-12-01 now does assert distance ordering, so the older draft's “distance sort has no test” statement is obsolete.
6. UC-1/UC-2 and UC-14/UC-15 working screens are not in this checkout. Hoang's supplied evidence reports his separate UI work; obtain the final integrated branch and rerun before claiming current screen coverage.
7. NTC-02: Hoang's report records 20/20 runs, average 891.62 ms and maximum 917.04 ms with a simulated 500 ms delay. Treat this as owner-supplied evidence until its test and implementation are available here.
8. NTC-12 remains Not Run for all five screens; NTC-13 remains Not Run until five actual new users are timed. Production authentication, mapping, delivery, persistence and concurrency are outside this mock verification.

There are 56 unique requirement rows and no missing requirement IDs. Every referenced executable TC/NTC was matched to a named test in the repository; the three expected exceptions are NTC-02, NTC-12 and NTC-13. This checks traceability, not completeness of assertions. New TC-5-07 to TC-5-10 and TC-7-05 to TC-7-08 are included where relevant. No test IDs were renumbered.

## Sources and contribution record

Baseline requirements: Group02_SE_Document_Assignment_3-Fall2026.docx, Sections 2 and 3. Team mapping/use-case additions: Hoang's supplied Assignment 4 draft, Sections 1.4, 1.8 and 1.9. External owner evidence: Assignment 4 Test stuff.pdf, Hoang's NTC-02 report. Current repository, named tests, final local output and [PR #6 CI](https://github.com/eligone/dfwsheltercoordination/actions/runs/43777684176) provide the code/test snapshot.

Saif owns this shared task; Codex prepared the mapping and checked IDs against source. Saif's human review and the team's resolution of the listed gaps remain pending. Earlier draft wording that all feature screens were absent was updated; no historical service-only Pass was promoted to a full screen Pass without evidence.
