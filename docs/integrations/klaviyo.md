# Klaviyo integration

**Status:** Planned (not implemented).
**Purpose:** Drafts built in-app are delivered through Klaviyo via API, preserving list health, deliverability, and existing automations.

## API docs

- REST API: https://developers.klaviyo.com/en/reference/api_overview
- Campaigns: https://developers.klaviyo.com/en/reference/create_campaign
- Templates: https://developers.klaviyo.com/en/reference/create_template

## Auth

Private API key. Stored as `KLAVIYO_API_KEY` (server-only). No OAuth required for single-account use.

## Open questions

See PRD §10:
- One Klaviyo account with tagged lists per brand, or separate accounts per location?

## Where this integration will live

`lib/integrations/klaviyo/` — client wrapper, typed campaign/template helpers.
