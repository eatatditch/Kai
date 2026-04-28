import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SCRIPT_MODEL } from "./prompts";

/**
 * Pipe an Anthropic streaming completion into a chunked text Response.
 * Used by the companion API routes (captions, email, SMS) and the script
 * generator. The route is responsible for assembling system + user prompts
 * and surfacing auth errors.
 */
export function streamModelToResponse(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Response {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not configured.", {
      status: 500,
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: SCRIPT_MODEL,
          max_tokens: opts.maxTokens ?? 3000,
          system: opts.system,
          messages: [{ role: "user", content: opts.user }],
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

/** Build the optional voice-profile augmentation block for companion prompts. */
export async function loadVoiceBlock(
  profileId: string | null,
): Promise<string> {
  if (!profileId) return "";
  // Inline import to keep this file usable from any route handler.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("voice_profiles")
    .select("name, brand, profile_json")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile || !profile.profile_json) return "";

  const { data: refs } = await supabase
    .from("reference_scripts")
    .select("title, content")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(3);

  const refList = (refs ?? [])
    .map((r, i) => `### Reference ${i + 1}: ${r.title}\n\n${r.content}`)
    .join("\n\n");

  return `

---

VOICE PROFILE OVERRIDE

Match this writer's voice. Profile:

${JSON.stringify(profile.profile_json, null, 2)}

REFERENCE EXAMPLES (do not copy verbatim, match cadence + vocabulary):

${refList}

When base rules conflict with this profile, the profile wins for stylistic
choices. Output format requirements still apply.
`;
}

/** Build the optional source-script context block for companion prompts. */
export async function loadSourceScriptBlock(
  scriptId: string | null,
): Promise<string> {
  if (!scriptId) return "";
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("generated_scripts")
    .select("topic, brief_json, variants_json")
    .eq("id", scriptId)
    .maybeSingle();
  if (!row) return "";

  const variants = (row.variants_json as
    | { name?: string; script?: string }[]
    | null) ?? [];
  const first = variants[0];

  return `

---

SOURCE SCRIPT (the user already has this video script — match its tone
and key beats; this companion piece is the cross-channel echo):

Topic: ${row.topic ?? "—"}
${first?.script ? `\nFirst variant script:\n${first.script}\n` : ""}
`;
}
