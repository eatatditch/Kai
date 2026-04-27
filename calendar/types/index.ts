export type Category = "shoot" | "social" | "comms" | "event" | "meeting" | "other";

export type ViewMode = "month" | "week";

export type EventType = {
  id: string;
  emoji: string;
  label: string;
  cat: Category;
};

export type CategoryDef = {
  id: Category;
  label: string;
  color: string;
};

export type CalendarEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  time?: string;
  notes?: string;
};

export type FilterKey = Category | "all";

export type Recurrence =
  | "none"
  | "daily"
  | "every_other_day"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type NoteCategory =
  | "shoot_idea"
  | "event_idea"
  | "meeting_note"
  | "general";

export type NoteCategoryDef = {
  id: NoteCategory;
  label: string;
  emoji: string;
  color: string;
};

export type Note = {
  id: string;
  category: NoteCategory;
  title: string;
  body?: string;
  updatedAt: string;
};

export type NoteFilterKey = NoteCategory | "all";
