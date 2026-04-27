import type { CalendarEvent } from "@/types";
import { createClient } from "@/lib/supabase/client";

type DbEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  time: string | null;
  notes: string | null;
};

function fromDb(row: DbEvent): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    time: row.time ? row.time.slice(0, 5) : undefined,
    notes: row.notes ?? undefined,
  };
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, date, type, title, time, notes")
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
  };
  const { data, error } = await supabase
    .from("events")
    .upsert(payload)
    .select("id, date, type, title, time, notes")
    .single();
  if (error) throw error;
  return fromDb(data as DbEvent);
}

export async function deleteEventById(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
