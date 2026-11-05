---
name: ui
description: Required rules for ANY change to the DFW Shelter Tracker UI in frontend/ (wireframes, shared components, design tokens, mock data, viewer). Use this skill before creating or editing any .jsx/.css file under frontend/src, before building a wireframe for a use case, and before opening a pull request that touches the UI.
---

# DFW Shelter Tracker: UI skill

Every UI change follows these rules. CI runs `npm run check:ui` on every pull request
to `main`. A PR that breaks a rule cannot be merged. Decisions behind these rules are in
`docs/adr/`.

## What we are building right now
Low-fidelity, **grayscale** wireframes for the SE document (Section 4). Each person
makes **2 wireframes** for their own use cases. A wireframe can be one **section** of a
screen and show **several states** (e.g. `default`, `error`, `no-match`). It does not
need to be a full page. There is no real logic, no backend and no API calls.

## Who owns what (from the SE doc, Section 3.1)
| Folder | Owner | Use cases / requirements | Where it lives in the sitemap (4.1) |
|---|---|---|---|
| `hoang/` | Hoang Pham | UC-1 Update Capacity, UC-2 Capacity History (FR-1–6) | Capacity Update; Settings › Capacity History |
| `joshua/` | Joshua Nakka | UC-3 Request Animal Transfer, UC-4 Respond to Transfer (FR-7–11) | Animal Matching & Transfer Requests |
| `anais/` | Anais Elizabeth Gonzalez | UC-5 Find Available Shelters, UC-6 Match Results, UC-7 Request Dog Transfer (FR-12–16) | Animal Matching & Transfer Requests |
| `avalon/` | Avalon Austin | Alerts & Notifications (FR-17–31) | Alerts / Notifications (bell) |
| `saif/` | Saif Yusuff | UC-8 Shared Dashboard, UC-9 Shelter Details, UC-10 My Dogs (FR-32–37) | Home; Shelter Details; My Dogs |
| `awais/` | Awais Afridi | UC-11 Search & Filter, UC-12 Sort, UC-13 Refresh (FR-38–42) | Home › Shelter Summary toolbar |
| `shared/` | Everyone | Sign In (NFR-14) | Sign In |

Main navigation is **Home / My Dogs / Settings** only (NFR-11). Alerts open from the bell.
Do not add tabs.

## The rules
1. **Stay in your own folder.** Your files go directly in
   `frontend/src/wireframes/<your-name>/`. Do not edit another person's folder. Do not create
   subfolders.
2. **Do not invent components.** Build only from `frontend/src/components/ui/`
   (import from `'../../components/ui'`). If something is genuinely missing, add it to
   `components/ui/` in a **separate PR**. That needs CODEOWNERS approval because everyone
   shares it. Small layout `<div>`s with Tailwind classes inside your wireframe are fine.
3. **Colors come from tokens only.** Do not use hex/rgb values, `bg-[#...]`, Tailwind
   default colors (`bg-blue-500` doesn't exist here), inline `style={...}` or CSS files.
   Allowed color classes: `canvas surface fill line muted ink accent accent-ink white
   status-full status-near status-open` with any prefix (`bg-`, `text-`, `border-`).
   Tokens live in `frontend/src/index.css`, and changing them needs CODEOWNERS approval.
4. **Imports:** only `react`, `../../components/ui`, `../../mock/<file>`, and files in your
   own folder.
5. **Every wireframe file is named `<something>.wf.jsx` and exports:**
   ```jsx
   export const meta = {
     uc: 'UC-5',                        // use case or FR/NFR number from the SE doc
     title: 'Find Available Shelters',  // short name
     owner: 'Anais',                    // your name
     screen: 'Animal Matching',         // sitemap box it belongs to
     states: ['default', 'no-match'],   // one frame is rendered per state
     width: 1024,                       // optional frame width in px (default 1024)
   };
   export default function FindShelters({ state }) {
     // return different JSX depending on `state`. No useState needed.
   }
   ```
6. **Use mock data.** Shelters, dogs, transfers and alerts come from `frontend/src/mock/`.
   Use the real field names from the requirements: dogs housed, available kennels, total
   capacity, status Open / Near Full / Full / Outdated, transfer status Pending / Accepted /
   Declined / Completed / Cancelled, priority high / medium / low, dog size small / medium /
   large. If you need more mock rows, add them to `mock/` (keep existing rows unchanged).
7. **Show states with props, not interactivity.** Modals, errors, empty results ("No match
   found") and filters applied are separate entries in `meta.states`. Use `<Modal>` for
   pop-ups (it renders open inside the frame).
8. **Match the SE doc wording.** Button labels and messages should be the exact text the
   use case uses ("Save changes", "Download PDF", "Find Match", "No matching shelters
   found", ...), so the wireframe traces back to its requirement.
9. **Full page or section, your choice.** Wrap in `<PageShell nav="Home" title="...">` to
   show the whole page with the nav bar, or render just the section to crop.

## Components available (`components/ui`)
`Button` (variant primary/secondary/ghost, size sm/md/lg) · `Card` (title, actions) ·
`Input` / `Select` (label, hint, error, options) · `Badge` (tone open/near/full/outdated/neutral) ·
`Banner` (tone alert/info/success, title, action) · `Table` (columns, rows) ·
`CapacityBar` (occupied, total) · `Tabs` (items, active) · `Modal` (title, footer) ·
`Placeholder` (label, className, for charts/maps/images) · `NavBar` · `PageShell` (nav, title, subtitle, actions, unread).

Copy `frontend/src/wireframes/shared/sign-in.wf.jsx` as a starting point.

## Before you open a PR (checklist)
- [ ] `npm run check:ui` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` shows your frames in the viewer with the right UC, title, owner and states
- [ ] Only files in your own folder changed (plus `mock/` additions if needed)
- [ ] Screenshot(s) attached to the PR

## If you are an AI assistant
Read this whole file before writing UI code. Refuse to put files outside the user's own
wireframe folder unless they explicitly ask for a shared-component PR. Run
`npm run check:ui` from `frontend/` after editing, and fix every error before finishing.
