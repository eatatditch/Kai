import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { BASE_SYSTEM_PROMPT, SCRIPT_MODEL } from "@/lib/scripts/prompts";
import type { ScriptBrief } from "@/lib/scripts/types";

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
on output format (delimited NAME/ANGLE/RUNTIME/SCRIPT blocks) still apply.

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
  const isAngleLock =
    typeof brief.lock_angle === "object" && brief.lock_angle !== null;

  let variantInstruction: string;
  if (isAngleLock && brief.lock_angle) {
    variantInstruction = `Generate THREE variants. All three must use this exact angle:

NAME: ${brief.lock_angle.name}
ANGLE: ${brief.lock_angle.angle}

Keep the angle name and the angle description identical across all three.
The three scripts must differ in their cadence, beat structure, word
choices, and which mundane details they pull from the brief. They are
three drafts of the SAME angle, not three drafts of the same script.`;
  } else if (isRegen) {
    variantInstruction = `Regenerate ONLY ONE variant. Output exactly ONE delimited block.
The new variant's angle must differ from these existing angles, and from
each other in tone or structure:
${(brief.avoid_angles ?? []).map((a) => `- ${a}`).join("\n") || "(none provided)"}`;
  } else {
    variantInstruction =
      "Generate three variants. The three variants must take three different angles.";
  }

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

Output the delimited blocks only. No prose around them.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: SCRIPT_MODEL,
          max_tokens: 4096,
          system: fullSystem,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n[stream-error] ${msg}\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
