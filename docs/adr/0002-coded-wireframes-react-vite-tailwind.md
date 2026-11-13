# 0002. Coded wireframes in React + Vite + Tailwind instead of Figma

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
The wireframe assignment allows "Figma or something similar" and asks for screenshots, a link,
and possibly HTML/CSS. The planned front end for the real app is React + Vite + Tailwind CSS.

## Decision
Build the wireframes as code in `frontend/` using React 19, Vite and Tailwind CSS v4 (JavaScript, not
TypeScript, to keep the barrier low). A viewer page shows every wireframe.

## Consequences
- The wireframes are already HTML/CSS and can be hosted for a shareable link.
- The shared components carry over into the real app.
- Teammates need Node.js installed (`npm install`, `npm run dev`).
- Confirm with the TA that coded wireframes count as "something similar" to Figma.
