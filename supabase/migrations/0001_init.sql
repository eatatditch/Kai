-- 0001_init.sql
-- Foundational schema for Ditch Marketing OS.
--
-- Sets up:
--   - user_role enum
--   - brands (one row per IG/TikTok handle)
--   - profiles (mirror of auth.users, adds role + default brand)
--   - brand_memberships (per-brand role; supports Tracy-across-all,
--     Contributors on specific brands)
--   - RLS enabled + baseline policies on all three
--   - Seed rows for the launch brand set
--
-- Every future domain table inherits the (brand_id, RLS, soft-delete) pattern
-- established here. See CLAUDE.md for the rules.

-- =========================================================================
-- Extensions
-- =========================================================================
create extension if not exists "pgcrypto";

-- =========================================================================
-- Enums
-- =========================================================================
create type public.user_role as enum (
  'owner',
  'manager',
  'contributor',
  'uploader'
);

create type public.brand_platform as enum (
  'instagram',
  'tiktok'
);

-- =========================================================================
-- Tables
-- =========================================================================

-- Brands: one row per handle. `platforms` lists active publishing targets.
create table public.brands (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  display_name     text not null,
  platforms        public.brand_platform[] not null default '{instagram}',
  voice_profile_key text not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index brands_slug_active_idx on public.brands (slug) where deleted_at is null;

-- Profiles: 1:1 with auth.users. Populated by a trigger on user creation.
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  role              public.user_role not null default 'contributor',
  default_brand_id  uuid references public.brands (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Brand memberships: which users can act on which brands, and in what role.
-- An 'owner' in public.profiles (e.g. Tracy) sees all brands via policy;
-- everyone else is scoped by this table.
create table public.brand_memberships (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  brand_id    uuid not null references public.brands (id) on delete cascade,
  role        public.user_role not null default 'contributor',
  created_at  timestamptz not null default now(),
  primary key (user_id, brand_id)
);

create index brand_memberships_brand_idx on public.brand_memberships (brand_id);

-- =========================================================================
-- Helper functions (used by policies)
-- =========================================================================

-- Returns true if the calling user has the 'owner' role in profiles.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
  );
$$;

-- Returns true if the calling user is a member of the given brand.
create or replace function public.is_brand_member(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brand_memberships
    where user_id = auth.uid()
      and brand_id = target_brand
  );
$$;

-- =========================================================================
-- updated_at trigger
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================================
-- auth.users -> profiles sync
-- =========================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =========================================================================
-- Row-level security
-- =========================================================================
alter table public.brands            enable row level security;
alter table public.profiles          enable row level security;
alter table public.brand_memberships enable row level security;

-- brands: owners see all; everyone else sees brands they are a member of.
create policy brands_select on public.brands
  for select
  using (
    deleted_at is null
    and (public.is_owner() or public.is_brand_member(id))
  );

create policy brands_insert on public.brands
  for insert
  with check (public.is_owner());

create policy brands_update on public.brands
  for update
  using (public.is_owner())
  with check (public.is_owner());

-- profiles: users can read/update their own row. Owners can read all.
create policy profiles_select_self on public.profiles
  for select
  using (id = auth.uid() or public.is_owner());

create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- brand_memberships: a user sees their own rows; owners see all; only owners
-- can modify.
create policy memberships_select on public.brand_memberships
  for select
  using (user_id = auth.uid() or public.is_owner());

create policy memberships_write on public.brand_memberships
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- =========================================================================
-- Seed: launch brand set
-- =========================================================================
insert into public.brands (slug, display_name, platforms, voice_profile_key, is_active) values
  ('eatatditch',    '@eatatditch',    array['instagram','tiktok']::public.brand_platform[], 'eatatditch',    true),
  ('ditchbayshore', '@ditchbayshore', array['instagram']::public.brand_platform[],           'ditchbayshore', true),
  ('ditchportjeff', '@ditchportjeff', array['instagram']::public.brand_platform[],           'ditchportjeff', true),
  ('weekendonli',   '@weekendonli',   array['instagram']::public.brand_platform[],           'weekendonli',   true),
  ('theshiftshow',  '@theshiftshow',  array['instagram','tiktok']::public.brand_platform[], 'theshiftshow',  true),
  ('ditchkingspark','@ditchkingspark',array['instagram']::public.brand_platform[],           'ditchkingspark',false)
on conflict (slug) do nothing;
