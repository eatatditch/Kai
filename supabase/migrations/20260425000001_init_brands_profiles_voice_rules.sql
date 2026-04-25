-- ============================================================================
-- Phase 0 foundation: brands, profiles, brand memberships, brand voice rules.
--
-- Conventions enforced from CLAUDE.md:
--   * RLS is enabled on every table from day one.
--   * Multi-tenant: brand-scoped tables carry brand_id.
--   * SECURITY DEFINER helpers live in a private schema and are never exposed
--     via the Data API.
--   * Per Supabase RLS guidance: an UPDATE needs a SELECT policy or it
--     silently returns 0 rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Private schema for SECURITY DEFINER helpers — not exposed to anon/auth roles.
-- ----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'manager', 'contributor');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.app_role not null default 'contributor',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user is created.
-- ----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER helpers (private schema — never exposed)
-- ----------------------------------------------------------------------------
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Public wrapper so RLS policies and app code can call this via PostgREST.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select private.current_app_role();
$$;
grant execute on function public.current_app_role() to authenticated;

-- ----------------------------------------------------------------------------
-- brands
-- ----------------------------------------------------------------------------
create table if not exists public.brands (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  instagram_handle  text,
  tiktok_handle     text,
  tiktok_active     boolean not null default false,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function private.set_updated_at();

alter table public.brands enable row level security;

-- ----------------------------------------------------------------------------
-- brand_memberships: which profiles can act on which brand, with per-brand role
-- ----------------------------------------------------------------------------
create table if not exists public.brand_memberships (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  brand_id    uuid not null references public.brands (id)   on delete cascade,
  role        public.app_role not null default 'contributor',
  created_at  timestamptz not null default now(),
  primary key (profile_id, brand_id)
);

create index if not exists brand_memberships_brand_id_idx
  on public.brand_memberships (brand_id);

alter table public.brand_memberships enable row level security;

-- has_brand_access: true if the calling user is owner OR has a membership row
create or replace function private.has_brand_access(_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (select role from public.profiles where id = auth.uid()) = 'owner',
      false
    )
    or exists (
      select 1
      from public.brand_memberships m
      where m.profile_id = auth.uid()
        and m.brand_id = _brand_id
    );
$$;

create or replace function public.has_brand_access(_brand_id uuid)
returns boolean
language sql
stable
as $$
  select private.has_brand_access(_brand_id);
$$;
grant execute on function public.has_brand_access(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- brand_voice_rules: versioned. Only one is_active row per brand at a time.
-- ----------------------------------------------------------------------------
create table if not exists public.brand_voice_rules (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands (id) on delete cascade,
  version       integer not null,
  rules         jsonb not null,
  is_active     boolean not null default false,
  approved_by   uuid references public.profiles (id) on delete set null,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (brand_id, version)
);

create unique index if not exists brand_voice_rules_one_active_per_brand
  on public.brand_voice_rules (brand_id)
  where is_active;

create index if not exists brand_voice_rules_brand_id_idx
  on public.brand_voice_rules (brand_id);

alter table public.brand_voice_rules enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- profiles: a user sees their own row; owners see all.
create policy "profiles: self can read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.current_app_role() = 'owner');

create policy "profiles: self can update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles: owners can update any"
  on public.profiles for update
  to authenticated
  using (public.current_app_role() = 'owner')
  with check (public.current_app_role() = 'owner');

-- brands: any authenticated user can read (brand switcher needs this);
-- only owners write.
create policy "brands: authenticated can read"
  on public.brands for select
  to authenticated
  using (true);

create policy "brands: owners can write"
  on public.brands for all
  to authenticated
  using (public.current_app_role() = 'owner')
  with check (public.current_app_role() = 'owner');

-- brand_memberships: a user sees their own memberships; owners see all.
create policy "brand_memberships: self or owner can read"
  on public.brand_memberships for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.current_app_role() = 'owner'
  );

create policy "brand_memberships: owners can write"
  on public.brand_memberships for all
  to authenticated
  using (public.current_app_role() = 'owner')
  with check (public.current_app_role() = 'owner');

-- brand_voice_rules: read requires brand access; write requires owner OR
-- manager AND brand access.
create policy "brand_voice_rules: read with brand access"
  on public.brand_voice_rules for select
  to authenticated
  using (public.has_brand_access(brand_id));

create policy "brand_voice_rules: managers+ can insert"
  on public.brand_voice_rules for insert
  to authenticated
  with check (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  );

create policy "brand_voice_rules: managers+ can update"
  on public.brand_voice_rules for update
  to authenticated
  using (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  )
  with check (
    public.has_brand_access(brand_id)
    and public.current_app_role() in ('owner', 'manager')
  );

create policy "brand_voice_rules: owners can delete"
  on public.brand_voice_rules for delete
  to authenticated
  using (public.current_app_role() = 'owner');

-- ============================================================================
-- Seeds: launch brands per PRD §5.1
-- ============================================================================
insert into public.brands (slug, name, instagram_handle, tiktok_handle, tiktok_active, description)
values
  ('eatatditch',   'Ditch (flagship)',  '@eatatditch',     '@eatatditch', true,  'Mothership brand — the flagship Ditch voice and content hub.'),
  ('ditchbayshore','Ditch Bayshore',    '@ditchbayshore',  null,           false, 'Bayshore location.'),
  ('ditchportjeff','Ditch Port Jeff',   '@ditchportjeff',  null,           false, 'Port Jefferson location.'),
  ('weekendonli',  'Weekend on LI',     '@weekendonli',    null,           false, 'Casual local Long Island lifestyle account.'),
  ('theshiftshow', 'The Shift Show',    '@theshiftshow',   '@theshiftshow', true, 'Scripted hospitality series — character-driven, IG + TikTok at launch.')
on conflict (slug) do nothing;
