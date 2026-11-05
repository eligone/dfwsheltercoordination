# 0008. Screenshots are taken by hand from the viewer

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
The submission needs a screenshot of each wireframe. Automating screenshots adds a large dependency
(a headless browser) for something done a few times.

## Decision
Each person takes their own screenshots from `npm run dev`. Each labeled frame is one screenshot
(see `UI_GUIDE.md` for the exact-element capture shortcut).

## Consequences
- No extra tooling to install.
- People should capture the whole labeled frame so every image shows its use case and owner.
