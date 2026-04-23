# Ditch Marketing OS — Product Requirements Document

**Version:** 0.2 (Draft)
**Owner:** Tracy
**Last updated:** April 2026

---

## 1. One-sentence description

An internal web app that lets the Ditch marketing team generate, approve, schedule, and track on-brand content across all Ditch locations and niche sub-accounts — with brand voice, approval flow, and asset library built in.

## 2. Problem statement

The Ditch marketing operation is growing faster than the tools supporting it. Isabelle drafts content across multiple brand accounts (@eatatditch, @ditchbayshore, @ditchportjeff, @weekendonli, @theshiftshow, and soon @ditchkingspark) using a patchwork of Canva, Notes, Google Drive, and native schedulers. There's no central place to:

- Enforce brand voice consistency across drafters
- Route drafts through Tracy for approval before they go live
- See what's scheduled vs. live across every brand account in one view
- Reuse photographer-retainer assets without digging through Drive folders
- Track which content series are performing vs. stalling

The result is slower output, inconsistent voice, and approval bottlenecks that happen over text message instead of in a system.

## 3. Users and their jobs

**Tracy (Owner/Operator)**
- Review and approve content across all brands in under 5 min/day
- See what's scheduled for the next 7/30 days at a glance
- Flag off-brand content before it ships
- Pull performance data when making investor or operational decisions

**Isabelle (Brand & Marketing Manager)**
- Draft captions, emails, and campaign copy in Ditch voice
- Manage the 6-month content calendar across all accounts
- Use Kai (AI assistant) for content ideation, planning, and scripting
- Build and send email campaigns at Bartaco-level quality
- Track what's approved, scheduled, live, and archived

**Photographer / videographer (upload-only access)**
- Receives a secure upload link (no full login, no ability to see or edit other content)
- Drops finished shoot files with shoot date, location, and basic tags
- Files land in the asset library pending-review queue for Isabelle to categorize and approve

## 4. Goals and success metrics (90-day)

- Isabelle produces 2x the content volume at the same or higher quality
- Zero off-brand posts ship to any account
- Tracy's approval time drops to under 5 min/day
- 100% of scheduled content lives in one calendar (no external trackers)
- Photographer assets are findable in under 30 seconds by shoot date, location, or tag

## 5. Feature list (ranked)

### P0 — Must have for v1

