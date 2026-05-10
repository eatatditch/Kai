-- =============================================================================
-- Weekly Sync — Marketing Operating Picture
-- Tables for the /sync module: cadence meters, content roadmap, action items,
-- and weekly snapshots. RLS follows the existing `allowlist` pattern used by
-- events, notes, voice_profiles, etc.
-- =============================================================================

-- Cadence targets (long-lived, edited rarely).
create table if not exists cadence_meters (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  target_label text not null,
  max_value    int  not null,
  sort_order   int  not null default 0,
  created_at   timestamptz default now()
);

-- Weekly cadence readings (one row per meter per ISO week).
create table if not exists cadence_readings (
  id            uuid primary key default gen_random_uuid(),
  meter_id      uuid not null references cadence_meters(id) on delete cascade,
  iso_year      int  not null,
  iso_week      int  not null,
  current_value int  not null default 0,
  updated_at    timestamptz default now(),
  unique(meter_id, iso_year, iso_week)
);

create index if not exists cadence_readings_week_idx
  on cadence_readings(iso_year, iso_week);

-- Content roadmap by month.
create table if not exists content_roadmap_months (
  id            uuid primary key default gen_random_uuid(),
  month_start   date not null unique,
  quarter       text not null,
  status        text not null check (status in ('future','todo','mapping','mapped')),
  status_label  text not null,
  deadline_text text,
  notes         text,
  updated_at    timestamptz default now()
);

create index if not exists content_roadmap_months_start_idx
  on content_roadmap_months(month_start);

-- Action items: this-week buckets and the rolling radar.
create table if not exists sync_items (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null check (bucket in ('thisweek','radar')),
  body        text not null,
  owner       text not null check (owner in ('I','T','—')),
  done        boolean not null default false,
  due_date    date,
  sort_order  int  not null default 0,
  created_at  timestamptz default now(),
  done_at     timestamptz,
  iso_year    int  not null,
  iso_week    int  not null
);

create index if not exists sync_items_bucket_week_idx
  on sync_items(bucket, iso_year, iso_week);

-- Weekly snapshots written by the Monday cron.
create table if not exists sync_snapshots (
  id         uuid primary key default gen_random_uuid(),
  iso_year   int  not null,
  iso_week   int  not null,
  payload    jsonb not null,
  created_at timestamptz default now(),
  unique(iso_year, iso_week)
);

create index if not exists sync_snapshots_week_idx
  on sync_snapshots(iso_year desc, iso_week desc);

-- updated_at trigger (idempotent, also defined by other migrations).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cadence_readings_updated_at on cadence_readings;
create trigger cadence_readings_updated_at
  before update on cadence_readings
  for each row execute function set_updated_at();

drop trigger if exists content_roadmap_months_updated_at on content_roadmap_months;
create trigger content_roadmap_months_updated_at
  before update on content_roadmap_months
  for each row execute function set_updated_at();

-- =============================================================================
-- RLS — match the allowlist pattern.
-- =============================================================================

alter table cadence_meters         enable row level security;
alter table cadence_readings       enable row level security;
alter table content_roadmap_months enable row level security;
alter table sync_items             enable row level security;
alter table sync_snapshots         enable row level security;

drop policy if exists "allowlisted users full access" on cadence_meters;
create policy "allowlisted users full access"
  on cadence_meters for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on cadence_readings;
create policy "allowlisted users full access"
  on cadence_readings for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on content_roadmap_months;
create policy "allowlisted users full access"
  on content_roadmap_months for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on sync_items;
create policy "allowlisted users full access"
  on sync_items for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

drop policy if exists "allowlisted users full access" on sync_snapshots;
create policy "allowlisted users full access"
  on sync_snapshots for all
  using (auth.jwt() ->> 'email' in (select email from allowlist))
  with check (auth.jwt() ->> 'email' in (select email from allowlist));

-- =============================================================================
-- Realtime: ensure changes broadcast to the supabase_realtime publication.
-- Wrapped in a DO block so the migration succeeds even if the publication
-- isn't present (e.g. fresh local stack) or already includes a table.
-- =============================================================================

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'cadence_meters',
      'cadence_readings',
      'content_roadmap_months',
      'sync_items'
    ] loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =============================================================================
-- Seed data — cadence meters and content roadmap (May 2026 — Oct 2026).
-- =============================================================================

insert into cadence_meters (slug, name, target_label, max_value, sort_order)
values
  ('daily-posting', 'Daily Posting', '7 posts/wk · all channels', 7, 0),
  ('email',         'Email Sends',   '2 sends/wk',                2, 1),
  ('sms',           'SMS Sends',     '2 sends/wk',                2, 2),
  ('activations',   'Activations',   '2 activations/wk',          2, 3)
on conflict (slug) do nothing;

insert into content_roadmap_months (month_start, quarter, status, status_label, deadline_text)
values
  ('2026-05-01', 'Q2', 'mapped',  'Mapped',         'Live'),
  ('2026-06-01', 'Q2', 'mapping', 'In Mapping',     'Map by May 18'),
  ('2026-07-01', 'Q3', 'todo',    'To Do',          'Map by Jun 15'),
  ('2026-08-01', 'Q3', 'future',  'Future',         null),
  ('2026-09-01', 'Q3', 'future',  'Future',         null),
  ('2026-10-01', 'Q4', 'future',  'Future',         null)
on conflict (month_start) do nothing;
