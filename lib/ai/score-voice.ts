import "server-only";

import { getAnthropicClient, MODEL_SCORING } from "./anthropic";
import {
  buildScoreUserMessage,
  buildScorerSystem,
} from "./prompts";

import type { ContentFormat } from "@/types/database";

export type VoiceIssue = {
  severity: "high" | "medium" | "low";
  category: "tone" | "vocabulary" | "format" | "factual" | "other";
  message: string;
  quote?: string;
  suggestion?: string;
};

export type VoiceScoreResult = {
  score: number;
  summary: string;
  issues: VoiceIssue[];
};

const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "integer",
      description: "Overall voice match score from 0 to 100.",
    },
    summary: {
      type: "string",
      description:
        "One-sentence overall assessment of the draft's brand voice match.",
    },
    issues: {
      type: "array",
      description:
        "Specific problems with the draft. Empty array if it's clean.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          category: {
            type: "string",
            enum: ["tone", "vocabulary", "format", "factual", "other"],
          },
          message: { type: "string" },
          quote: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["severity", "category", "message"],
      },
    },
  },
  required: ["score", "summary", "issues"],
} as const;

type RawScore = {
  score: number;
  summary: string;
  issues: VoiceIssue[];
};

export async function scoreVoice(args: {
  draft: string;
  format: ContentFormat;
  voiceRulesMarkdown: string;
}): Promise<VoiceScoreResult> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: MODEL_SCORING,
    max_tokens: 2048,
    system: buildScorerSystem(args.voiceRulesMarkdown),
    output_config: {
      format: { type: "json_schema", schema: SCORE_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: buildScoreUserMessage(args.draft, args.format),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Voice scorer returned no text content");
  }

  const parsed = JSON.parse(textBlock.text) as RawScore;
  return {
    score: clampScore(parsed.score),
    summary: parsed.summary,
    issues: parsed.issues ?? [],
  };
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
