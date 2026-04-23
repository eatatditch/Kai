# Google Drive integration

**Status:** Planned.
**Purpose:** Two-way sync with the asset library. The app is the system of record; Drive stays usable for anyone still working out of folders.

## API docs

- Drive API: https://developers.google.com/drive/api/reference/rest/v3

## Auth

OAuth 2.0 with a service account or per-user credential, depending on which approach survives review. Likely service account scoped to shared drives containing retainer assets.

## Sync model (proposed)

- App watches designated Drive folders via change feed / webhook.
- New/updated files land in the pending-review queue with Drive metadata (shoot date extracted from folder name, original Drive ID stored for round-trip).
- Assets approved/deleted in the app push those changes back to Drive so Drive reflects app state.

## Where this integration will live

`lib/integrations/google-drive/` — OAuth/service-account auth, change watcher, push-back client.
