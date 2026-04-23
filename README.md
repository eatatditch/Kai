# Ditch Marketing OS

Internal web app for the Ditch marketing team to generate, approve, schedule, and track on-brand content across all Ditch Instagram and TikTok accounts.

See `PRD.md` for product context and `CLAUDE.md` for working conventions.

## Local development

```bash
pnpm install
cp .env.local.example .env.local   # fill in real values
pnpm dev
```

App runs at http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint + `tsc --noEmit` |
| `pnpm test` | Vitest run |
| `pnpm db:migrate` | Push Supabase migrations |
| `pnpm db:types` | Regenerate `types/database.ts` from the linked Supabase project |

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind + shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime) · Anthropic Claude API · Vercel.

## Repo layout

- `app/` — App Router routes
- `components/` — React components (`components/ui/` is shadcn — extend via wrappers, don't edit)
- `lib/` — Utilities, Supabase clients, Claude client
- `lib/ai/` — Claude wrappers, prompt templates, voice scoring
- `lib/integrations/` — Klaviyo, Meta, TikTok, Google Business Profile, Canva, Drive clients
- `types/` — Shared TypeScript types (incl. generated Supabase types)
- `supabase/migrations/` — SQL migrations (append-only; never edit applied ones)
- `docs/` — ADRs and integration notes

## Deploy

`main` auto-deploys to Vercel production. Every PR gets a preview URL — never push directly to `main`.
