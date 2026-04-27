import type { Note, NoteCategory } from "@/types";
import { createClient } from "@/lib/supabase/client";

type DbNote = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  updated_at: string;
};

function fromDb(row: DbNote): Note {
  return {
    id: row.id,
    category: row.category as NoteCategory,
    title: row.title,
    body: row.body ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id, category, title, body, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DbNote[]).map(fromDb);
}

export async function upsertNote(note: Note): Promise<Note> {
  const supabase = createClient();
  const payload = {
    id: note.id,
    category: note.category,
    title: note.title,
    body: note.body ?? null,
  };
  const { data, error } = await supabase
    .from("notes")
    .upsert(payload)
    .select("id, category, title, body, updated_at")
    .single();
  if (error) throw error;
  return fromDb(data as DbNote);
}

export async function deleteNoteById(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export type NoteChange =
  | { kind: "upsert"; note: Note }
  | { kind: "delete"; id: string };

export function subscribeNotes(
  onChange: (change: NoteChange) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("notes-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notes" },
      (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          onChange({ kind: "upsert", note: fromDb(payload.new as DbNote) });
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as Partial<DbNote>;
          if (old.id) onChange({ kind: "delete", id: old.id });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
