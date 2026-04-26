import "server-only";

import {
  getAnthropicClient,
  getModelCandidates,
  isModelNotFoundError,
  MODEL_SCORING,
} from "./anthropic";
import {
  buildDrafterSystem,
  buildIdeationUserMessage,
  type SeriesContext,
} from "./prompts";

import type { ContentFormat } from "@/types/database";

export type GenerateIdeasResult = {
  ideas: string[];
  model: string;
};

const IDEAS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      items: { type: "string" },
      description: "Each idea is one sentence — a concrete brief the team can use.",
    },
  },
  required: ["ideas"],
} as const;

export async function generateIdeas(args: {
  brandName: string;
  format: ContentFormat;
  voiceRulesMarkdown: string;
  series?: SeriesContext | null;
  hint?: string | null;
  count?: number;
}): Promise<GenerateIdeasResult> {
  const client = getAnthropicClient();
  const count = args.count ?? 6;
  const models = getModelCandidates(MODEL_SCORING);

  let finalError: unknown = null;
  for (const model of models) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        system: buildDrafterSystem(args.format, args.voiceRulesMarkdown),
        output_config: {
          format: { type: "json_schema", schema: IDEAS_SCHEMA },
        },
        messages: [
          {
            role: "user",
            content: buildIdeationUserMessage({
              brandName: args.brandName,
              series: args.series,
              hint: args.hint,
              count,
            }),
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Ideation returned no text content");
      }

      const parsed = JSON.parse(textBlock.text) as { ideas: string[] };
      return {
        ideas: parsed.ideas ?? [],
        model,
      };
    } catch (err) {
      finalError = err;
      if (!isModelNotFoundError(err) || model === models.at(-1)) {
        throw err;
      }
    }
  }

  throw finalError ?? new Error("Ideation failed.");
}
