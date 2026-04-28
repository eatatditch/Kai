-- =============================================================================
-- Scripts add-on: voice profiles, reference scripts, generated scripts
-- Run this in the Supabase SQL editor.
-- Mirrors the RLS pattern used by `events`, `notes`, and `allowlist`.
-- =============================================================================

create table if not exists voice_profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  profile_json  jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists reference_scripts (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references voice_profiles(id) on delete cascade,
  title          text not null,
  source_format  text not null default 'paste',
  content        text not null,
  created_at     timestamptz default now()
);

create index if not exists reference_scripts_profile_idx
  on reference_scripts(profile_id);

create table if not exists generated_scripts (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references voice_profiles(id) on delete set null,
  brand          text,
  topic          text,
  length         text,
  brief_json     jsonb,
  variants_json  jsonb not null,
  created_at     timestamptz default now()
);

create index if not exists generated_scripts_created_idx
  on generated_scripts(created_at desc);

-- updated_at trigger — make set_updated_at() idempotent so this file can run
-- standalone. The calendar migration also defines it; create-or-replace is safe.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists voice_profiles_updated_at on voice_profiles;
create trigger voice_profiles_updated_at
  before update on voice_profiles
  for each row execute function set_updated_at();

-- =============================================================================
-- Row Level Security — match the existing allowlist pattern.
-- Authenticated users whose email is in `allowlist` get full access.
-- =============================================================================

alter table voice_profiles    enable row level security;
alter table reference_scripts enable row level security;
alter table generated_scripts enable row level security;

drop policy if exists "allowlisted users full access" on voice_profiles;
create policy "allowlisted users full access"
  on voice_profiles for all
  using (
    auth.jwt() ->> 'email' in (select email from allowlist)
  )
  with check (
    auth.jwt() ->> 'email' in (select email from allowlist)
  );

drop policy if exists "allowlisted users full access" on reference_scripts;
create policy "allowlisted users full access"
  on reference_scripts for all
  using (
    auth.jwt() ->> 'email' in (select email from allowlist)
  )
  with check (
    auth.jwt() ->> 'email' in (select email from allowlist)
  );

drop policy if exists "allowlisted users full access" on generated_scripts;
create policy "allowlisted users full access"
  on generated_scripts for all
  using (
    auth.jwt() ->> 'email' in (select email from allowlist)
  )
  with check (
    auth.jwt() ->> 'email' in (select email from allowlist)
  );
