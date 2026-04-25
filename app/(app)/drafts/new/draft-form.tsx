"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { VoiceScoreBadge } from "@/app/(app)/_components/voice-score-badge";
import { FORMAT_LABELS } from "@/lib/ai/format-labels";

import {
  generateAndSaveDraft,
  INITIAL_GENERATE_STATE,
  type GenerateState,
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

const SEVERITY_STYLE = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-accent/20 text-foreground border-accent/40",
  low: "bg-muted text-muted-foreground border-border",
} as const;

export function DraftForm({
  brandSlug,
  series,
  initialPrompt,
  initialSeriesId,
  initialFormat,
}: {
  brandSlug: string;
  series: Series[];
  initialPrompt?: string;
  initialSeriesId?: string;
  initialFormat?: ContentFormat;
}) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateAndSaveDraft,
    INITIAL_GENERATE_STATE,
  );

  const [seriesId, setSeriesId] = useState(initialSeriesId ?? "");
  const selected = series.find((s) => s.id === seriesId) ?? null;
  const defaultFormat: ContentFormat =
    initialFormat ?? selected?.format_hint ?? "instagram_caption";

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="brand" value={brandSlug} />

        {series.length > 0 && (
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span className="text-foreground/80">Series (optional)</span>
            <select
              name="series_id"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              disabled={pending}
              className="h-12 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="">— No series, one-off —</option>
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
        )}

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
          <span className="text-foreground/80">Brief</span>
          <textarea
            name="prompt"
            required
            minLength={4}
            maxLength={2000}
            disabled={pending}
            defaultValue={initialPrompt ?? ""}
            rows={5}
            placeholder="What's this post about? Be specific — the dish, the moment, the vibe."
            className="rounded-lg border border-border bg-card px-3 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-primary text-primary-foreground font-semibold tracking-wide transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kai is writing…" : "Generate draft"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {state.status === "ok" && (
        <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <header className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Draft saved{state.draft.seriesName ? ` · ${state.draft.seriesName}` : ""}
            </p>
            <VoiceScoreBadge score={state.draft.voiceScore} />
          </header>

          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-foreground">
            {state.draft.body}
          </pre>

          <p className="text-sm italic text-muted-foreground">
            {state.draft.voiceSummary}
          </p>

          {state.draft.voiceIssues.length > 0 && (
            <ul className="flex flex-col gap-2">
              {state.draft.voiceIssues.map((issue, i) => (
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
                    <p className="mt-1 text-foreground/80">
                      → {issue.suggestion}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <Link
              href={`/drafts/${state.draft.id}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Open draft →
            </Link>
            <Link
              href="/drafts"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              All drafts
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
