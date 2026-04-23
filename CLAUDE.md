# CLAUDE.md

Instructions for Claude Code working on the Ditch Marketing OS project. Read this file at the start of every session. Read `PRD.md` alongside it for product context.

---

## Project summary

An internal web app for the Ditch marketing team to generate, approve, schedule, and track on-brand content across all Ditch Instagram and TikTok accounts. See `PRD.md` for the full feature list and priorities.

## Tech stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database + Auth + Storage:** Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting:** Vercel (auto-deploy from `main` branch on GitHub)
- **AI:** Anthropic Claude API (Sonnet 4.6 for drafting, Haiku 4.5 for lightweight classification/scoring)
- **Email delivery:** Klaviyo API
- **Social APIs:** Meta Graph API (Instagram), TikTok Content Posting API
- **Reviews:** Google Business Profile API
- **Package manager:** pnpm

Do not switch stacks without asking. If a stack choice creates a real problem, flag it, explain the tradeoff, and wait for a decision.

## Working style

- **Plan before building on anything non-trivial.** For any task that touches multiple files or introduces a new feature, propose a plan first. Wait for approval. Then build.
- **One feature end-to-end before starting the next.** UI + API route + database + auth + test = done. Don't scaffold five half-built features.
- **Commit after every working unit of work.** Small, descriptive commit messages. Push to GitHub on every commit.
- **Ask when scope is ambiguous.** Don't invent requirements. If the PRD doesn't cover it, ask one question and wait.
- **Direct, pointed communication.** Skip filler. No "great question!" No summarizing what I just said back to me. Answer, then stop.
- **One question at a time when something needs clarifying.** Not a list of five.

## File and folder conventions

- `/app` — Next.js App Router routes
- `/components` — Reusable React components
- `/components/ui` — shadcn/ui primitives (don't edit directly; extend via wrappers)
- `/lib` — Utilities, API clients, Supabase client, Claude client
- `/lib/ai` — Prompt templates, Claude-calling wrappers, brand voice scoring
- `/lib/integrations` — Klaviyo, Meta, TikTok, Google Business Profile, Canva, Drive clients
- `/types` — Shared TypeScript types
- `/supabase/migrations` — SQL migration files (never edit applied migrations; create new ones)
- `/docs` — Internal docs (ADRs, integration notes, API key management)
- `PRD.md` — Product requirements (source of truth for what)
- `CLAUDE.md` — This file (source of truth for how)

## Database rules

- **Row-level security (RLS) is non-negotiable.** Every table has RLS enabled from day one. No exceptions.
- **Multi-tenant from day one** — every domain table has a `brand_id` foreign key (even if there's only one brand in dev). Adding it later is painful.
- **Migrations are append-only.** Never edit an old migration. Create a new one.
- **Soft-delete by default** on content tables (`deleted_at` timestamp). Hard deletes only for assets, and only with explicit instruction.

## Security rules

- **Never commit secrets.** All API keys live in Vercel environment variables and Supabase secrets. Use `.env.local.example` with placeholder values only; real `.env.local` is gitignored.
- **Never log API keys, Klaviyo tokens, Meta/TikTok tokens, or user PII.** Assume logs end up somewhere they shouldn't.
- **Server-side only** for Claude API calls, Klaviyo calls, Meta/TikTok calls. Never expose these keys to the browser.
- **Use Supabase service role key only in server routes**, never client-side.

## Brand voice context (important)

This app's reason for existing is enforcing Ditch brand voice. The **brand voice rules** and **brand bible** are the most important data the system operates on. When building the content generator:

- The Ditch voice is grounded in Southern California surf culture, Long Island hospitality, and retro beach aesthetic.
- Copy should feel like it was written by someone who knows the staff, the food, and the ocean — not a marketing agency.
- Separate voice profiles per handle (e.g., @theshiftshow uses a scripted/character voice; @weekendonli uses a casual/local voice; @eatatditch is the brand flagship tone).
- Every generation returns draft + voice score + flagged issues, never just raw text.

## Design principles (reinforced from PRD)

- **Retro surf brand aesthetic** — vintage beach palette, bold typography, wave and surfboard illustrations. Reference style: the "Main Break" graphic. Not generic SaaS gray.
- **Mobile-first.** Isabelle and Tracy use this on phones constantly. Every screen designs for ~390px wide first, desktop second.
- **Approval UX feels like Instagram.** Scroll, tap, approve. Not like a Jira workflow.
- **Fast.** Screens load under 2 seconds. Use server components where possible. No unnecessary client-side fetches.

## What to do when stuck

1. If tests fail, read the actual error. Don't guess.
2. If an API integration is failing, check the docs link in `/docs/integrations/<service>.md` before assuming the API is broken.
3. If a design decision is ambiguous, ask in chat before choosing.
4. If the PRD contradicts an instruction from chat, the chat instruction wins for that task, but flag the contradiction so the PRD can be updated.

## Don't touch without asking

- Production Supabase data (seed a local or staging DB instead)
- Any file in `/supabase/migrations` that's already been applied
- Environment variables in Vercel (propose the change, don't make it)
- `package.json` major version bumps (propose in chat first)
- The brand voice rule set once it's been approved (treat it as sacred config)

## Commands

- `pnpm dev` — run locally (in Codespace or similar, not your Mac)
- `pnpm build` — production build
- `pnpm lint` — ESLint + TypeScript check
- `pnpm test` — run test suite (Vitest)
- `pnpm db:migrate` — apply new Supabase migrations
- `pnpm db:types` — regenerate TypeScript types from Supabase schema

Always run `pnpm lint` before declaring a task done. Always run `pnpm test` when tests exist for the touched code.

## Deployment

- `main` branch auto-deploys to Vercel production.
- Every PR gets a Vercel preview URL — use these for review before merging.
- Never push directly to `main`. Always PR, even for solo work — the preview URL is the value.

## Success criteria for any task

A task is done when:
1. Feature works end-to-end in a Vercel preview deploy
2. `pnpm lint` passes with no errors
3. Relevant tests pass
4. RLS policies exist for any new tables
5. No secrets in the diff
6. Commit message explains what and why

---

*This file evolves. When a new convention is established, add it here. When something in here is wrong, flag it — don't silently work around it.*
