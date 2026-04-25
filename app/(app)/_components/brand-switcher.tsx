"use client";

import { useTransition } from "react";
import { ChevronsUpDown } from "lucide-react";

import { switchActiveBrand } from "../actions";

import type { BrandSummary } from "@/lib/active-brand";

export function BrandSwitcher({
  brands,
  active,
}: {
  brands: BrandSummary[];
  active: BrandSummary;
}) {
  const [pending, startTransition] = useTransition();

  if (brands.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-medium text-foreground">
        <span className="size-2 rounded-full bg-primary" />
        {active.name}
      </div>
    );
  }

  return (
    <label className="relative flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
      <span className="size-2 rounded-full bg-primary" />
      <span className="sr-only">Active brand</span>
      <select
        value={active.slug}
        disabled={pending}
        onChange={(e) => {
          const slug = e.target.value;
          startTransition(() => {
            void switchActiveBrand(slug);
          });
        }}
        className="appearance-none bg-transparent pr-6 outline-none"
      >
        {brands.map((b) => (
          <option key={b.id} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2 size-4 text-muted-foreground" />
    </label>
  );
}
