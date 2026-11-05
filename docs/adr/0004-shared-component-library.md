# 0004. One shared component library in `components/ui`

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
If everyone builds their own buttons, tables and badges, the wireframes won't match and the work is
duplicated.

## Decision
`frontend/src/components/ui/` is the only place components are defined. Wireframes compose them. New
components are added in their own PR and need CODEOWNERS approval.

## Consequences
- Consistent look; a fix in one component fixes every screen.
- Slightly slower when a component is missing (needs a separate PR).