1. **Multi-brand workspace** — Each IG handle is a separate brand profile with its own voice rules, audience, and calendar. Launch set: @eatatditch (mothership), @ditchbayshore, @ditchportjeff, @weekendonli, @theshiftshow. @ditchkingspark added when the location opens. TikTok support is architected in from day one but only @eatatditch is active at launch; other handles activate on TikTok once @eatatditch is established (exception: @theshiftshow launches on both IG and TikTok simultaneously since it's a scripted series built for both platforms).
2. **AI content generator** — Claude-powered drafting trained on the Ditch brand bible, voice guidelines, and past high-performing content; outputs captions, email copy, ad scripts, and series episodes
3. **Brand voice enforcement** — Every generated draft is scored against brand voice rules; flags issues before submission
4. **Approval workflow** — Isabelle drafts → Tracy approves/requests edits → content moves to scheduled queue
5. **Content calendar** — Unified view across all accounts with filter by brand, format, campaign, status (draft/approved/scheduled/live)
6. **Asset library** — Central home for photographer/videographer retainer shoots, branded graphics, and approved media. Replaces the current Google Drive folder structure as the primary system of record, with two-way sync to Drive so nothing breaks for anyone still working in Drive. Tagged by brand, location, shoot date, campaign, and usage rights.
7. **Auth + roles** — Owner, Manager, Contributor permissions with row-level security

### P1 — Next

8. **Social scheduler** — Direct publish to Meta (IG) as primary platform at launch; TikTok publishing built in and active for @eatatditch only, expanding to other handles as those TikTok accounts are built up; fallback is export-to-clipboard
9. **Email builder** — Bartaco-quality templates with Ditch branding. Drafts and sends directly through Klaviyo via API, so approved emails go out from Klaviyo (preserving list health, deliverability, and existing automations) without Isabelle leaving this app.
10. **Review response manager** — Pulls Google and Yelp reviews, Claude drafts a reply, Tracy approves
11. **Content series tracker** — Status, episode inventory, and performance of running series. Active series at launch include Cocktail DIY or Buy, Margarita MasterClass, and **The Shift Show** (@theshiftshow) — a scripted social series set inside a fast-paced restaurant where every shift teeters between smooth service and total chaos. Through recurring characters and storylines, it captures the humor, pressure, and personalities of hospitality life — where being "in the weeds" is just part of the job. Exaggerated, relatable, and real enough that you feel like part of the staff. The tracker stores scripts, character bibles, episode status (written / filmed / edited / scheduled / live), and per-episode performance.
12. **Analytics dashboard** — Engagement, reach, and conversion by brand, series, and post type, pulled directly from each platform's API (Meta, TikTok, Klaviyo, Google Business Profile) rather than CSV imports

### P2 — Someday

13. Toast POS integration (tie content to sales lifts)
14. Predictive content recommendations based on past performance
15. TikTok Shop integration
16. Catering lead tracker (tied to Damian's revenue share)
17. Automated quarterly performance report generation for investor updates

## 6. Data / entities

The system tracks: **users**, **brands**, **brand voice rules**, **content drafts**, **content approvals**, **scheduled posts**, **published posts**, **assets**, **campaigns**, **content series**, **review responses**, **performance metrics**.

## 7. Integrations

- **Claude API** — all content generation, ideation, scripting (Kai), voice scoring, review reply drafting
- **Supabase** — auth, database, file storage, realtime updates
- **Klaviyo API** — email send engine (drafts built in-app, delivered via Klaviyo)
- **Google Drive** — two-way sync with the asset library (app is system of record; Drive stays usable)
- **Meta Graph API** — IG scheduling and analytics
- **TikTok Content Posting API** — scheduling and analytics
- **Google Business Profile API** — reviews
- **Canva** — design handoff (open drafts directly in Canva)

## 8. Out of scope

This is **not**:
- A POS system (Toast stays)
- A reservation system (Squarespace stays)
- A public-facing customer app
- A replacement for Canva or existing design tools
- An HR or employee management tool
- Anything related to Swell Surf Co
- An investor portal or financial reporting tool
- A management company operations platform (separate system)

## 9. Design principles

- **Retro surf brand aesthetic** — vintage beach palette, bold typography, wave and surfboard illustrations; matches the "Main Break" reference style
- **Mobile-first** — Isabelle and Tracy work from phones constantly; desktop is the second priority
- **Approval feels native** — scroll-and-tap like Instagram, not like a corporate workflow tool
- **Fast over feature-rich** — every screen should load in under 2 seconds
- **Brand voice is the core feature** — everything else supports it

## 10. Open questions

- **Meta and TikTok Business API access** — the verification and approval process hasn't been started yet. Need to kick this off early since it can take weeks; until it's approved, the social scheduler runs in export-to-clipboard fallback mode.
- **TikTok handle reservations** — should @ditchbayshore, @ditchportjeff, @weekendonli, @ditchkingspark be claimed on TikTok now (even if dormant) to prevent squatting? @theshiftshow should definitely be claimed on both platforms immediately.
- **The Shift Show production pipeline** — does the app need a scriptwriting/storyboarding module in v1, or do those live in Google Docs/Drive and only the finished episodes flow through the app?
- **Klaviyo account structure** — one Klaviyo account with tagged lists per brand, or separate Klaviyo accounts per location?
- **Kai as assistant** — is Kai a distinct UI surface (chat-style helper for Isabelle), or is it baked into every content-generation screen? (Recommended: both — a persistent Kai chat panel plus contextual Kai suggestions inline.)

---

*This PRD is a living document. Update it as scope becomes clear. The section Claude Code will reference most often is the feature list and data/entities sections — keep those tight.*
