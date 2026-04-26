"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { ContentFormat } from "@/types/database";

const FORMATS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export type SeriesFormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const INITIAL: SeriesFormState = { status: "idle" };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function requireManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "manager") {
    return { ok: false as const, message: "Managers and owners only." };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function createSeries(
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  try {
    const auth = await requireManager();
    if (!auth.ok) return { status: "error", message: auth.message };

    const brandId = String(formData.get("brand_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const guidelines = String(formData.get("guidelines") ?? "").trim() || null;
    const formatRaw = String(formData.get("format_hint") ?? "").trim();
    const formatHint =
      formatRaw && FORMATS.includes(formatRaw as ContentFormat)
        ? (formatRaw as ContentFormat)
        : null;

    if (!brandId) return { status: "error", message: "Pick a brand." };
    if (name.length < 2)
      return { status: "error", message: "Series needs a name." };
    if (description.length < 10)
      return {
        status: "error",
        message: "Describe the series in a sentence or two.",
      };

    const slug = slugify(name);
    const { error } = await auth.supabase.from("content_series").insert({
      brand_id: brandId,
      slug,
      name,
      description,
      guidelines,
      format_hint: formatHint,
      is_active: true,
    });

    if (error) return { status: "error", message: error.message };

    revalidatePath("/admin/series");
    revalidatePath("/ideas");
    revalidatePath("/drafts/new");
    return { status: "ok", message: "Series created." };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return { status: "error", message };
  }
}

export async function toggleSeries(
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  try {
    const auth = await requireManager();
    if (!auth.ok) return { status: "error", message: auth.message };

    const id = String(formData.get("id") ?? "");
    const isActive = String(formData.get("is_active") ?? "") === "true";

    const { error } = await auth.supabase
      .from("content_series")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) return { status: "error", message: error.message };

    revalidatePath("/admin/series");
    revalidatePath("/ideas");
    revalidatePath("/drafts/new");
    return { status: "ok", message: "Updated." };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return { status: "error", message };
  }
}

export { INITIAL as INITIAL_SERIES_STATE };
