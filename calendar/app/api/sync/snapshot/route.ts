import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  itemFromDb,
  meterFromDb,
  monthFromDb,
  readingFromDb,
} from "@/lib/sync-api";
import { currentIsoWeek, previousIsoWeek } from "@/lib/iso-week";

export const dynamic = "force-dynamic";

// Vercel Cron — Mondays 09:00 ET. Snapshots the prior ISO week and rolls
// open `thisweek` items into the new week.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (expected && auth !== `Bearer ${expected}` && !isVercelCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  const current = currentIsoWeek();
  const prior = previousIsoWeek(current);

  const [metersRes, readingsRes, roadmapRes, itemsRes] = await Promise.all([
    supabase
      .from("cadence_meters")
      .select("id, slug, name, target_label, max_value, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("cadence_readings")
      .select("id, meter_id, iso_year, iso_week, current_value")
      .eq("iso_year", prior.year)
      .eq("iso_week", prior.week),
    supabase
      .from("content_roadmap_months")
      .select(
        "id, month_start, quarter, status, status_label, deadline_text, notes",
      )
      .order("month_start", { ascending: true }),
    supabase
      .from("sync_items")
      .select(
        "id, bucket, body, owner, done, due_date, sort_order, created_at, done_at, iso_year, iso_week",
      )
      .or(
        `and(bucket.eq.thisweek,iso_year.eq.${prior.year},iso_week.eq.${prior.week}),bucket.eq.radar`,
      ),
  ]);

  if (metersRes.error || readingsRes.error || roadmapRes.error || itemsRes.error) {
    const err =
      metersRes.error ?? readingsRes.error ?? roadmapRes.error ?? itemsRes.error;
    return NextResponse.json(
      { ok: false, error: err?.message ?? "fetch failed" },
      { status: 500 },
    );
  }

  const payload = {
    meters: (metersRes.data ?? []).map(meterFromDb),
    readings: (readingsRes.data ?? []).map(readingFromDb),
    roadmap: (roadmapRes.data ?? []).map(monthFromDb),
    items: (itemsRes.data ?? []).map(itemFromDb),
  };

  const { error: snapErr } = await supabase.from("sync_snapshots").upsert(
    {
      iso_year: prior.year,
      iso_week: prior.week,
      payload,
    },
    { onConflict: "iso_year,iso_week" },
  );
  if (snapErr) {
    return NextResponse.json(
      { ok: false, error: snapErr.message },
      { status: 500 },
    );
  }

  // Roll open thisweek items into the current week.
  const openItems = payload.items.filter(
    (i) => i.bucket === "thisweek" && !i.done,
  );
  if (openItems.length > 0) {
    const rows = openItems.map((i) => ({
      bucket: "thisweek" as const,
      body: i.body,
      owner: i.owner,
      iso_year: current.year,
      iso_week: current.week,
      sort_order: i.sortOrder,
    }));
    const { error: rollErr } = await supabase.from("sync_items").insert(rows);
    if (rollErr) {
      return NextResponse.json(
        { ok: false, error: `snapshot ok, rollover failed: ${rollErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    snapshot: { year: prior.year, week: prior.week },
    rolled: openItems.length,
  });
}
