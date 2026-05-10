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
  /** Shared across all occurrences created from one recurring brief. */
  series_id?: string;
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

// =============================================================================
// Weekly Sync types
// =============================================================================

export type CadenceMeter = {
  id: string;
  slug: string;
  name: string;
  targetLabel: string;
  maxValue: number;
  sortOrder: number;
};

export type CadenceReading = {
  id: string;
  meterId: string;
  isoYear: number;
  isoWeek: number;
  currentValue: number;
};

export type RoadmapStatus = "future" | "todo" | "mapping" | "mapped";

export type RoadmapMonth = {
  id: string;
  monthStart: string;
  quarter: string;
  status: RoadmapStatus;
  statusLabel: string;
  deadlineText?: string;
  notes?: string;
};

export type SyncOwner = "I" | "T" | "—";
export type SyncBucket = "thisweek" | "radar";

export type SyncItem = {
  id: string;
  bucket: SyncBucket;
  body: string;
  owner: SyncOwner;
  done: boolean;
  dueDate?: string;
  sortOrder: number;
  createdAt: string;
  doneAt?: string;
  isoYear: number;
  isoWeek: number;
};

export type SyncSnapshot = {
  id: string;
  isoYear: number;
  isoWeek: number;
  payload: SyncSnapshotPayload;
  createdAt: string;
};

export type SyncSnapshotPayload = {
  meters: CadenceMeter[];
  readings: CadenceReading[];
  roadmap: RoadmapMonth[];
  items: SyncItem[];
};
