# Meta Graph API (Instagram) integration

**Status:** Planned. Business verification is a blocker — start early (PRD §10).
**Purpose:** Schedule/publish to IG and pull engagement metrics.

## API docs

- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Content Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

## Auth

Long-lived Page access token scoped to each connected IG Business Account. Stored as `META_GRAPH_ACCESS_TOKEN` (server-only). One token per connected handle — the `brands` table's future `meta_token` column (encrypted) is where per-brand tokens live.

## Known constraints

- App review required before production publishing. Run in export-to-clipboard fallback until approved.
- Rate limits apply per token — back off on 4xx errors.

## Where this integration will live

`lib/integrations/meta/` — OAuth flow, publishing, insights fetch.
