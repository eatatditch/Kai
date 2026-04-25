import "server-only";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const ACTIVE_BRAND_COOKIE = "kai.active_brand";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type BrandSummary = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Brands the current user can act on. Owners see every brand; everyone else
 * sees the brands they have a membership for.
 *
 * RLS already enforces this — the queries below would not return forbidden
 * rows even if the WHERE clauses lied — but the explicit role split keeps the
 * SQL cheaper and easier to read.
 */
export async function getAccessibleBrands(): Promise<BrandSummary[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role === "owner") {
    const { data } = await supabase
      .from("brands")
      .select("id, slug, name")
      .order("name");
    return data ?? [];
  }

  const { data } = await supabase
    .from("brand_memberships")
    .select("brands ( id, slug, name )");

  return (data ?? [])
    .map((row) => row.brands as unknown as BrandSummary | null)
    .filter((b): b is BrandSummary => b !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getActiveBrand(
  brands: BrandSummary[],
): Promise<BrandSummary | null> {
  if (brands.length === 0) return null;

  const cookieStore = await cookies();
  const slug = cookieStore.get(ACTIVE_BRAND_COOKIE)?.value;
  const match = slug ? brands.find((b) => b.slug === slug) : undefined;
  return match ?? brands[0];
}

export async function setActiveBrandCookie(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BRAND_COOKIE, slug, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}
