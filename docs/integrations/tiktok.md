# TikTok Content Posting API integration

**Status:** Planned. Business verification required — start in parallel with Meta (PRD §10).
**Purpose:** Schedule/publish to TikTok and pull engagement metrics.

## API docs

- Content Posting API: https://developers.tiktok.com/doc/content-posting-api-get-started/
- Research API (analytics): https://developers.tiktok.com/products/research-api/

## Auth

OAuth 2.0 per handle. Access token stored encrypted per brand in the `brands` table (future column). `TIKTOK_ACCESS_TOKEN` env var is a placeholder for single-account dev use.

## Launch scope

- `@eatatditch` active from day one.
- `@theshiftshow` active from day one (scripted series cross-posted to IG + TikTok).
- Other handles activate as TikTok accounts are built up.

## Where this integration will live

`lib/integrations/tiktok/` — OAuth flow, upload/publish, insights.
