# Ditch Content Calendar — Project Brief

A multi-user content calendar web app for Ditch Hospitality Group's marketing team. Owned by Tracy (founder), used daily by Tracy and Isabelle (Brand & Marketing Manager). Lives at its own subdomain or embedded into the main Ditch website. Replaces the localStorage-only HTML prototype (`ditch-content-calendar.html` — keep this file in `/reference` for visual + interaction parity).

## Goal

Plan and schedule everything marketing across the Ditch brand family:
- Social posts (IG, TikTok, FB, YouTube, Pinterest, LinkedIn, X)
- Photo + video shoots
- Email and SMS campaigns
- Push notifications
- Meetings, deadlines, approvals
- In-store events (Burger Night, Happy Hour, Margarita Class, Brunch, Live Music, Private Events, Launches)

Date range coverage: **May 2026 — June 2027** (Q2 2027 end). Nav locks at these bounds.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** for auth + database (Tracy already has Supabase set up)
- **Tailwind CSS** with the design tokens below (do NOT use default Tailwind palette — wire CSS vars into `tailwind.config.ts`)
- **Vercel** for hosting (already connected)
- Keep dependencies minimal. No date libraries unless absolutely needed — vanilla `Date` is fine for this scope.

## Aesthetic System — Retro Surf, Refined

The visual direction is **retro California surf, executed with restraint**. Think editorial design that happens to live at the beach. Bold display type, generous cream backgrounds, sharp accent colors, paper-like surfaces. NOT costume retro, NOT bright tropical clipart. This is the aesthetic that should carry across all future Ditch internal tools.

### Color Tokens

```css
--orange:     #cd6028;  /* primary brand — use for accents, CTAs, key highlights */
--orange-soft:#e8a17a;
--orange-tint:#fbeee4;  /* event pill backgrounds, hover states */

--sage:       #547352;  /* secondary brand — comms category, secondary actions */
--sage-soft:  #8fa78d;
--sage-tint:  #e8efe7;

--navy:       #325269;  /* tertiary brand — headers, social category, dark UI */
--navy-soft:  #6f8aa0;
--navy-tint:  #e3eaf0;

--cream:      #fdf8ed;  /* primary background */
--sand:       #f4ead5;  /* secondary background, hover surfaces */

--ink:        #1f2a30;  /* primary text */
--muted:      #6c7780;  /* secondary text, labels */
--line:       #d9cdb6;  /* borders */
--line-soft:  #ece2cc;  /* internal grid lines */
```

**Category colors** (used across event pills, filters, legend):
- Shoots → orange (`#cd6028`)
- Social → navy (`#325269`)
- Comms → sage (`#547352`)
- Events → terracotta (`#c44a1f`)
- Meetings → muted purple (`#6a4d8c`)
- Other → grey (`#6c7780`)

### Typography

Load via Google Fonts:
- **`Bebas Neue`** — display headings, calendar period labels, weekday rows. Use uppercase with letter-spacing 0.04–0.12em.
- **`DM Sans`** — all body, UI, form inputs. Weights 400/500/600/700.
- **`Caveat`** — used sparingly for handwritten-feel accents (footer tagline, optional decorative bits). Don't overuse.

NEVER use: Inter, Roboto, system-ui as the primary stack. Stick to the trio above.

### Layout & Spatial Rules

- Border-radius: 10px main containers, 6px small elements, 4px event pills.
- Borders: 1.5px on primary containers (use `--ink` for emphasis, `--line` for soft separation).
- Shadow: `0 1px 2px rgba(50,82,105,.06), 0 4px 12px rgba(50,82,105,.08)` for resting cards.
- Calendar grid lines should feel like a printed planner — soft cream/tan, not stark grey.
- Today's date: orange filled circle on day number, sage-tint cell background.
- Event pills: 3px left border in category color, tinted background, single-line truncated with emoji prefix.

### Motion

Subtle only. Modal pop animation (.18s ease-out, scale .96 → 1). Hover transitions on buttons (.15s). Event pills nudge 2px right on hover. No page-load animations, no scroll-triggered effects. This is a tool, not a marketing page.

