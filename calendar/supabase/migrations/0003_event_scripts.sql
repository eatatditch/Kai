-- =============================================================================
-- Calendar <-> Scripts: bind generated scripts to calendar events
-- =============================================================================

alter table generated_scripts
  add column if not exists event_id uuid references events(id) on delete set null;

create index if not exists generated_scripts_event_idx
  on generated_scripts(event_id);
