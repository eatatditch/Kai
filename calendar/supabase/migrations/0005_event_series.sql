-- =============================================================================
-- Recurring event series: stamp a shared series_id on every occurrence so
-- the UI can delete the whole group in one move.
-- Existing rows keep series_id = NULL and behave as one-offs.
-- =============================================================================

alter table events
  add column if not exists series_id uuid;

create index if not exists events_series_idx on events(series_id);
