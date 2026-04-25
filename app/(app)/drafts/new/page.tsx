import Link from "next/link";

import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";

import { DraftForm } from "./draft-form";

export const metadata = {
  title: "New draft — Ditch Marketing OS",
};

export default async function NewDraftPage() {
  const brands = await getAccessibleBrands();
  const active = await getActiveBrand(brands);

  if (!active) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        You don&rsquo;t have access to any brand yet. Ask Tracy to add you.
      </div>
    );
  }

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
          Kai drafts in {active.name}&rsquo;s voice, scores it, and saves it for
          review.
        </p>
      </header>

      <DraftForm brandSlug={active.slug} />

      <Link
        href="/drafts"
        className="text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        ← Back to all drafts
      </Link>
    </div>
  );
}
