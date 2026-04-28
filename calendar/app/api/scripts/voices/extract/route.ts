import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { requireAllowlistedUser } from "@/lib/scripts/auth";
import { EXTRACTION_SYSTEM, SCRIPT_MODEL } from "@/lib/scripts/prompts";
import type { VoiceProfileJson } from "@/lib/scripts/types";

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

  let body: { scripts?: { title?: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scripts = (body.scripts ?? []).filter(
    (s) => s && typeof s.content === "string" && s.content.trim().length > 0,
  );

  if (scripts.length < 1) {
    return NextResponse.json(
      { error: "At least one reference script is required." },
      { status: 400 },
    );
  }

  const userMessage = scripts
    .map(
      (s, i) =>
        `### Reference ${i + 1}: ${s.title || `Untitled ${i + 1}`}\n\n${s.content.trim()}`,
    )
    .join("\n\n---\n\n");

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: SCRIPT_MODEL,
      max_tokens: 3000,
      system: EXTRACTION_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here are ${scripts.length} reference script(s) in this writer's voice. Produce the profile JSON.\n\n${userMessage}`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const parsed = safeJsonExtract(text) as VoiceProfileJson;
    const normalized: VoiceProfileJson = {
      voice_summary: String(parsed.voice_summary ?? ""),
      signature_moves: Array.isArray(parsed.signature_moves)
        ? parsed.signature_moves.map(String)
        : [],
      vocabulary_signatures: Array.isArray(parsed.vocabulary_signatures)
        ? parsed.vocabulary_signatures.map(String)
        : [],
      banned_words: Array.isArray(parsed.banned_words)
        ? parsed.banned_words.map(String)
        : [],
      cadence_notes: String(parsed.cadence_notes ?? ""),
      tonal_anchors: Array.isArray(parsed.tonal_anchors)
        ? parsed.tonal_anchors.map(String)
        : [],
      format_tics: Array.isArray(parsed.format_tics)
        ? parsed.format_tics.map(String)
        : [],
      do_not_imitate: Array.isArray(parsed.do_not_imitate)
        ? parsed.do_not_imitate.map(String)
        : [],
    };

    return NextResponse.json({ profile: normalized });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
