import { NextResponse } from "next/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { EMAIL_SYSTEM } from "@/lib/scripts/companion-prompts";
import {
  loadSourceScriptBlock,
  loadVoiceBlock,
  streamModelToResponse,
} from "@/lib/scripts/companion-stream";
import type { EmailBrief } from "@/lib/scripts/companion-types";

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

  let brief: EmailBrief;
  try {
    brief = (await req.json()) as EmailBrief;
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
Audience: ${brief.audience}
Key facts:
${brief.facts}
CTA copy: ${brief.cta}
CTA URL: ${brief.cta_url || "(none — leave URL line out)"}
Spice level (1-5): ${brief.spice}

Write one email. Subject + Preheader + Body. Output the delimited block only.`;

  return streamModelToResponse({
    system: EMAIL_SYSTEM + voiceBlock + sourceBlock,
    user: userMessage,
    maxTokens: 2500,
  });
}
