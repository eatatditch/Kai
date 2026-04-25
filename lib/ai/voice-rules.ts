import "server-only";

import { createClient } from "@/lib/supabase/server";

export type VoiceRules = {
  brand_slug: string;
  tone_pillars: string[];
  must: string[];
  must_not: string[];
  vocabulary: {
    likes: string[];
    dislikes: string[];
  };
  examples: {
    good: string[];
    bad: string[];
  };
  hashtag_policy?: string;
  notes?: string;
};

export type LoadedVoiceRules = {
  rulesId: string;
  version: number;
  isActive: boolean;
  rules: VoiceRules;
};

/**
 * Load the current voice rules for a brand. Prefers the active version; falls
 * back to the highest version if none are active yet (so we can still draft
 * before Tracy approves v1).
 */
export async function loadVoiceRules(
  brandId: string,
): Promise<LoadedVoiceRules | null> {
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("brand_voice_rules")
    .select("id, version, is_active, rules")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .maybeSingle();

  if (active) {
    return {
      rulesId: active.id,
      version: active.version,
      isActive: true,
      rules: active.rules as unknown as VoiceRules,
    };
  }

  const { data: latest } = await supabase
    .from("brand_voice_rules")
    .select("id, version, is_active, rules")
    .eq("brand_id", brandId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return null;
  return {
    rulesId: latest.id,
    version: latest.version,
    isActive: false,
    rules: latest.rules as unknown as VoiceRules,
  };
}

export function renderVoiceRulesForPrompt(rules: VoiceRules): string {
  const lines: string[] = [];
  lines.push("# Brand voice rules");
  lines.push(`Brand: @${rules.brand_slug}`);
  lines.push("");
  lines.push("## Tone pillars");
  rules.tone_pillars.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("## Must");
  rules.must.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("## Must not");
  rules.must_not.forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("## Vocabulary");
  lines.push(`Prefer: ${rules.vocabulary.likes.join(", ")}`);
  lines.push(`Avoid: ${rules.vocabulary.dislikes.join(", ")}`);
  lines.push("");
  lines.push("## On-brand examples");
  rules.examples.good.forEach((e) => lines.push(`+ ${e}`));
  lines.push("");
  lines.push("## Off-brand examples");
  rules.examples.bad.forEach((e) => lines.push(`- ${e}`));
  if (rules.hashtag_policy) {
    lines.push("");
    lines.push("## Hashtag policy");
    lines.push(rules.hashtag_policy);
  }
  return lines.join("\n");
}
