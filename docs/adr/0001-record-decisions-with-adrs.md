# 0001. Record decisions as ADRs

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
Six people work on the project at different times, often with AI assistants. Without a written record,
the same questions get re-decided differently, and the SE document's later sections
(Architecture, Implementation, Evolution) need the reasoning behind our choices.

## Decision
Every decision that affects more than one person's work gets a short ADR in `docs/adr/`,
using `template.md`.

## Consequences
- The SE document can cite ADRs in Sections 5–8.
- ADR changes go through a PR with CODEOWNERS review (see 0007).
