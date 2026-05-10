"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import type { RoadmapStatus, SyncBucket, SyncOwner } from "@/types";

const STATUS_CYCLE: RoadmapStatus[] = ["future", "todo", "mapping", "mapped"];
const STATUS_LABELS: Record<RoadmapStatus, string> = {
  future: "Future",
  todo: "To Do",
  mapping: "In Mapping",
  mapped: "Mapped",
};

async function ensureAllowed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ok = await isEmailAllowlisted(user.email);
  if (!ok) throw new Error("Not authorized");
  return supabase;
}

export async function adjustMeter(
  meterId: string,
  isoYear: number,
  isoWeek: number,
  delta: number,
  maxValue: number,
): Promise<{ ok: true; value: number } | { ok: false; error: string }> {
  try {
    const supabase = await ensureAllowed();

    const { data: existing } = await supabase
      .from("cadence_readings")
      .select("id, current_value")
      .eq("meter_id", meterId)
      .eq("iso_year", isoYear)
      .eq("iso_week", isoWeek)
      .maybeSingle();

    const current = existing?.current_value ?? 0;
    const next = Math.max(0, Math.min(maxValue, current + delta));
    if (next === current && existing) {
      return { ok: true, value: next };
    }

    const { error } = await supabase.from("cadence_readings").upsert(
      {
        meter_id: meterId,
        iso_year: isoYear,
        iso_week: isoWeek,
        current_value: next,
      },
      { onConflict: "meter_id,iso_year,iso_week" },
    );
    if (error) return { ok: false, error: error.message };

    revalidatePath("/sync");
    return { ok: true, value: next };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function cycleMonthStatus(
  monthId: string,
): Promise<
  { ok: true; status: RoadmapStatus; statusLabel: string } | { ok: false; error: string }
> {
  try {
    const supabase = await ensureAllowed();

    const { data: row, error: fetchError } = await supabase
      .from("content_roadmap_months")
      .select("status")
      .eq("id", monthId)
      .maybeSingle();
    if (fetchError) return { ok: false, error: fetchError.message };
    if (!row) return { ok: false, error: "Month not found" };

    const idx = STATUS_CYCLE.indexOf(row.status as RoadmapStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];

    const { error } = await supabase
      .from("content_roadmap_months")
      .update({ status: next, status_label: STATUS_LABELS[next] })
      .eq("id", monthId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/sync");
    return { ok: true, status: next, statusLabel: STATUS_LABELS[next] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addItem(input: {
  bucket: SyncBucket;
  body: string;
  owner: SyncOwner;
  isoYear: number;
  isoWeek: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = await ensureAllowed();
    const body = input.body.trim();
    if (!body) return { ok: false, error: "Body is required" };

    const { data, error } = await supabase
      .from("sync_items")
      .insert({
        bucket: input.bucket,
        body,
        owner: input.owner,
        iso_year: input.isoYear,
        iso_week: input.isoWeek,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    revalidatePath("/sync");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleItem(
  itemId: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await ensureAllowed();
    const { error } = await supabase
      .from("sync_items")
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/sync");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteItem(
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await ensureAllowed();
    const { error } = await supabase
      .from("sync_items")
      .delete()
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/sync");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
