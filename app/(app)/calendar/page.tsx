import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";
import { FORMAT_LABELS } from "@/lib/ai/format-labels";

import type { DraftStatus } from "@/types/database";

export const metadata = {
  title: "Calendar — Ditch Marketing OS",
};

const STATUS_LABEL: Record<DraftStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CalendarPage() {
  const brands = await getAccessibleBrands();
  const active = await getActiveBrand(brands);

  if (!active) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        You don&rsquo;t have access to any brand yet. Ask Tracy to add you.
      </div>
    );
  }

  const supabase = await createClient();
  const today = startOfDay(new Date());
  const horizonEnd = new Date(today);
  horizonEnd.setDate(horizonEnd.getDate() + 30);

  const { data: scheduled } = await supabase
    .from("content_drafts")
    .select(
      "id, format, status, body, scheduled_at, series_id",
    )
    .eq("brand_id", active.id)
    .is("deleted_at", null)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", today.toISOString())
    .lte("scheduled_at", horizonEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const { data: approvedUnscheduled } = await supabase
    .from("content_drafts")
    .select("id, format, status, body, series_id")
    .eq("brand_id", active.id)
    .eq("status", "approved")
    .is("scheduled_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const seriesIds = Array.from(
    new Set(
      [...(scheduled ?? []), ...(approvedUnscheduled ?? [])]
        .map((d) => d.series_id)
        .filter((id): id is string => !!id),
    ),
  );

  const seriesById = new Map<string, string>();
  if (seriesIds.length > 0) {
    const { data: seriesRows } = await supabase
      .from("content_series")
      .select("id, name")
      .in("id", seriesIds);
    for (const row of seriesRows ?? []) {
      seriesById.set(row.id, row.name);
    }
  }

  const grouped = new Map<string, typeof scheduled>();
  for (const d of scheduled ?? []) {
    if (!d.scheduled_at) continue;
    const key = startOfDay(new Date(d.scheduled_at)).toISOString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(d);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {active.name}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            Calendar
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Next 30 days
          </p>
        </div>
        <Link
          href="/drafts/new"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          + New draft
        </Link>
      </header>

      {grouped.size === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nothing scheduled. Approve a draft and pick a publish time on its
          detail page.
        </div>
      ) : (
        <section className="flex flex-col gap-5">
          {Array.from(grouped.entries()).map(([dayKey, items]) => (
            <div key={dayKey} className="flex flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {fmtDay(new Date(dayKey))}
              </p>
              <ul className="flex flex-col gap-2">
                {(items ?? []).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/drafts/${d.id}`}
                      className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          {fmtTime(d.scheduled_at!)} · {FORMAT_LABELS[d.format]}
                          {d.series_id && seriesById.get(d.series_id)
                            ? ` · ${seriesById.get(d.series_id)}`
                            : ""}
                        </p>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {STATUS_LABEL[d.status]}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-foreground">
                        {d.body}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {approvedUnscheduled && approvedUnscheduled.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Approved · awaiting schedule
          </p>
          <ul className="flex flex-col gap-2">
            {approvedUnscheduled.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/drafts/${d.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-dashed border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {FORMAT_LABELS[d.format]}
                    {d.series_id && seriesById.get(d.series_id)
                      ? ` · ${seriesById.get(d.series_id)}`
                      : ""}
                  </p>
                  <p className="line-clamp-2 text-sm text-foreground">
                    {d.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