## Functional Requirements

### Views
1. **Month view** (default): 7-column grid, 6-row calendar, days from previous/next month dimmed but visible.
2. **Week view**: 7 columns, full event details visible per day with time, type emoji, title.

### Navigation
- Prev / Today / Next buttons in a single grouped control.
- Bounds: cannot navigate before May 2026 or after June 2027 — disable buttons at edges.
- Keyboard: ← → to navigate, T = today, M = month, W = week, Esc = close modal.
- Period label: "MAY 2026" or "JUN 1 — JUN 7, 2026" in Bebas Neue.

### Event Management
- Click any day → modal opens scoped to that date.
- Modal shows: existing events for that day (with edit/delete icons) + form to add a new one.
- Form fields: Type (dropdown of all 32 types), Title (text), Date (date picker, bound-locked), Time (optional), Notes (textarea).
- Multiple events per day. Sort by time ascending, then untimed events at the bottom.
- Edit existing event by clicking the pill.
- Delete with confirm.
- Title defaults to event type label if left blank.

### Event Types (all 32, with emoji + category)

```ts
[
  { id: 'photo_shoot',     emoji: '📸', label: 'Photo Shoot',         cat: 'shoot' },
  { id: 'video_shoot',     emoji: '🎥', label: 'Video Shoot',         cat: 'shoot' },
  { id: 'ig_post',         emoji: '📷', label: 'Instagram Post',      cat: 'social' },
  { id: 'ig_reel',         emoji: '🎬', label: 'Instagram Reel',      cat: 'social' },
  { id: 'ig_story',        emoji: '📱', label: 'Instagram Story',     cat: 'social' },
  { id: 'tiktok_post',     emoji: '🎵', label: 'TikTok',              cat: 'social' },
  { id: 'fb_post',         emoji: '👍', label: 'Facebook Post',       cat: 'social' },
  { id: 'yt_post',         emoji: '▶️',  label: 'YouTube',             cat: 'social' },
  { id: 'pin_post',        emoji: '📌', label: 'Pinterest Pin',       cat: 'social' },
  { id: 'li_post',         emoji: '💼', label: 'LinkedIn Post',       cat: 'social' },
  { id: 'x_post',          emoji: '✖️',  label: 'X / Twitter',         cat: 'social' },
  { id: 'email',           emoji: '📧', label: 'Email Campaign',      cat: 'comms' },
  { id: 'sms',             emoji: '💬', label: 'SMS Blast',           cat: 'comms' },
  { id: 'push',            emoji: '🔔', label: 'Push Notification',   cat: 'comms' },
  { id: 'meeting',         emoji: '🤝', label: 'Meeting',             cat: 'meeting' },
  { id: 'event',           emoji: '🎪', label: 'Event / Activation',  cat: 'event' },
  { id: 'burger_night',    emoji: '🍔', label: 'Burger Night',        cat: 'event' },
  { id: 'happy_hour',      emoji: '🍹', label: 'Happy Hour',          cat: 'event' },
  { id: 'live_music',      emoji: '🎤', label: 'Live Music',          cat: 'event' },
  { id: 'margarita_class', emoji: '🥃', label: 'Margarita Class',     cat: 'event' },
  { id: 'brunch',          emoji: '🥑', label: 'Brunch Service',      cat: 'event' },
  { id: 'private_event',   emoji: '🎉', label: 'Private Event',       cat: 'event' },
  { id: 'blog',            emoji: '📝', label: 'Blog Post',           cat: 'comms' },
  { id: 'design',          emoji: '🎨', label: 'Design / Creative',   cat: 'other' },
  { id: 'promo',           emoji: '🎟️', label: 'Promo / Sale',         cat: 'comms' },
  { id: 'analytics',       emoji: '📊', label: 'Analytics Review',    cat: 'meeting' },
  { id: 'launch',          emoji: '🚀', label: 'Launch',              cat: 'event' },
  { id: 'influencer',      emoji: '⭐', label: 'Influencer / UGC',     cat: 'social' },
  { id: 'ad_campaign',     emoji: '📣', label: 'Ad Campaign',         cat: 'comms' },
  { id: 'deadline',        emoji: '⏰', label: 'Deadline',             cat: 'other' },
  { id: 'review',          emoji: '✅', label: 'Approval / Review',   cat: 'meeting' },
  { id: 'other',           emoji: '🌊', label: 'Other',               cat: 'other' },
]
```

