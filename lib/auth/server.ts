import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export type AuthProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  default_brand_id: string | null;
};

export type AuthBrand = {
  id: string;
  slug: string;
  display_name: string;
  membership_role: UserRole;
};

/**
 * Returns the authenticated user, or null when no session exists.
 * Use this for routes that render differently for guests (e.g. /login).
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Returns the authenticated user, or redirects to /login.
 * Use this in any page or server action that requires a session.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the user's profile row. Throws if the row is missing — that should
 * never happen because the auth.users insert trigger creates it.
 */
export async function requireProfile(): Promise<{
  user: User;
  profile: AuthProfile;
}> {
  const user = await requireUser();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, default_brand_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error(`Profile not found for user ${user.id}: ${error?.message ?? "no row"}`);
  }
  return { user, profile: data as unknown as AuthProfile };
}

/**
 * Owner-only guard. Redirects non-owners to /. Use on pages that mutate
 * brand-wide state (creating brands, managing memberships, etc).
 */
export async function requireOwner(): Promise<{
  user: User;
  profile: AuthProfile;
}> {
  const result = await requireProfile();
  if (result.profile.role !== "owner") redirect("/");
  return result;
}

/**
 * Returns brands the current user can act on. Owners see every active brand;
 * everyone else sees brands they have a membership row for.
 *
 * RLS already enforces this on the read — the owner branch is a single query
 * against `brands`; the non-owner branch joins through `brand_memberships` so
 * we can return the user's per-brand role alongside the brand record.
 */
export async function getUserBrands(): Promise<AuthBrand[]> {
  const { profile } = await requireProfile();
  const supabase = createClient();

  if (profile.role === "owner") {
    const { data, error } = await supabase
      .from("brands")
      .select("id, slug, display_name")
      .order("display_name");
    if (error) throw error;
    type BrandSummary = { id: string; slug: string; display_name: string };
    return ((data ?? []) as unknown as BrandSummary[]).map((b) => ({
      id: b.id,
      slug: b.slug,
      display_name: b.display_name,
      membership_role: "owner" as const,
    }));
  }

  const { data, error } = await supabase
    .from("brand_memberships")
    .select("role, brands ( id, slug, display_name )")
    .order("brand_id");
  if (error) throw error;

  type Row = {
    role: UserRole;
    brands: { id: string; slug: string; display_name: string } | null;
  };
  const rows = (data ?? []) as unknown as Row[];
  return rows
    .filter((row) => row.brands !== null)
    .map((row) => {
      const brand = row.brands as NonNullable<Row["brands"]>;
      return {
        id: brand.id,
        slug: brand.slug,
        display_name: brand.display_name,
        membership_role: row.role,
      };
    });
}
