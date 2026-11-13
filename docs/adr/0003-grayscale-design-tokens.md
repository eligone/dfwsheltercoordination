# 0003. Low-fidelity grayscale design tokens only

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
Six people building screens separately will drift in color and style. Wireframes should focus on
layout and content, not visual design.

## Decision
All colors are named tokens defined once in `frontend/src/index.css` (`@theme`). Tailwind's default
palette is switched off (`--color-*: initial`), so classes like `bg-blue-500` produce nothing.
Capacity status uses shades: dark = Full, mid = Near Full, light = Open, dashed = Outdated.

## Consequences
- Every screen looks consistent without effort.
- Moving to the colored real app means changing token values, not components.
- `check:ui` rejects raw colors (hex/rgb), arbitrary color classes and inline styles.