### Filtering
Pill-style filter bar above calendar. "All" toggles to show everything. Toggling a category turns "All" off. Toggling all categories off snaps back to "All".

### Multi-User Sync (the v2 upgrade)
- Supabase Auth with magic link login. Restrict access to a hardcoded allowlist of emails (Tracy + Isabelle for now, extensible).
- Single shared workspace — no per-user calendars. All authorized users edit the same dataset.
- Realtime: subscribe to the events table so when Tracy adds an event, Isabelle's calendar updates without refresh.
- Optimistic UI: write locally, then confirm with Supabase. Roll back on error with toast.

### Print
- Dedicated `@media print` styles.
- Landscape, 0.4in margins.
- Hide controls, filters, legend, footer, modal.
- Calendar grid prints as a clean planner page with event pills as outlined boxes.
- Page-break-inside: avoid on day cells and grids.

### Persistence + Backup
- Primary store: Supabase `events` table.
- Export to JSON button (downloads full event dataset).
- Import from JSON button (offers merge or replace).

## Supabase Schema

```sql
-- events table
create table events (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  type        text not null,
  title       text not null,
  time        time,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  created_by  uuid references auth.users(id)
);

create index events_date_idx on events(date);

-- RLS
alter table events enable row level security;

-- allowlist policy: authenticated users in allowlist can do everything
create policy "allowlisted users full access"
  on events for all
  using (
    auth.jwt() ->> 'email' in (
      'tracy@example.com',
      'isabelle@example.com'
    )
  );

-- updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();
```

Replace email allowlist with the actual addresses on setup.

## Suggested File Structure

```
/app
  /layout.tsx          // root layout, fonts, metadata
  /page.tsx            // calendar route (auth gate inside)
  /login/page.tsx      // magic link login
  /globals.css         // CSS vars, base styles
/components
  /Calendar.tsx        // top-level orchestrator (view, cursor, filters)
  /MonthView.tsx
  /WeekView.tsx
  /EventModal.tsx
  /EventPill.tsx
  /FilterBar.tsx
  /Header.tsx
  /Toast.tsx
/lib
  /supabase.ts         // client setup
  /event-types.ts      // the 32-type array + categories
  /date-utils.ts       // ymd, parseYmd, startOfWeek, isSameDay, formatTime
  /events-api.ts       // fetch, create, update, delete, subscribe
  /constants.ts        // MIN_DATE, MAX_DATE, allowlist
/types
  /index.ts            // Event, EventType, Category, ViewMode
/reference
  /ditch-content-calendar.html  // working prototype — visual + interaction baseline
```

## Build Order

1. Scaffold Next.js + Tailwind + Supabase client. Wire CSS vars into Tailwind config.
2. Port the visual baseline from `/reference/ditch-content-calendar.html` exactly — same colors, fonts, spacing, component shapes. The prototype is the source of truth for look and feel.
3. Build month view first with mock data, then week view.
4. Add the event modal and CRUD form.
5. Wire Supabase: auth gate, fetch on mount, write on save.
6. Add realtime subscription.
7. Filter bar.
8. Print styles.
9. Export/Import JSON.
10. Keyboard shortcuts.
11. Deploy to Vercel.

## Non-Goals (for v1)

- No notifications/reminders.
- No external integrations (Toast, 7shifts, social schedulers) — calendar is planning only, posts go out manually.
- No mobile app — responsive web only.
- No commenting or task assignment per event — just notes field.
- No drag-to-reschedule — open modal, change date.

## Tone Note for Future Iteration

Tracy prefers direct, no-fluff back-and-forth. One question at a time. When proposing changes or asking clarifying questions, keep it tight. The aesthetic above is the standing brand reference for any future Ditch internal tooling — bonus calculator, training portal, investor dashboards, etc. Reuse the design tokens.
