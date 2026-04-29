import type { CalendarEvent } from "@/types";
import { createClient } from "@/lib/supabase/client";

type DbEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  time: string | null;
  notes: string | null;
  series_id: string | null;
};

const EVENT_COLUMNS = "id, date, type, title, time, notes, series_id";

function fromDb(row: DbEvent): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    time: row.time ? row.time.slice(0, 5) : undefined,
    notes: row.notes ?? undefined,
    series_id: row.series_id ?? undefined,
  };
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data as DbEvent[]).map(fromDb);
}

export async function upsertEvent(
  event: CalendarEvent,
): Promise<CalendarEvent> {
  const supabase = createClient();
  const payload = {
    id: event.id,
    date: event.date,
    type: event.type,
    title: event.title,
    time: event.time ?? null,
    notes: event.notes ?? null,
    series_id: event.series_id ?? null,
  };
  const { data, error } = await supabase
    .from("events")
    .upsert(payload)
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return fromDb(data as DbEvent);
}

export async function deleteEventById(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteSeriesById(seriesId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("series_id", seriesId);
  if (error) throw error;
}

function toDbPayload(e: CalendarEvent) {
  return {
    id: e.id,
    date: e.date,
    type: e.type,
    title: e.title,
    time: e.time ?? null,
    notes: e.notes ?? null,
    series_id: e.series_id ?? null,
  };
}

export async function mergeEvents(events: CalendarEvent[]): Promise<void> {
  if (events.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("events")
    .upsert(events.map(toDbPayload), {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

export async function replaceAllEvents(
  events: CalendarEvent[],
): Promise<void> {
  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw deleteError;
  if (events.length === 0) return;
  const { error: insertError } = await supabase
    .from("events")
    .insert(events.map(toDbPayload));
  if (insertError) throw insertError;
}

export type EventChange =
  | { kind: "upsert"; event: CalendarEvent }
  | { kind: "delete"; id: string };

export function subscribeEvents(
  onChange: (change: EventChange) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("events-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events" },
      (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          onChange({ kind: "upsert", event: fromDb(payload.new as DbEvent) });
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as Partial<DbEvent>;
          if (old.id) onChange({ kind: "delete", id: old.id });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
