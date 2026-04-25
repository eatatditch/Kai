import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .single();

  const brands = await getAccessibleBrands();
  const activeBrand = await getActiveBrand(brands);

  const greeting = profile?.full_name?.split(" ")[0] ?? user?.email ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Phase 0 · foundation
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          Hey {greeting}.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&rsquo;re signed in. The content generator, calendar, asset
          library, and approval flow land in the next phases.
        </p>
      </section>

      {activeBrand && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Active brand
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
            {activeBrand.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {brands.length} brand{brands.length === 1 ? "" : "s"} accessible ·
            role: {profile?.role ?? "—"}
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/drafts/new"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              + New draft
            </Link>
            <Link
              href="/drafts"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              View drafts
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Roadmap</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Phase 1 — AI content generator + brand voice scoring (current)</li>
          <li>Phase 2 — approval workflow + content calendar</li>
          <li>Phase 3 — asset library with Drive sync</li>
        </ul>
      </section>
    </div>
  );
}
