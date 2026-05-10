import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  itemFromDb,
  meterFromDb,
  monthFromDb,
  readingFromDb,
} from "@/lib/sync-api";
import type {
  CadenceMeter,
  CadenceReading,
  RoadmapMonth,
  SyncItem,
} from "@/types";

export type SyncSnapshotData = {
  meters: CadenceMeter[];
  readings: CadenceReading[];
  roadmap: RoadmapMonth[];
  items: SyncItem[];
};

export async function loadSyncData(
  isoYear: number,
  isoWeek: number,
): Promise<SyncSnapshotData> {
  const supabase = await createClient();

  const [metersRes, readingsRes, roadmapRes, itemsRes] = await Promise.all([
    supabase
      .from("cadence_meters")
      .select("id, slug, name, target_label, max_value, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("cadence_readings")
      .select("id, meter_id, iso_year, iso_week, current_value")
      .eq("iso_year", isoYear)
      .eq("iso_week", isoWeek),
    supabase
      .from("content_roadmap_months")
      .select(
        "id, month_start, quarter, status, status_label, deadline_text, notes",
      )
      .order("month_start", { ascending: true }),
    // thisweek items are scoped to this iso week; radar items roll forward
    // (we just take all radar items that are not done).
    supabase
      .from("sync_items")
      .select(
        "id, bucket, body, owner, done, due_date, sort_order, created_at, done_at, iso_year, iso_week",
      )
      .or(
        `and(bucket.eq.thisweek,iso_year.eq.${isoYear},iso_week.eq.${isoWeek}),bucket.eq.radar`,
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (metersRes.error) throw metersRes.error;
  if (readingsRes.error) throw readingsRes.error;
  if (roadmapRes.error) throw roadmapRes.error;
  if (itemsRes.error) throw itemsRes.error;

  return {
    meters: (metersRes.data ?? []).map(meterFromDb),
    readings: (readingsRes.data ?? []).map(readingFromDb),
    roadmap: (roadmapRes.data ?? []).map(monthFromDb),
    items: (itemsRes.data ?? []).map(itemFromDb),
  };
}
