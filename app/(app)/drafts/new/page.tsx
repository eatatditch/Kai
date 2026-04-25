import Link from "next/link";

import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";
import { listSeriesForBrand } from "@/lib/series";

import { DraftForm } from "./draft-form";

import type { ContentFormat } from "@/types/database";

export const metadata = {
  title: "New draft — Ditch Marketing OS",
};

const VALID_FORMATS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export default async function NewDraftPage({
  searchParams,
}: {
  searchParams: Promise<{
    prompt?: string;
    format?: string;
    series_id?: string;
  }>;
}) {
  const brands = await getAccessibleBrands();
  const active = await getActiveBrand(brands);

  if (!active) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        You don&rsquo;t have access to any brand yet. Ask Tracy to add you.
      </div>
    );
  }

  const series = await listSeriesForBrand(active.id, { activeOnly: true });
  const params = await searchParams;
  const initialFormat =
    params.format && VALID_FORMATS.includes(params.format as ContentFormat)
      ? (params.format as ContentFormat)
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {active.name} · new draft
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          What are we writing?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a series for the right voice, or leave it blank for a one-off.
          Kai drafts, scores, and saves it for review.
        </p>
      </header>

      <DraftForm
        brandSlug={active.slug}
        series={series}
        initialPrompt={params.prompt}
        initialSeriesId={params.series_id}
        initialFormat={initialFormat}
      />

      <div className="flex gap-4 text-sm font-semibold text-muted-foreground">
        <Link href="/drafts" className="hover:text-foreground">
          ← Back to all drafts
        </Link>
        <Link href="/ideas" className="hover:text-foreground">
          Need ideas? →
        </Link>
      </div>
    </div>
  );
}
