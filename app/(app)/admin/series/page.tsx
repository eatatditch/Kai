import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";
import { listSeriesForBrand } from "@/lib/series";
import { FORMAT_LABELS } from "@/lib/ai/format-labels";

import { SeriesCreateForm } from "./series-create-form";
import { SeriesToggle } from "./series-toggle";

export const metadata = {
  title: "Series — Ditch Marketing OS",
};

export default async function AdminSeriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "manager") {
    redirect("/dashboard");
  }

  const brands = await getAccessibleBrands();
  const active = await getActiveBrand(brands);
  if (!active) redirect("/dashboard");

  const series = await listSeriesForBrand(active.id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Admin · {active.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
          Content series
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recurring content concepts. Each one shapes the brief Kai writes
          against.
        </p>
      </header>

      <SeriesCreateForm brandId={active.id} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">
          Active & paused
        </h2>
        {series.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No series yet. Create your first one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {series.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold text-foreground">
                      {s.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {s.format_hint ? FORMAT_LABELS[s.format_hint] : "any format"}
                      {" · "}
                      {s.is_active ? "active" : "paused"}
                    </p>
                  </div>
                  <SeriesToggle id={s.id} isActive={s.is_active} />
                </div>
                <p className="text-sm text-foreground">{s.description}</p>
                {s.guidelines && (
                  <p className="text-xs italic text-muted-foreground">
                    Guidelines: {s.guidelines}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
