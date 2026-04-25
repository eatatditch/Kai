"use client";

import { useActionState } from "react";

import {
  INITIAL_SERIES_STATE,
  toggleSeries,
  type SeriesFormState,
} from "./actions";

export function SeriesToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [, action, pending] = useActionState<SeriesFormState, FormData>(
    toggleSeries,
    INITIAL_SERIES_STATE,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="is_active" value={String(isActive)} />
      <button
        type="submit"
        disabled={pending}
        className={`h-9 rounded-lg border px-3 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 ${
          isActive
            ? "border-border text-muted-foreground hover:bg-muted"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        }`}
      >
        {pending ? "…" : isActive ? "Pause" : "Activate"}
      </button>
    </form>
  );
}
