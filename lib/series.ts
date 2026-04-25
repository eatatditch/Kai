import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ContentFormat } from "@/types/database";

export type Series = {
  id: string;
  slug: string;
  name: string;
  description: string;
  format_hint: ContentFormat | null;
  guidelines: string | null;
  is_active: boolean;
};

export async function listSeriesForBrand(
  brandId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<Series[]> {
  const supabase = await createClient();

  let query = supabase
    .from("content_series")
    .select("id, slug, name, description, format_hint, guidelines, is_active")
    .eq("brand_id", brandId)
    .is("deleted_at", null);

  if (opts.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data } = await query.order("name");
  return data ?? [];
}

export async function getSeriesById(id: string): Promise<Series | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_series")
    .select("id, slug, name, description, format_hint, guidelines, is_active")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}
