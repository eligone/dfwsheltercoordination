# DFW(Dallas Fort Worth) Shelter Coordination TEAM 2

A tool that helps dog shelters across the Richardson/Dallas (DFW) area coordinate available space so fewer dogs are put down before every transfer option has been exhausted. Built for CS/CE/SE 3354 (Software Engineering), Fall 2026.

## The Problem

Local shelters often don't know when a nearby shelter has open capacity. A dog can be euthanized at one location while space is available a few miles away, simply because there's no shared way to see it. This project closes that gap to ensure that these dogs can get to a new shelter .

## What It Does

The app has three core components:

1. **Shelter Intake** — participating shelters log their current capacity data (available kennels, incoming intakes, animals at risk).
2. **Shared Capacity Dashboard** — a real-time view of space across all participating shelters, so staff can see where room exists at a glance.
3. **Match & Alert Logic** — automatically flags when a shelter nearing capacity could transfer an animal to a shelter with open space, and notifies both parties. *(This is the piece the team is most focused on.)*

## How It Works / Architecture 

```
[Shelter Staff]                [Public Data]
      |                              |
      v                              v
 Shelter Intake UI          Petfinder API (organizations
 (login required)            + adoptable-animal listings,
      |                      by location + radius)
      v                              |
   Backend API  <---------------------
      |
      v
  Database (shelters, capacity records, animals, users, notification)
      |
      v
  Match/Alert Engine (runs on a schedule or on capacity update)
      |
      v
 Shared Capacity Dashboard  +  Alerts/Notifications to shelter staff
```

**Data comes from two places, not one:**
- **Self-reported capacity** — each participating shelter logs in through the Shelter Intake UI and enters current kennel counts, incoming intakes, and animals at risk. This is the source of truth for capacity, since no public API exposes it.
- **Petfinder API** — used to pull each organization's public profile and adoptable-animal listings within a set radius, as supporting/contextual data (not a capacity source).

**Participating shelters (initial radius — ~20 mi around Richardson, TX):**
- Richardson Animal Shelther
- Dallas Animal Services
- Collin County Animal Services (McKinney)
- Plano Animal Services
- Irving Animal Care Campus
- Carrollton Animal Services & Adoption Center

**Match/Alert logic:** when a shelter's self-reported capacity crosses a threshold (e.g. near-full or an at-risk animal flagged), the engine checks other participating shelters' latest reported capacity and, if a match exists, notifies both shelters' staff with contact/transfer info.

## Contributing / UI rules

**Do not change the UI without the UI skill.** Read [UI_GUIDE.md](UI_GUIDE.md) first. The rules are in
[`.claude/skills/ui/SKILL.md`](.claude/skills/ui/SKILL.md), decisions are recorded in
[`docs/adr/`](docs/adr/README.md), and every pull request runs the `ui-check` job.

```bash
cd frontend && npm install && npm run dev   # wireframe viewer at http://localhost:5173
```

## Current Assignment 4 stack and running code

The implemented Part 1 stack is **React 19 + Vite 8 + Tailwind CSS 4**, with plain JavaScript in-memory services. See [ADR-0009](docs/adr/0009-part1-implementation-layout-and-test-stack.md). The architecture diagram above describes the planned backend; this repository does not yet connect to a production database or Petfinder API.

```bash
cd frontend
npm ci
npm run dev
```

Open the URL Vite prints, then:

- **Integrated class demo:** `/app.html`. Sign in as Richardson with `jdoe@richardson.example` / `pw-rich`. Use **Home** to update capacity and find matches, **My Dogs** for outgoing and incoming transfer requests, **Settings** for history and notification preferences, and the **bell** for alerts.
- **Show a transfer across shelters:** Find a match for Duke and send a request to Collin County Animal Services. Sign out and sign in as `staff@collin.example` / `pw-collin` in the same tab. Open Duke's alert and accept the request. Sign back in as Richardson and check **My Dogs** for the Accepted status. The demo uses mock data and resets on page reload.
- **Wireframe gallery:** `/`; choose a teammate's name. Saif's UC-8 and UC-10 states are under **Saif**.
- **Working UC-8/UC-10 screens:** `/saif-demo.html?fixture=true`, also linked under **Working screens** in the gallery.
- **Mock sign-in:** `jdoe@richardson.example` / `pw-rich`.
- **My Dogs:** choose **View my dogs**; select **View details** on a transfer; **Back to Home** returns to the dashboard.

These are working components in `frontend/src/features/saif/`, separate from the static assignment wireframes in `frontend/src/wireframes/saif/`. The explicit fixture clock reproduces the assignment data; omit `?fixture=true` to use the current clock. In-memory changes reset on reload.

```bash
npm run check:ui
npm run build
npm run test:coverage
npx playwright install chromium
npm run test:e2e
```

## Team

| Name | Role/Focus |
|---|---|
| [Name 1] | [Focus area] |
| [Name 2] | [Focus area] |
| [Name 3] | [Focus area] |
| [Name 4] | [Focus area] |
| [Name 5] | [Focus area] |
| [Name 6] | [Focus area] |

## Project Status

Early development — Project Assignment 1 (team formation & SOW) for SE 3354, Fall 2026.

## License

[TBD — add a license if the team wants the repo public beyond the course]
