import { createClient } from "@/lib/supabase/client";
import type {
  CadenceMeter,
  CadenceReading,
  RoadmapMonth,
  RoadmapStatus,
  SyncBucket,
  SyncItem,
  SyncOwner,
} from "@/types";

type DbMeter = {
  id: string;
  slug: string;
  name: string;
  target_label: string;
  max_value: number;
  sort_order: number;
};
type DbReading = {
  id: string;
  meter_id: string;
  iso_year: number;
  iso_week: number;
  current_value: number;
};
type DbMonth = {
  id: string;
  month_start: string;
  quarter: string;
  status: RoadmapStatus;
  status_label: string;
  deadline_text: string | null;
  notes: string | null;
};
type DbItem = {
  id: string;
  bucket: SyncBucket;
  body: string;
  owner: SyncOwner;
  done: boolean;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  done_at: string | null;
  iso_year: number;
  iso_week: number;
};

export const meterFromDb = (r: DbMeter): CadenceMeter => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  targetLabel: r.target_label,
  maxValue: r.max_value,
  sortOrder: r.sort_order,
});

export const readingFromDb = (r: DbReading): CadenceReading => ({
  id: r.id,
  meterId: r.meter_id,
  isoYear: r.iso_year,
  isoWeek: r.iso_week,
  currentValue: r.current_value,
});

export const monthFromDb = (r: DbMonth): RoadmapMonth => ({
  id: r.id,
  monthStart: r.month_start,
  quarter: r.quarter,
  status: r.status,
  statusLabel: r.status_label,
  deadlineText: r.deadline_text ?? undefined,
  notes: r.notes ?? undefined,
});

export const itemFromDb = (r: DbItem): SyncItem => ({
  id: r.id,
  bucket: r.bucket,
  body: r.body,
  owner: r.owner,
  done: r.done,
  dueDate: r.due_date ?? undefined,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  doneAt: r.done_at ?? undefined,
  isoYear: r.iso_year,
  isoWeek: r.iso_week,
});

// =============================================================================
// Realtime subscriptions
// =============================================================================

export type MeterChange =
  | { kind: "upsert"; reading: CadenceReading }
  | { kind: "delete"; id: string };

export function subscribeReadings(
  isoYear: number,
  isoWeek: number,
  onChange: (c: MeterChange) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`sync-readings-${isoYear}-${isoWeek}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cadence_readings" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as Partial<DbReading>;
          if (old.id) onChange({ kind: "delete", id: old.id });
          return;
        }
        const row = payload.new as DbReading;
        if (row.iso_year !== isoYear || row.iso_week !== isoWeek) return;
        onChange({ kind: "upsert", reading: readingFromDb(row) });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export type RoadmapChange =
  | { kind: "upsert"; month: RoadmapMonth }
  | { kind: "delete"; id: string };

export function subscribeRoadmap(
  onChange: (c: RoadmapChange) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("sync-roadmap")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "content_roadmap_months" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as Partial<DbMonth>;
          if (old.id) onChange({ kind: "delete", id: old.id });
          return;
        }
        onChange({
          kind: "upsert",
          month: monthFromDb(payload.new as DbMonth),
        });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export type ItemChange =
  | { kind: "upsert"; item: SyncItem }
  | { kind: "delete"; id: string };

export function subscribeItems(
  onChange: (c: ItemChange) => void,
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("sync-items")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sync_items" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as Partial<DbItem>;
          if (old.id) onChange({ kind: "delete", id: old.id });
          return;
        }
        onChange({ kind: "upsert", item: itemFromDb(payload.new as DbItem) });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
