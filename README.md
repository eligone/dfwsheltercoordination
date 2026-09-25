# DFW Shelter Coordination

A tool that helps dog shelters across the Richardson/Dallas (DFW) area coordinate available space so fewer dogs are put down before every transfer option has been exhausted. Built for CS/CE/SE 3354 (Software Engineering), Fall 2026.

## The Problem

Local shelters often don't know when a nearby shelter has open capacity. A dog can be euthanized at one location while space is available a few miles away, simply because there's no shared way to see it. This project closes that gap.

## What It Does

The app has three core components:

1. **Shelter Intake** — participating shelters log their current capacity data (available kennels, incoming intakes, animals at risk).
2. **Shared Capacity Dashboard** — a real-time view of space across all participating shelters, so staff can see where room exists at a glance.
3. **Match & Alert Logic** — automatically flags when a shelter nearing capacity could transfer an animal to a shelter with open space, and notifies both parties. *(This is the piece the team is most focused on.)*

## Tech Stack

- **Frontend:** [e.g. React]
- **Backend:** [e.g. Node.js / Express, Python / Flask]
- **Database:** [e.g. PostgreSQL, MongoDB]
- **Authentication:** [e.g. JWT-based login, OAuth]
- **Hosting/Deployment:** [e.g. Render, Vercel, Heroku]

*(Fill in once the team locks in the stack — see the Statement of Work for the authentication/registration requirement.)*

## Getting Started

### Prerequisites

- [Language/runtime version, e.g. Node.js 18+]
- [Database installed locally, or a connection string for a hosted instance]

### Installation

```bash
git clone https://github.com/[org]/[repo-name].git
cd [repo-name]
[install command, e.g. npm install]
```

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=
JWT_SECRET=
[other keys as needed]
```

### Running Locally

```bash
[start command, e.g. npm run dev]
```

The app will be available at `http://localhost:[port]`.

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
