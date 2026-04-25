"use client";

import { useActionState, useEffect, useRef } from "react";

import { FORMAT_LABELS } from "@/lib/ai/format-labels";

import {
  createSeries,
  INITIAL_SERIES_STATE,
  type SeriesFormState,
} from "./actions";

import type { ContentFormat } from "@/types/database";

const FORMAT_OPTIONS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export function SeriesCreateForm({ brandId }: { brandId: string }) {
  const [state, action, pending] = useActionState<SeriesFormState, FormData>(
    createSeries,
    INITIAL_SERIES_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok" && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-xl font-bold text-foreground">
        Add a series
      </h2>

      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="brand_id" value={brandId} />

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span className="text-foreground/80">Name</span>
          <input
            name="name"
            required
            minLength={2}
            disabled={pending}
            placeholder="e.g. Taco Talk"
            className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span className="text-foreground/80">Description</span>
          <textarea
            name="description"
            required
            minLength={10}
            rows={3}
            disabled={pending}
            placeholder="What is this series? Who's it for? What does it sound like?"
            className="rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span className="text-foreground/80">Guidelines (optional)</span>
          <textarea
            name="guidelines"
            rows={2}
            disabled={pending}
            placeholder="Format rules, opening lines, things to avoid…"
            className="rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span className="text-foreground/80">Default format</span>
          <select
            name="format_hint"
            disabled={pending}
            className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">— No default —</option>
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>

        {state.status === "error" && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.status === "ok" && (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create series"}
        </button>
      </form>
    </section>
  );
}
