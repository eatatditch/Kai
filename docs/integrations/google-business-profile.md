# Google Business Profile API integration

**Status:** Planned.
**Purpose:** Pull reviews for the Review Response Manager (P1 feature). Claude drafts replies; Tracy approves; app posts back to GBP.

## API docs

- Business Profile API: https://developers.google.com/my-business/reference/businessinformation/rest
- Reviews: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews

## Auth

OAuth 2.0 with Google. Per-location tokens stored encrypted in the `brands` table (future column). `GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN` env var is a placeholder for single-location dev.

## Where this integration will live

`lib/integrations/google-business-profile/` — OAuth, review fetch, reply posting.
