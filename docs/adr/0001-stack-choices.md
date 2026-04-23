# ADR 0001: Stack choices

**Status:** Accepted
**Date:** 2026-04-23

## Context

Ditch Marketing OS needs to ship fast, stay maintainable by a small team, and integrate with a wide fan-out of third-party services (Claude, Supabase, Klaviyo, Meta, TikTok, Google Business Profile, Canva, Drive). The app is internal, low-traffic (single-digit concurrent users), but requires strong auth, multi-tenant data isolation, and server-side AI calls.

## Decision

- **Framework:** Next.js 14 App Router, TypeScript. Co-locates UI and API routes, ships server components that keep Claude/Supabase service-role calls off the client.
- **Styling:** Tailwind CSS + shadcn/ui. Source-owned components; no vendor lock-in on a UI kit.
- **DB + Auth + Storage + Realtime:** Supabase. RLS-first policies match the multi-tenant brand model exactly. One vendor for four concerns is a big win at this team size.
- **Hosting:** Vercel. Zero-config Next.js deploys, preview URL per PR (the PR review loop leans on this).
- **AI:** Anthropic Claude API. Sonnet 4.6 for drafting (voice-sensitive), Haiku 4.5 for scoring/classification.
- **Package manager:** pnpm. Faster installs, stricter dependency resolution.
- **Testing:** Vitest. Fast, Vite-native, integrates cleanly with React Testing Library.

## Consequences

- We're tightly coupled to Vercel + Supabase. Migration cost if either degrades would be weeks, not days. Acceptable at this stage.
- RLS everywhere adds friction when writing migrations, but it's the only way to make the service-role boundary meaningful.
- Server components mean we do more work on the server. Fine at our scale; revisit if cold-start latency ever becomes the bottleneck.

## Alternatives considered

- **Remix / TanStack Start** — comparable DX, smaller ecosystem for this team.
- **Firebase** — auth + DB in one, but the rules language is weaker than Postgres RLS for the joins we need.
- **OpenAI** — no brand-voice advantage and the team is already bought into Claude for voice-sensitive copy.
