import type { NoteCategory, NoteCategoryDef } from "@/types";

export const NOTE_CATEGORIES: NoteCategoryDef[] = [
  { id: "shoot_idea",   label: "Shoot Ideas",   emoji: "📸", color: "#cd6028" },
  { id: "event_idea",   label: "Event Ideas",   emoji: "🎪", color: "#c44a1f" },
  { id: "meeting_note", label: "Meeting Notes", emoji: "🤝", color: "#6a4d8c" },
  { id: "general",      label: "General",       emoji: "📝", color: "#547352" },
];

const FALLBACK = NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];

export function getNoteCategory(id: NoteCategory | string): NoteCategoryDef {
  return NOTE_CATEGORIES.find((c) => c.id === id) ?? FALLBACK;
}
