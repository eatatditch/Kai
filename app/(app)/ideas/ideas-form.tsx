"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { FORMAT_LABELS } from "@/lib/ai/format-labels";

import {
  generateIdeasAction,
  INITIAL_IDEAS_STATE,
  type IdeasState,
} from "./actions";

import type { ContentFormat } from "@/types/database";
import type { Series } from "@/lib/series";

const FORMAT_OPTIONS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export function IdeasForm({
  brandSlug,
  series,
}: {
  brandSlug: string;
  series: Series[];
}) {
  const [state, formAction, pending] = useActionState<IdeasState, FormData>(
    generateIdeasAction,
    INITIAL_IDEAS_STATE,
  );

  const [seriesId, setSeriesId] = useState("");
  const selected = series.find((s) => s.id === seriesId) ?? null;
  const defaultFormat: ContentFormat =
    selected?.format_hint ?? "instagram_caption";

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="brand" value={brandSlug} />

        <label className="flex flex-col gap-2 text-sm font-medium">
          <span className="text-foreground/80">Series</span>
          <select
            name="series_id"
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            disabled={pending}
            className="h-12 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">— Any concept, no series —</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selected && (
            <span className="text-xs text-muted-foreground">
              {selected.description}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <span className="text-foreground/80">Format</span>
          <select
            key={defaultFormat}
            name="format"
            defaultValue={defaultFormat}
            disabled={pending}
            className="h-12 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          <span className="text-foreground/80">
            Direction (optional)
          </span>
          <textarea
            name="hint"
            maxLength={500}
            disabled={pending}
            rows={3}
            placeholder="Anything specific? A theme, an upcoming menu drop, a holiday — or leave blank."
            className="rounded-lg border border-border bg-card px-3 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-primary text-primary-foreground font-semibold tracking-wide transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kai is thinking…" : "Pitch ideas"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {state.status === "ok" && (
        <section className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {state.seriesName ?? "Open ideation"} · {FORMAT_LABELS[state.format]}
          </p>
          <ul className="flex flex-col gap-2">
            {state.ideas.map((idea, i) => {
              const params = new URLSearchParams();
              params.set("prompt", idea);
              params.set("format", state.format);
              if (state.seriesId) params.set("series_id", state.seriesId);
              const draftHref = `/drafts/new?${params.toString()}`;
              return (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="flex-1 text-sm text-foreground">{idea}</p>
                  <Link
                    href={draftHref}
                    className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    Draft this →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
