import { NextResponse } from "next/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { SMS_SYSTEM } from "@/lib/scripts/companion-prompts";
import {
  loadSourceScriptBlock,
  loadVoiceBlock,
  streamModelToResponse,
} from "@/lib/scripts/companion-stream";
import type { SmsBrief } from "@/lib/scripts/companion-types";

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

  let brief: SmsBrief;
  try {
    brief = (await req.json()) as SmsBrief;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const voiceBlock = await loadVoiceBlock(brief.profile_id);
  const sourceBlock = await loadSourceScriptBlock(brief.source_script_id);

  const brandLabel =
    brief.brand === "Other" && brief.brand_other
      ? `Other (${brief.brand_other})`
      : brief.brand;

  const userMessage = `BRIEF
Brand: ${brandLabel}
Topic / event: ${brief.topic}
Key facts:
${brief.facts}
CTA: ${brief.cta}
Spice level (1-5): ${brief.spice}

Generate three SMS variants. Each ≤160 characters including any link or
shortcode. Output the delimited blocks only.`;

  return streamModelToResponse({
    system: SMS_SYSTEM + voiceBlock + sourceBlock,
    user: userMessage,
    maxTokens: 1200,
  });
}
