import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";
import { listSeriesForBrand } from "@/lib/series";

import { IdeasForm } from "./ideas-form";

export const metadata = {
  title: "Ideas — Ditch Marketing OS",
};

export default async function IdeasPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {active.name} · ideation
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          What should we make?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a series and Kai pitches concepts. Tap one to take it straight to
          the drafter.
        </p>
      </header>

      <IdeasForm brandSlug={active.slug} series={series} />
    </div>
  );
}
