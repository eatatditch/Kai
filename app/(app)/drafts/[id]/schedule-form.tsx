"use client";

import { useActionState } from "react";

import {
  INITIAL_REVIEW_STATE,
  scheduleDraft,
  type ReviewState,
} from "./actions";

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleForm({
  draftId,
  currentScheduledAt,
}: {
  draftId: string;
  currentScheduledAt: string | null;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    scheduleDraft,
    INITIAL_REVIEW_STATE,
  );

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Schedule
      </p>

      {state.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="draft_id" value={draftId} />
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
          <span className="text-foreground/80">Publish at</span>
          <input
            type="datetime-local"
            name="scheduled_at"
            required
            disabled={pending}
            defaultValue={toLocalDateTimeInput(currentScheduledAt)}
            className="h-12 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Scheduling…" : "Schedule"}
        </button>
      </form>
    </section>
  );
}
