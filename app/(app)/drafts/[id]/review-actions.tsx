"use client";

import { useActionState, useState } from "react";

import {
  approveDraft,
  archiveDraft,
  INITIAL_REVIEW_STATE,
  requestChanges,
  submitForReview,
  type ReviewState,
} from "./actions";

import type { DraftStatus } from "@/types/database";

export function ReviewActions({
  draftId,
  status,
  canReview,
  isAuthor,
}: {
  draftId: string;
  status: DraftStatus;
  canReview: boolean;
  isAuthor: boolean;
}) {
  const [submitState, submitAction, submitPending] = useActionState<
    ReviewState,
    FormData
  >(submitForReview, INITIAL_REVIEW_STATE);
  const [approveState, approveAction, approvePending] = useActionState<
    ReviewState,
    FormData
  >(approveDraft, INITIAL_REVIEW_STATE);
  const [changesState, changesAction, changesPending] = useActionState<
    ReviewState,
    FormData
  >(requestChanges, INITIAL_REVIEW_STATE);
  const [archiveState, archiveAction, archivePending] = useActionState<
    ReviewState,
    FormData
  >(archiveDraft, INITIAL_REVIEW_STATE);

  const [showChanges, setShowChanges] = useState(false);

  const merged: ReviewState = [
    submitState,
    approveState,
    changesState,
    archiveState,
  ].find((s) => s.status !== "idle") ?? { status: "idle" };

  const canSubmitForReview =
    isAuthor && (status === "draft" || status === "changes_requested");
  const canApprove =
    canReview && (status === "in_review" || status === "draft");
  const canRequestChanges =
    canReview && (status === "in_review" || status === "draft");
  const canArchive =
    (canReview || isAuthor) &&
    status !== "published" &&
    status !== "archived";

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Actions
      </p>

      {merged.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {merged.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canSubmitForReview && (
          <form action={submitAction}>
            <input type="hidden" name="draft_id" value={draftId} />
            <button
              type="submit"
              disabled={submitPending}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitPending ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        )}

        {canApprove && (
          <form action={approveAction}>
            <input type="hidden" name="draft_id" value={draftId} />
            <button
              type="submit"
              disabled={approvePending}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
        )}

        {canRequestChanges && !showChanges && (
          <button
            type="button"
            onClick={() => setShowChanges(true)}
            className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Request changes
          </button>
        )}

        {canArchive && (
          <form action={archiveAction}>
            <input type="hidden" name="draft_id" value={draftId} />
            <button
              type="submit"
              disabled={archivePending}
              className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              {archivePending ? "Archiving…" : "Archive"}
            </button>
          </form>
        )}
      </div>

      {showChanges && canRequestChanges && (
        <form action={changesAction} className="flex flex-col gap-2">
          <textarea
            name="notes"
            required
            minLength={4}
            rows={3}
            disabled={changesPending}
            placeholder="What needs to change?"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <input type="hidden" name="draft_id" value={draftId} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={changesPending}
              className="h-10 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {changesPending ? "Sending…" : "Send change request"}
            </button>
            <button
              type="button"
              onClick={() => setShowChanges(false)}
              className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
