import "server-only";

import {
  getAnthropicClient,
  getModelCandidates,
  isModelNotFoundError,
  MODEL_DRAFTING,
} from "./anthropic";
import {
  buildDraftUserMessage,
  buildDrafterSystem,
  type SeriesContext,
} from "./prompts";

import type { ContentFormat } from "@/types/database";

export type GenerateDraftResult = {
  body: string;
  model: string;
  thinkingUsed: boolean;
};

export async function generateDraft(args: {
  prompt: string;
  format: ContentFormat;
  voiceRulesMarkdown: string;
  series?: SeriesContext | null;
}): Promise<GenerateDraftResult> {
  const client = getAnthropicClient();
  const models = getModelCandidates(MODEL_DRAFTING);

  let finalError: unknown = null;
  for (const model of models) {
    try {
      // Stream so high max_tokens don't trip SDK HTTP timeouts; collect the
      // final message via .finalMessage() per shared/prompt-caching.md guidance.
      const stream = client.messages.stream({
        model,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: buildDrafterSystem(args.format, args.voiceRulesMarkdown),
        messages: [
          {
            role: "user",
            content: buildDraftUserMessage(args.prompt, args.format, args.series),
          },
        ],
      });

      const message = await stream.finalMessage();

      let body = "";
      let thinkingUsed = false;
      for (const block of message.content) {
        if (block.type === "text") {
          body += block.text;
        } else if (block.type === "thinking") {
          thinkingUsed = true;
        }
      }

      return {
        body: body.trim(),
        model,
        thinkingUsed,
      };
    } catch (err) {
      finalError = err;
      if (!isModelNotFoundError(err) || model === models.at(-1)) {
        throw err;
      }
    }
  }

  throw finalError ?? new Error("Draft generation failed.");
}
