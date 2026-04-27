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
