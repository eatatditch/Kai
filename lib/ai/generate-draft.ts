import "server-only";

import {
  formatAnthropicError,
  getAnthropicClient,
  getModelCandidates,
  isModelNotFoundError,
  isRetryableAnthropicError,
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
  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    const isLastModel = i === models.length - 1;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
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
        if (isRetryableAnthropicError(err) && attempt < 2) {
          continue;
        }
        if (!isModelNotFoundError(err) || isLastModel) {
          throw new Error(formatAnthropicError(err));
        }
        break;
      }
    }
  }

  throw new Error(formatAnthropicError(finalError));
}
