# Remaining manual checks for Saif

These records are blank or partial. They must be updated only after the checks actually occur.

## NTC-12 Navigation across five screens

Expected: exactly Home, My Dogs and Settings as the main navigation labels on Home, My Dogs, Settings, Alerts and Shelter Details. Alerts is reached through the bell, not a fourth main tab.

| Screen | Current evidence | Actual manual observation | Full-scenario status |
| --- | --- | --- | --- |
| Home | Component/browser assertions passed on Saif's preview | Not recorded | Partial |
| My Dogs | Component/browser assertions passed on Saif's preview | Not recorded | Partial |
| Settings | Not verified as a working integrated page | Not recorded | Not Run |
| Alerts | Not verified as a working integrated page | Not recorded | Not Run |
| Shelter Details | Not verified as a working integrated page | Not recorded | Not Run |

Overall NTC-12: Not Run for the complete five-screen scenario. Record the final integrated commit, date, browser, tester and evidence paths when completing it.

## NTC-13 First-time-user kennel task

Evaluator setup: use the fixed-clock fixture with seed data, sign in as Richardson staff and begin on Home. Use five actual first-time users, without training. Reset the view before each person. Give each person only this task: “Find the number of available kennels at Collin County.” Start the timer when the task begins after login, stop when they identify the number, and record mistakes or assistance. Do not coach the participant or supply the answer.

Evaluator answer key: the specified fixture shows Collin County with 40 available kennels. Keep this answer key and previous participants' results out of the participant view. Acceptance: at least four of five complete the task correctly within 60 seconds. A timed failure or incorrect answer is a failure; do not invent or substitute participants.

| Participant code | Actual time in seconds | Correct count identified | Assistance / observations | Result |
| --- | --- | --- | --- | --- |
| P1 | Not measured | Not recorded | Not recorded | Not Run |
| P2 | Not measured | Not recorded | Not recorded | Not Run |
| P3 | Not measured | Not recorded | Not recorded | Not Run |
| P4 | Not measured | Not recorded | Not recorded | Not Run |
| P5 | Not measured | Not recorded | Not recorded | Not Run |

Date: not recorded. Integrated commit: not recorded. Browser: not recorded. Evaluator: not recorded. Correct completions within 60 seconds: not measured. Overall result: Not Run.

## Saif's personal review record

Record after performing the work: code/commit reviewed; commands personally executed; dashboard and transfer flows checked; what the event subscription and unsubscribe do; how list/detail authorization is enforced; changes made after review; actual observations and unresolved issues. Codex's automated checks are already documented separately and should not be described as personal human checks.
