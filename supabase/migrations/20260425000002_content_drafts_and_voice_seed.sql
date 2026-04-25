-- ============================================================================
-- Phase 1: content_drafts + initial brand voice rules for @eatatditch.
--
-- Conventions enforced from CLAUDE.md:
--   * RLS on every table.
--   * brand_id on every domain table.
--   * Soft-delete by default on content tables (deleted_at).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_format') then
    create type public.content_format as enum (
      'instagram_caption',
      'tiktok_caption',
      'email_subject',
      'email_body',
      'ad_script',
      'series_script'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'draft_status') then
    create type public.draft_status as enum (
      'draft',
      'in_review',
      'changes_requested',
      'approved',
      'scheduled',
      'published',
      'archived'
    );
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- content_drafts
-- ----------------------------------------------------------------------------
create table if not exists public.content_drafts (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands (id) on delete restrict,
  author_id       uuid not null references public.profiles (id) on delete set null,
  format          public.content_format not null,
  status          public.draft_status not null default 'draft',

  prompt          text not null,
  body            text not null,
  voice_score     integer check (voice_score is null or (voice_score between 0 and 100)),
  voice_issues    jsonb,
  voice_summary   text,

  voice_rules_id  uuid references public.brand_voice_rules (id) on delete set null,
  model_used      text,
  thinking_used   boolean not null default false,

  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  review_notes    text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists content_drafts_brand_id_idx
  on public.content_drafts (brand_id) where deleted_at is null;
create index if not exists content_drafts_status_idx
  on public.content_drafts (brand_id, status) where deleted_at is null;
create index if not exists content_drafts_author_idx
  on public.content_drafts (author_id) where deleted_at is null;

drop trigger if exists content_drafts_set_updated_at on public.content_drafts;
create trigger content_drafts_set_updated_at
  before update on public.content_drafts
  for each row execute function private.set_updated_at();

alter table public.content_drafts enable row level security;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

-- Read: anyone with access to the brand can see non-deleted drafts.
create policy "content_drafts: read with brand access"
  on public.content_drafts for select
  to authenticated
  using (
    deleted_at is null
    and public.has_brand_access(brand_id)
  );

-- Insert: must have brand access; author_id must equal the calling user.
create policy "content_drafts: author can insert"
  on public.content_drafts for insert
  to authenticated
  with check (
    public.has_brand_access(brand_id)
    and author_id = auth.uid()
  );

-- Update: brand-scoped. Authors can update their own drafts; managers/owners
-- can update any. Status transitions are enforced in application code; RLS
-- here only gates row visibility.
create policy "content_drafts: author or manager+ can update"
  on public.content_drafts for update
  to authenticated
  using (
    public.has_brand_access(brand_id)
    and (
      author_id = auth.uid()
      or public.current_app_role() in ('owner', 'manager')
    )
  )
  with check (
    public.has_brand_access(brand_id)
    and (
      author_id = auth.uid()
      or public.current_app_role() in ('owner', 'manager')
    )
  );

-- "Delete" is a soft-delete via UPDATE deleted_at; hard delete reserved for
-- owners only (e.g. legal takedowns).
create policy "content_drafts: owners can hard delete"
  on public.content_drafts for delete
  to authenticated
  using (public.current_app_role() = 'owner');

-- ============================================================================
-- Seed: initial brand voice rules for @eatatditch (v1, NOT yet active).
-- Tracy approves this in-app; she sets is_active = true and sets approved_at.
-- ============================================================================
insert into public.brand_voice_rules (brand_id, version, rules, is_active)
select
  b.id,
  1,
  jsonb_build_object(
    'brand_slug', 'eatatditch',
    'tone_pillars', jsonb_build_array(
      'Southern California surf culture, but spoken from Long Island',
      'Hospitality warmth — like the host who actually knows your order',
      'Retro beach aesthetic — sun-bleached, hand-painted, Main Break energy',
      'Confident without selling — let the food and the night do the talking'
    ),
    'must', jsonb_build_array(
      'Sound like a real person on staff, not a marketing agency',
      'Reference specific food, drinks, staff vibes, or the ocean',
      'Use short, punchy lines — at most one comma per sentence when possible',
      'Earn the emoji if you use one — never decorative'
    ),
    'must_not', jsonb_build_array(
      'Corporate marketing speak (synergy, elevate, curated, experience)',
      'Generic restaurant clichés (mouthwatering, delectable, savor)',
      'Hashtag spam — three max, all lowercase, brand-relevant',
      'AI tells: em dashes, "in conclusion", overuse of tricolons',
      'Emojis as filler. Especially the wave/sun/fire trio',
      'Apostrophes in "do''s and don''ts"-style headers — keep titles clean'
    ),
    'vocabulary', jsonb_build_object(
      'likes', jsonb_build_array(
        'shift', 'lineup', 'on the rocks', 'last call', 'staff pick',
        'house pour', 'in the weeds', 'after the rush', 'open kitchen'
      ),
      'dislikes', jsonb_build_array(
        'foodie', 'eatery', 'establishment', 'patron', 'guest experience',
        'culinary journey', 'must-try'
      )
    ),
    'examples', jsonb_build_object(
      'good', jsonb_build_array(
        'Margs are sharper today. Don''t ask why.',
        'New shift, new playlist. Same tequila.',
        'If the bartender is sweating it''s a good sign.'
      ),
      'bad', jsonb_build_array(
        'Come savor our mouthwatering tacos in a curated dining experience! 🌮✨',
        'We are thrilled to announce our brand new menu items.',
        'Indulge in the ultimate Long Island culinary journey.'
      )
    ),
    'hashtag_policy', 'Three maximum. Lowercase. Brand- or location-relevant only. Never generic (#foodie, #yum).',
    'notes', 'This is v1 placeholder. Tracy must approve before activating — set is_active = true and populate approved_by + approved_at.'
  ),
  false
from public.brands b
where b.slug = 'eatatditch'
on conflict (brand_id, version) do nothing;
