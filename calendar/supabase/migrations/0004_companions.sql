-- =============================================================================
-- Companion generators: captions, email, SMS
-- All inherit the same allowlist RLS pattern as scripts.
-- All can attach to a calendar event (event_id) and optionally derive
-- from a saved script (source_script_id).
-- =============================================================================

create table if not exists generated_captions (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references events(id) on delete set null,
  profile_id        uuid references voice_profiles(id) on delete set null,
  source_script_id  uuid references generated_scripts(id) on delete set null,
  brand             text,
  topic             text,
  brief_json        jsonb,
  variants_json     jsonb not null,
  created_at        timestamptz default now()
);

create index if not exists generated_captions_event_idx on generated_captions(event_id);
create index if not exists generated_captions_created_idx on generated_captions(created_at desc);

create table if not exists generated_emails (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references events(id) on delete set null,
  profile_id        uuid references voice_profiles(id) on delete set null,
  source_script_id  uuid references generated_scripts(id) on delete set null,
  brand             text,
  topic             text,
  brief_json        jsonb,
  output_json       jsonb not null,
  created_at        timestamptz default now()
);

create index if not exists generated_emails_event_idx on generated_emails(event_id);
create index if not exists generated_emails_created_idx on generated_emails(created_at desc);

create table if not exists generated_sms (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references events(id) on delete set null,
  profile_id        uuid references voice_profiles(id) on delete set null,
  source_script_id  uuid references generated_scripts(id) on delete set null,
  brand             text,
  topic             text,
  brief_json        jsonb,
  variants_json     jsonb not null,
  created_at        timestamptz default now()
);

create index if not exists generated_sms_event_idx on generated_sms(event_id);
create index if not exists generated_sms_created_idx on generated_sms(created_at desc);

-- =============================================================================
-- RLS
-- =============================================================================

alter table generated_captions enable row level security;
alter table generated_emails   enable row level security;
alter table generated_sms      enable row level security;

drop policy if exists "allowlisted users full access" on generated_captions;
create policy "allowlisted users full access"
  on generated_captions for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on generated_emails;
create policy "allowlisted users full access"
  on generated_emails for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on generated_sms;
create policy "allowlisted users full access"
  on generated_sms for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));
