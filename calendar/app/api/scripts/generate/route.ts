import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { BASE_SYSTEM_PROMPT, SCRIPT_MODEL } from "@/lib/scripts/prompts";
import type {
  GenerateResponse,
  ScriptBrief,
  ScriptVariant,
} from "@/lib/scripts/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonExtract(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object in model output.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  const auth = await requireAllowlistedUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Not signed in" : "Not authorized" },
      { status: auth.status },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let brief: ScriptBrief;
  try {
    brief = (await req.json()) as ScriptBrief;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let voiceBlock = "";
  if (brief.profile_id) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("voice_profiles")
      .select("name, brand, profile_json")
      .eq("id", brief.profile_id)
      .maybeSingle();

    const { data: refs } = await supabase
      .from("reference_scripts")
      .select("title, content")
      .eq("profile_id", brief.profile_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (profile && profile.profile_json) {
      const refList = (refs ?? [])
        .map(
          (r, i) =>
            `### Reference ${i + 1}: ${r.title}\n\n${r.content}`,
        )
        .join("\n\n");

      voiceBlock = `

---

VOICE PROFILE OVERRIDE

You are writing in a specific writer's voice. Their profile:

${JSON.stringify(profile.profile_json, null, 2)}

When the base rules conflict with this profile, the profile wins for
stylistic choices (vocabulary, cadence, signature moves). The base rules
on output format (JSON, three variants, contrasting angles) still apply.

---

REFERENCE SCRIPTS (read these. match this voice.)

${refList}

---

Match the voice profile and the reference scripts. Do not copy lines
verbatim from references — match the structure, cadence, and vocabulary
signatures.
`;
    }
  }

  const fullSystem = BASE_SYSTEM_PROMPT + voiceBlock;

  const isRegen = typeof brief.regenerate_index === "number";
  const variantInstruction = isRegen
    ? `Regenerate ONLY ONE variant (the one at index ${brief.regenerate_index}).
Return JSON in the same shape, but with exactly ONE entry in "variants".
The new variant's angle must differ from these existing angles, and from
each other in tone or structure:
${(brief.avoid_angles ?? []).map((a) => `- ${a}`).join("\n") || "(none provided)"}`
    : `Generate three variants. The three variants must take three different angles.`;

  const brandLabel =
    brief.brand === "Other" && brief.brand_other
      ? `Other (${brief.brand_other})`
      : brief.brand;

  const userMessage = `BRIEF
Brand: ${brandLabel}
Topic / event: ${brief.topic}
Length target: ${brief.length}
Platform: ${brief.platform}
Key facts:
${brief.facts}
CTA: ${brief.cta}
Reference vibe: ${brief.reference || "n/a"}
Spice level (1-5): ${brief.spice}
Lock-in: ${brief.lockin || "n/a"}

${variantInstruction}
Return JSON only.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: SCRIPT_MODEL,
      max_tokens: 4096,
      system: fullSystem,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const parsed = safeJsonExtract(text) as GenerateResponse;
    if (!Array.isArray(parsed.variants)) {
      throw new Error("Model output missing variants array.");
    }

    const variants: ScriptVariant[] = parsed.variants.map((v) => ({
      name: String(v.name ?? ""),
      angle: String(v.angle ?? ""),
      script: String(v.script ?? ""),
      runtime_estimate_seconds: Number(v.runtime_estimate_seconds ?? 0) || 0,
    }));

    return NextResponse.json({ variants });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
