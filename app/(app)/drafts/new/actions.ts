"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/ai/generate-draft";
import { scoreVoice, type VoiceIssue } from "@/lib/ai/score-voice";
import {
  loadVoiceRules,
  renderVoiceRulesForPrompt,
} from "@/lib/ai/voice-rules";
import { getSeriesById } from "@/lib/series";

import type { ContentFormat, Json } from "@/types/database";

const FORMATS: ContentFormat[] = [
  "instagram_caption",
  "tiktok_caption",
  "email_subject",
  "email_body",
  "ad_script",
  "series_script",
];

export type GeneratedDraft = {
  id: string;
  brandId: string;
  brandSlug: string;
  format: ContentFormat;
  prompt: string;
  body: string;
  voiceScore: number;
  voiceSummary: string;
  voiceIssues: VoiceIssue[];
  seriesName: string | null;
  createdAt: string;
};

export type GenerateState =
  | { status: "idle" }
  | { status: "ok"; draft: GeneratedDraft }
  | { status: "error"; message: string };

const INITIAL: GenerateState = { status: "idle" };

export async function generateAndSaveDraft(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  try {
    const brandSlug = String(formData.get("brand") ?? "").trim();
    const format = String(formData.get("format") ?? "") as ContentFormat;
    const prompt = String(formData.get("prompt") ?? "").trim();
    const seriesIdRaw = String(formData.get("series_id") ?? "").trim();
    const seriesId = seriesIdRaw.length > 0 ? seriesIdRaw : null;

    if (!FORMATS.includes(format)) {
      return { status: "error", message: "Pick a valid format." };
    }
    if (prompt.length < 4) {
      return {
        status: "error",
        message: "Give Kai at least a sentence to work with.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "error", message: "Not signed in." };

    const { data: brand } = await supabase
      .from("brands")
      .select("id, slug")
      .eq("slug", brandSlug)
      .maybeSingle();
    if (!brand) {
      return { status: "error", message: "Brand not found or no access." };
    }

    const voice = await loadVoiceRules(brand.id);
    if (!voice) {
      return {
        status: "error",
        message:
          "No brand voice rules exist for this brand yet. Tracy needs to add v1 first.",
      };
    }

    const series = seriesId ? await getSeriesById(seriesId) : null;

    const voiceMarkdown = renderVoiceRulesForPrompt(voice.rules);

    let drafted;
    let scored;
    try {
      drafted = await generateDraft({
        prompt,
        format,
        voiceRulesMarkdown: voiceMarkdown,
        series: series
          ? {
              name: series.name,
              description: series.description,
              guidelines: series.guidelines,
            }
          : null,
      });
      scored = await scoreVoice({
        draft: drafted.body,
        format,
        voiceRulesMarkdown: voiceMarkdown,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      return { status: "error", message };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("content_drafts")
      .insert({
        brand_id: brand.id,
        author_id: user.id,
        format,
        status: "draft",
        prompt,
        body: drafted.body,
        voice_score: scored.score,
        voice_issues: scored.issues as unknown as Json,
        voice_summary: scored.summary,
        voice_rules_id: voice.rulesId,
        model_used: drafted.model,
        thinking_used: drafted.thinkingUsed,
        series_id: series?.id ?? null,
      })
      .select("id, created_at")
      .single();

    if (insertErr || !inserted) {
      return {
        status: "error",
        message: insertErr?.message ?? "Could not save draft.",
      };
    }

    revalidatePath("/drafts");

    return {
      status: "ok",
      draft: {
        id: inserted.id,
        brandId: brand.id,
        brandSlug: brand.slug,
        format,
        prompt,
        body: drafted.body,
        voiceScore: scored.score,
        voiceSummary: scored.summary,
        voiceIssues: scored.issues,
        seriesName: series?.name ?? null,
        createdAt: inserted.created_at,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return { status: "error", message };
  }
}

export { INITIAL as INITIAL_GENERATE_STATE };
