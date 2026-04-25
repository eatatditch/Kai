import "server-only";

import { FORMAT_LABELS } from "./format-labels";

import type { ContentFormat } from "@/types/database";

const FORMAT_RULES: Record<ContentFormat, string> = {
  instagram_caption:
    "Length: 80–220 characters typical, never over 2200. Up to 3 hashtags, lowercase, brand-relevant. No emoji unless it earns its place.",
  tiktok_caption:
    "Length: 60–150 characters. Hook in the first 4 words. Up to 3 hashtags, lowercase, brand-relevant.",
  email_subject:
    "Length: 32–55 characters. No emoji. No clickbait. Should read like a friend texting, not a brand shouting.",
  email_body:
    "Length: 80–180 words. Write like a Long Island host who knows the kitchen. Open with a moment, not a pitch. End with one clear call to action.",
  ad_script:
    "15-second read. 35–50 words. Plain spoken. Open with a hook, name the place once, end with where to go.",
  series_script:
    "One short scene (4–10 lines). Format: CHARACTER: dialogue. Include a stage direction in brackets if useful. Keep it tight, exaggerated, and human.",
};

const SYSTEM_PRELUDE = `You are Kai, the in-house copywriter for Ditch — a Long Island restaurant group with a Southern California surf soul.

Write the way the staff actually talks. Confident, warm, dry, never selling. Reference specifics: a dish, a shift, a regular, the ocean, the bar. Skip generic restaurant marketing language entirely.

Do not use AI tells: em dashes, "in conclusion", obvious tricolons, decorative emoji, or "Ladies and gentlemen". If a phrase sounds like every other restaurant could say it, rewrite it until only Ditch could.

When you generate copy, return ONLY the copy itself. No preamble, no "Here's a draft:", no quotation marks around it, no commentary. The user will get a separate critique pass — your job here is the words.`;

/**
 * Build the system prompt for the drafter. The first three blocks are stable
 * across requests (frozen prelude + format rules + brand voice rules) and are
 * cache-marked so we hit the prompt cache on the second request onward.
 *
 * Anything volatile (the user's prompt, brand-specific session info) goes in
 * the messages array, AFTER the cache breakpoint, per shared/prompt-caching.md.
 */
export function buildDrafterSystem(
  format: ContentFormat,
  voiceRulesMarkdown: string,
): Array<{
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}> {
  return [
    { type: "text", text: SYSTEM_PRELUDE },
    {
      type: "text",
      text: `# Format: ${FORMAT_LABELS[format]}\n\n${FORMAT_RULES[format]}`,
    },
    {
      type: "text",
      text: voiceRulesMarkdown,
      cache_control: { type: "ephemeral" },
    },
  ];
}

const SCORING_SYSTEM = `You are the in-house brand voice editor at Ditch. Read the draft below and score it against the brand voice rules.

Be tough. The goal is shipping copy that feels like it could only come from this team. If it sounds like generic restaurant marketing, mark it down hard.

Return a 0–100 voice score:
- 90–100: ships as-is
- 75–89: ships with small tweaks
- 60–74: needs another pass
- below 60: rewrite

Flag every issue with severity, category (tone | vocabulary | format | factual | other), the offending phrase if any, and a one-line suggestion. Keep the summary to one sentence.`;

export function buildScorerSystem(
  voiceRulesMarkdown: string,
): Array<{
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}> {
  return [
    { type: "text", text: SCORING_SYSTEM },
    {
      type: "text",
      text: voiceRulesMarkdown,
      cache_control: { type: "ephemeral" },
    },
  ];
}

export type SeriesContext = {
  name: string;
  description: string;
  guidelines: string | null;
};

export function buildDraftUserMessage(
  prompt: string,
  format: ContentFormat,
  series?: SeriesContext | null,
): string {
  const parts: string[] = [];
  if (series) {
    parts.push(`# Content series: ${series.name}`);
    parts.push(series.description);
    if (series.guidelines) {
      parts.push("");
      parts.push(`Series guidelines: ${series.guidelines}`);
    }
    parts.push("");
  }
  parts.push(`Brief from the team:\n${prompt.trim()}`);
  parts.push("");
  parts.push(
    `Write ONE ${FORMAT_LABELS[format]}${series ? ` that fits the ${series.name} series` : ""}. Just the copy, nothing else.`,
  );
  return parts.join("\n");
}

export function buildIdeationUserMessage(args: {
  brandName: string;
  series?: SeriesContext | null;
  hint?: string | null;
  count: number;
}): string {
  const parts: string[] = [];
  parts.push(`# Brand: ${args.brandName}`);
  if (args.series) {
    parts.push(`# Series: ${args.series.name}`);
    parts.push(args.series.description);
    if (args.series.guidelines) {
      parts.push(`Series guidelines: ${args.series.guidelines}`);
    }
  }
  if (args.hint) {
    parts.push("");
    parts.push(`Direction from the team: ${args.hint.trim()}`);
  }
  parts.push("");
  parts.push(
    `Generate ${args.count} content ideas${args.series ? ` for the ${args.series.name} series` : ""}. Each idea is a one-sentence concept the team can use as a brief. No numbering, no preamble — just the ideas.`,
  );
  return parts.join("\n");
}

export function buildScoreUserMessage(
  draft: string,
  format: ContentFormat,
): string {
  return `Format: ${FORMAT_LABELS[format]}\n\nDraft to score:\n---\n${draft}\n---`;
}
