# Architecture Decision Records (ADRs)

Short notes on decisions the team made and **why**, so nobody re-argues them and new
work stays consistent. One decision per file.

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-decisions-with-adrs.md) | Record decisions as ADRs | Accepted |
| [0002](0002-coded-wireframes-react-vite-tailwind.md) | Coded wireframes in React + Vite + Tailwind instead of Figma | Accepted |
| [0003](0003-grayscale-design-tokens.md) | Low-fidelity grayscale design tokens only | Accepted |
| [0004](0004-shared-component-library.md) | One shared component library in `components/ui` | Accepted |
| [0005](0005-owner-folders-and-states.md) | One folder per person; wireframes are sections with states | Accepted |
| [0006](0006-navigation-follows-nfr-11.md) | Navigation is Home / My Dogs / Settings (NFR-11, sitemap 4.1) | Accepted |
| [0007](0007-ui-skill-required-and-protected-main.md) | UI skill is mandatory; PRs run an automatic check | Accepted |
| [0008](0008-manual-screenshots.md) | Screenshots are taken by hand from the viewer | Accepted |

## Adding one
1. Copy `template.md` to `NNNN-short-title.md` (next number).
2. Fill it in (keep it under a page) and add a row to the table above.
3. Open a PR and tell the team.
4. Never delete an old ADR. If a decision changes, write a new ADR and set the old
   one's status to `Superseded by NNNN`.
