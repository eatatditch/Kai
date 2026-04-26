"use server";

import { createClient } from "@/lib/supabase/server";
import { generateIdeas } from "@/lib/ai/generate-ideas";
import {
  loadVoiceRules,
  renderVoiceRulesForPrompt,
} from "@/lib/ai/voice-rules";
import { getSeriesById } from "@/lib/series";

import type { ContentFormat } from "@/types/database";

const FORMATS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export type IdeasState =
  | { status: "idle" }
  | {
      status: "ok";
      ideas: string[];
      seriesId: string | null;
      seriesName: string | null;
      format: ContentFormat;
    }
  | { status: "error"; message: string };

const INITIAL: IdeasState = { status: "idle" };

export async function generateIdeasAction(
  _prev: IdeasState,
  formData: FormData,
): Promise<IdeasState> {
  try {
    const brandSlug = String(formData.get("brand") ?? "").trim();
    const format = String(formData.get("format") ?? "") as ContentFormat;
    const seriesIdRaw = String(formData.get("series_id") ?? "").trim();
    const seriesId = seriesIdRaw.length > 0 ? seriesIdRaw : null;
    const hint = String(formData.get("hint") ?? "").trim() || null;

    if (!FORMATS.includes(format)) {
      return { status: "error", message: "Pick a valid format." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "error", message: "Not signed in." };

    const { data: brand } = await supabase
      .from("brands")
      .select("id, slug, name")
      .eq("slug", brandSlug)
      .maybeSingle();
    if (!brand) {
      return { status: "error", message: "Brand not found or no access." };
    }

    const voice = await loadVoiceRules(brand.id);
    if (!voice) {
      return {
        status: "error",
        message: "No brand voice rules exist for this brand yet.",
      };
    }

    const series = seriesId ? await getSeriesById(seriesId) : null;
    const voiceMarkdown = renderVoiceRulesForPrompt(voice.rules);

    try {
      const result = await generateIdeas({
        brandName: brand.name,
        format,
        voiceRulesMarkdown: voiceMarkdown,
        series: series
          ? {
              name: series.name,
              description: series.description,
              guidelines: series.guidelines,
            }
          : null,
        hint,
        count: 6,
      });

      return {
        status: "ok",
        ideas: result.ideas,
        seriesId: series?.id ?? null,
        seriesName: series?.name ?? null,
        format,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ideation failed.";
      return { status: "error", message };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ideation failed.";
    return { status: "error", message };
  }
}

export { INITIAL as INITIAL_IDEAS_STATE };
