import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FORMAT_LABELS } from "@/lib/ai/format-labels";
import { VoiceScoreBadge } from "@/app/(app)/_components/voice-score-badge";

import { ReviewActions } from "./review-actions";
import { ScheduleForm } from "./schedule-form";

import type { DraftStatus, Json } from "@/types/database";
import type { VoiceIssue } from "@/lib/ai/score-voice";

export const metadata = {
  title: "Draft — Ditch Marketing OS",
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

const STATUS_COLOR: Record<DraftStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-accent/30 text-foreground",
  changes_requested: "bg-destructive/15 text-destructive",
  approved: "bg-primary/15 text-primary",
  scheduled: "bg-primary/15 text-primary",
  published: "bg-foreground/10 text-foreground",
  archived: "bg-muted text-muted-foreground",
};

const SEVERITY_STYLE = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-accent/20 text-foreground border-accent/40",
  low: "bg-muted text-muted-foreground border-border",
} as const;

type RouteParams = { id: string };

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: draft } = await supabase
    .from("content_drafts")
    .select(
      "id, brand_id, author_id, format, status, prompt, body, voice_score, voice_issues, voice_summary, review_notes, scheduled_at, series_id, created_at, updated_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!draft) notFound();

  const [{ data: brand }, { data: series }, { data: author }] =
    await Promise.all([
      supabase
        .from("brands")
        .select("id, slug, name")
        .eq("id", draft.brand_id)
        .single(),
      draft.series_id
        ? supabase
            .from("content_series")
            .select("id, name")
            .eq("id", draft.series_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", draft.author_id)
        .maybeSingle(),
    ]);

  const issues = (draft.voice_issues ?? []) as Json as VoiceIssue[];
  const isOwner = profile?.role === "owner";
  const isManager = profile?.role === "manager";
  const isAuthor = draft.author_id === user.id;
  const canReview = isOwner || isManager;
  const canSchedule = (isOwner || isManager) && draft.status === "approved";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/drafts"
          className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          ← All drafts
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_COLOR[draft.status]}`}
          >
            {STATUS_LABEL[draft.status]}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {brand?.name} · {FORMAT_LABELS[draft.format]}
            {series?.name ? ` · ${series.name}` : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          By {author?.full_name || author?.email || "—"} ·{" "}
          {new Date(draft.created_at).toLocaleString()}
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Copy
          </p>
          {typeof draft.voice_score === "number" && (
            <VoiceScoreBadge score={draft.voice_score} />
          )}
        </div>
        <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-foreground">
          {draft.body}
        </pre>
        {draft.voice_summary && (
          <p className="text-sm italic text-muted-foreground">
            {draft.voice_summary}
          </p>
        )}
      </section>

      {issues.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Voice issues
          </p>
          <ul className="flex flex-col gap-2">
            {issues.map((issue, i) => (
              <li
                key={i}
                className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_STYLE[issue.severity]}`}
              >
                <p className="font-medium">
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {issue.severity} · {issue.category}
                  </span>{" "}
                  {issue.message}
                </p>
                {issue.quote && (
                  <p className="mt-1 italic">&ldquo;{issue.quote}&rdquo;</p>
                )}
                {issue.suggestion && (
                  <p className="mt-1 text-foreground/80">→ {issue.suggestion}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Original brief
        </p>
        <p className="text-sm text-foreground">{draft.prompt}</p>
      </section>

      {draft.review_notes && (
        <section className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive">
            Review notes
          </p>
          <p className="text-sm text-foreground">{draft.review_notes}</p>
        </section>
      )}

      <ReviewActions
        draftId={draft.id}
        status={draft.status}
        canReview={canReview}
        isAuthor={isAuthor}
      />

      {canSchedule && (
        <ScheduleForm
          draftId={draft.id}
          currentScheduledAt={draft.scheduled_at}
        />
      )}
    </div>
  );
}
