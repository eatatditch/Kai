# Canva integration

**Status:** Planned (lightweight).
**Purpose:** "Open in Canva" handoff from the draft detail view. The app is not a design tool — Canva is.

## API docs

- Canva Connect API: https://www.canva.dev/docs/connect/

## Auth

OAuth 2.0. Per-user tokens (not per-brand) since Canva designs are authored by individual users.

## Scope

Minimum viable: a button that opens a Canva design in a new tab, pre-filled from template IDs stored alongside brand voice profiles. Full programmatic design creation is out of scope for v1.

## Where this integration will live

`lib/integrations/canva/` — OAuth + deep-link helpers.
