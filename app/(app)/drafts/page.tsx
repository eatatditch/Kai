import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";
import { FORMAT_LABELS } from "@/lib/ai/format-labels";
import { VoiceScoreBadge } from "@/app/(app)/_components/voice-score-badge";

import type { DraftStatus } from "@/types/database";

export const metadata = {
  title: "Drafts — Ditch Marketing OS",
};

const STATUS_LABEL: Record<DraftStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export default async function DraftsPage() {
  const supabase = await createClient();
  const brands = await getAccessibleBrands();
  const active = await getActiveBrand(brands);

  if (!active) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        You don&rsquo;t have access to any brand yet. Ask Tracy to add you.
      </div>
    );
  }

  const { data: drafts } = await supabase
    .from("content_drafts")
    .select(
      "id, format, status, body, voice_score, voice_summary, created_at",
    )
    .eq("brand_id", active.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {active.name}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            Drafts
          </h1>
        </div>
        <Link
          href="/drafts/new"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          + New draft
        </Link>
      </header>

      {!drafts || drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No drafts yet for {active.name}. Hit{" "}
          <Link href="/drafts/new" className="font-semibold text-primary">
            New draft
          </Link>{" "}
          to make the first one.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {FORMAT_LABELS[d.format]} · {STATUS_LABEL[d.status]} ·{" "}
                  {new Date(d.created_at).toLocaleDateString()}
                </p>
                {typeof d.voice_score === "number" && (
                  <VoiceScoreBadge score={d.voice_score} />
                )}
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                {d.body}
              </p>
              {d.voice_summary && (
                <p className="text-xs italic text-muted-foreground">
                  {d.voice_summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
