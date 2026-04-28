import { NextResponse } from "next/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { CAPTIONS_SYSTEM } from "@/lib/scripts/companion-prompts";
import {
  loadSourceScriptBlock,
  loadVoiceBlock,
  streamModelToResponse,
} from "@/lib/scripts/companion-stream";
import type { CaptionsBrief } from "@/lib/scripts/companion-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAllowlistedUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Not signed in" : "Not authorized" },
      { status: auth.status },
    );
  }

  let brief: CaptionsBrief;
  try {
    brief = (await req.json()) as CaptionsBrief;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const voiceBlock = await loadVoiceBlock(brief.profile_id);
  const sourceBlock = await loadSourceScriptBlock(brief.source_script_id);

  const brandLabel =
    brief.brand === "Other" && brief.brand_other
      ? `Other (${brief.brand_other})`
      : brief.brand;

  const tagInstruction =
    brief.hashtag_count === 0
      ? "Do NOT include any hashtags. Output an empty HASHTAGS line."
      : `Include exactly ${brief.hashtag_count} hashtags, lowercase, all relevant to the brand and topic.`;

  const userMessage = `BRIEF
Brand: ${brandLabel}
Topic / event: ${brief.topic}
Platform: ${brief.platform}
Key facts:
${brief.facts}
CTA: ${brief.cta}
Spice level (1-5): ${brief.spice}
Hashtag rules: ${tagInstruction}

Generate three caption variants in three different angles. Each one must
pass the voice tests. Output the delimited blocks only.`;

  return streamModelToResponse({
    system: CAPTIONS_SYSTEM + voiceBlock + sourceBlock,
    user: userMessage,
    maxTokens: 2000,
  });
}
