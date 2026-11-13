# 0006. Navigation is Home / My Dogs / Settings

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
NFR-11 says the dashboard has no more than three main navigation tabs: Home, My Dogs and Settings.
The sitemap (SE doc 4.1) places Capacity Update, Animal Matching, Alerts and Capacity History under
those.

## Decision
`NavBar` has exactly those three tabs plus a bell with the unread count (FR-27), which opens
Alerts / Notifications. App name in the UI is "DFW Shelter Tracker" (the system name used in the use
cases).

## Consequences
- Wireframes must not add tabs; other screens are reached from Home, My Dogs or Settings.
- Open question for the SE doc: UC-5 starts matching from the dashboard ("Find Match"), but the
  sitemap only reaches matching through Shelter Details. Update one of the two to agree.
