-- ============================================================================
-- Phase 1: content_series for AI ideation + series-aware drafting.
--
-- Conventions:
--   * RLS on every table.
--   * brand_id on every domain table.
--   * Soft-delete by default (deleted_at).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- content_series
-- ----------------------------------------------------------------------------
create table if not exists public.content_series (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands (id) on delete restrict,
  slug          text not null,
  name          text not null,
  description   text not null,
  format_hint   public.content_format,
  guidelines    text,
  is_active     boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  unique (brand_id, slug)
);

create index if not exists content_series_brand_id_idx
  on public.content_series (brand_id) where deleted_at is null;
create index if not exists content_series_active_idx
  on public.content_series (brand_id, is_active) where deleted_at is null;

drop trigger if exists content_series_set_updated_at on public.content_series;
create trigger content_series_set_updated_at
  before update on public.content_series
  for each row execute function private.set_updated_at();

alter table public.content_series enable row level security;

-- ----------------------------------------------------------------------------
-- RLS for content_series
-- ----------------------------------------------------------------------------

create policy "content_series: read with brand access"
  on public.content_series for select
  to authenticated
  using (
    deleted_at is null
    and public.has_brand_access(brand_id)
  );

create policy "content_series: managers+ can insert"
  on public.content_series for insert
  to authenticated
  with check (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  );

create policy "content_series: managers+ can update"
  on public.content_series for update
  to authenticated
  using (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  )
  with check (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  );

create policy "content_series: owners can delete"
  on public.content_series for delete
  to authenticated
  using (public.current_app_role() = 'owner');

-- ----------------------------------------------------------------------------
-- Add series_id to content_drafts so we can link drafts to their series.
-- ----------------------------------------------------------------------------
alter table public.content_drafts
  add column if not exists series_id uuid references public.content_series (id) on delete set null;

create index if not exists content_drafts_series_idx
  on public.content_drafts (series_id) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Add scheduled_at to content_drafts for the calendar view.
-- ----------------------------------------------------------------------------
alter table public.content_drafts
  add column if not exists scheduled_at timestamptz;

create index if not exists content_drafts_scheduled_idx
  on public.content_drafts (brand_id, scheduled_at) where deleted_at is null;

-- ============================================================================
-- Seed: launch series for @eatatditch
-- ============================================================================
insert into public.content_series (brand_id, slug, name, description, format_hint, guidelines, is_active)
select
  b.id,
  v.slug,
  v.name,
  v.description,
  v.format_hint::public.content_format,
  v.guidelines,
  true
from public.brands b
cross join (values
  ('taco-talk',
   'Taco Talk',
   'Conversational series riffing on tacos at Ditch — flavors, regulars, the cooks behind them. Think a regular at the bar telling you why this taco hits different today.',
   'instagram_caption',
   'Open with a moment or a regular. Reference one specific taco or ingredient. Keep it under 200 characters. No hashtags inside the body — append max 3 lowercase hashtags at the end.'),
  ('diy-or-buy',
   'DIY or BUY',
   'Little Joy Coffee–style format. Show a Ditch drink or dish at home vs. at the bar. The punchline is always: just come in.',
   'tiktok_caption',
   'Format: "DIY: [home version, slightly sad]. BUY: [Ditch version, with one specific detail]." Hook in the first 4 words. End on the BUY line.'),
  ('this-week-in',
   'This Week in [Town]',
   'Weekly local roundup — what is happening in Bayshore / Port Jeff / Long Island this week, with one Ditch plug woven in honestly. Not a billboard.',
   'instagram_caption',
   'Three short lines: a town/neighborhood happening, a local thing to do, a Ditch hook. Keep it like a friend texting, not a tourism board.'),
  ('live-social-shopping',
   'Live Social Shopping',
   'Live or near-live posts when something is happening at Ditch right now — staff pick on tap, last 5 of a special, walk-in tables open.',
   'instagram_caption',
   'Use real-time language: tonight, right now, last call, walk in. Name what is available and how long. No fake urgency.'),
  ('day-x-of-menu-build',
   'Day X of New Menu Building',
   'Little Joy Coffee–style menu development diary. Day 1 through launch. Show the chaos: failed sauces, ingredient deliveries, the dish at 11pm in test kitchen.',
   'tiktok_caption',
   'Open with: "Day [N] of [building this menu / building the new cocktail list / etc]." One line about today. One line about what is broken. Land on a hook for tomorrow.'),
  ('rd',
   'R&D',
   'Behind-the-scenes test kitchen and bar experiments. The stuff that did not make the menu yet — and the stuff that is about to.',
   'instagram_caption',
   'Lean into the experiment. Show the variable being tested. Be honest if it failed. End with: maybe next week. or it is on Friday.'),
  ('kings-park-buildout',
   'Kings Park Buildout',
   'Construction and buildout content for the Kings Park location. Concrete pours, wall murals, surf-shack details, the team on site.',
   'instagram_caption',
   'One construction detail per post. Show the human scale — who is on site, what they are doing. Reference Main Break / surf shack aesthetic where it earns it.'),
  ('trending',
   'Trending / Experimental / Comedy',
   'Reactive content tied to a trending sound, format, or cultural moment — filtered through Ditch voice. Disposable but volume-driving.',
   'tiktok_caption',
   'Hook in the first 3 words. Reference the trend without naming it like a brand would. Land the joke in under 12 seconds of script. Lowercase only.'),
  ('reality-style',
   'Reality Style',
   'In the spirit of @theshiftshow — fly-on-the-wall reality moments at Ditch. The line during a rush. A regular tipping the bartender mid-pour. Real, human, slightly chaotic.',
   'series_script',
   'Format: CHARACTER: dialogue. 4–8 lines. Anchor it in a specific moment (mid-rush, last call, family meal). End on a beat, not a punchline.')
) as v(slug, name, description, format_hint, guidelines)
where b.slug = 'eatatditch'
on conflict (brand_id, slug) do nothing;
