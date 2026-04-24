# Auth

Email magic links via Supabase Auth. No passwords. Invite-only — `shouldCreateUser: true` is on but the only routes that send invites live in this app, and access depends on a `profiles.role` value set by an existing owner.

## Flow

1. User enters email at `/login`.
2. Server action `sendMagicLink` calls `supabase.auth.signInWithOtp` with `emailRedirectTo` pointing at `/auth/callback`.
3. Supabase mails the link.
4. Click → `/auth/callback?code=...&next=/somewhere` exchanges the code for a session and redirects to `next` (or `/`).
5. `middleware.ts` refreshes the session on every request and gates everything except `/login`, `/auth/*`, and `/api/health`.

## Roles

Stored in `public.profiles.role`:

- **owner** — sees every active brand, can create brands, can manage memberships. Tracy.
- **manager** — full read/write on the brands they're a member of. Isabelle.
- **contributor** — drafts/edits on the brands they're a member of.
- **uploader** — restricted to the asset upload flow. Photographers/videographers.

Use the helpers in `lib/auth/server.ts`:

```ts
const user = await requireUser();          // any signed-in user
const { profile } = await requireProfile(); // adds the profiles row
await requireOwner();                       // 403→/ for non-owners
const brands = await getUserBrands();       // owner: all active; else: via brand_memberships
```

## Bootstrapping the first owner

The migration creates a trigger on `auth.users` that inserts a `profiles` row with `role = 'contributor'`. The very first user (Tracy) needs to be promoted manually:

```sql
update public.profiles
set role = 'owner'
where id = (select id from auth.users where email = 'tracy@eatatditch.com');
```

Run that once in the Supabase SQL Editor after Tracy's first sign-in. After that, owners can promote others by calling an admin route (TODO: builds on top of this slice).

## Required Supabase Auth dashboard config

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** the production Vercel URL (e.g. `https://kai.vercel.app`).
- **Redirect URLs:** add the Vercel preview wildcard so PR previews work too.
  - `http://localhost:3000/auth/callback`
  - `https://kai.vercel.app/auth/callback`
  - `https://kai-*.vercel.app/auth/callback` (preview deploys)

In Supabase → **Authentication → Providers → Email**:

- Enable email provider.
- Disable signup confirmations if you want one-tap magic links (recommended for an internal tool). Otherwise users will have to click two emails.

## Sign-out

`POST /auth/signout` — wired into the user dropdown in `components/app/nav.tsx`.
