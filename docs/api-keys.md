# API key management

## Where keys live

- **Local dev:** `.env.local` at the repo root (gitignored).
- **Production + Preview:** Vercel → Project: `kai` → Settings → Environment Variables.
- **Never** commit real values to the repo. Never paste a key into chat, a PR description, or an issue. `.env.local.example` has placeholder values only.

## Keys we use

| Env var | Source | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public (browser OK) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | Public (browser OK; RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` `secret` | **Server only.** Bypasses RLS. |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys | **Server only.** |
| `KLAVIYO_API_KEY` | Klaviyo → Settings → API Keys → Private API Keys | **Server only.** |
| `META_GRAPH_ACCESS_TOKEN` | Meta for Developers → App → Tokens | **Server only.** |
| `TIKTOK_ACCESS_TOKEN` | TikTok for Developers → App | **Server only.** |
| `GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN` | Google Cloud Console → OAuth client | **Server only.** |
| `GOOGLE_DRIVE_CLIENT_ID` / `_SECRET` | Google Cloud Console → OAuth client | Client id public, secret server-only |

## Rules

1. Only `NEXT_PUBLIC_*` vars may be read from browser code. Anything else is server-only.
2. All keys are validated at runtime in `lib/env.ts`. If a required key is missing, the server fails fast with a useful error rather than mysteriously 500ing later.
3. Never log a full key. Log at most a last-four-characters fingerprint if you need to debug.
4. Service-role Supabase client is only importable from server files (`server-only` import guard).

## Rotation

Rotate immediately if a key is exposed (pushed to a repo, pasted in chat, shared outside the team):

- **Supabase:** Project Settings → API → **Rotate `service_role` secret**. Update Vercel + `.env.local`.
- **Anthropic:** Console → API Keys → disable old, create new.
- **Klaviyo / Meta / TikTok / Google:** regenerate in the respective dashboard.

After rotation, trigger a Vercel redeploy so the new value takes effect in running instances.

## Onboarding a new dev

1. Give them read access to the Vercel `kai` project.
2. They copy env vars from Vercel → paste into their local `.env.local`.
3. Install Supabase CLI (`brew install supabase/tap/supabase`), run `supabase login`, then `supabase link --project-ref <ref>` inside the repo.
4. Never email or Slack keys — have the new dev pull them from Vercel themselves.
