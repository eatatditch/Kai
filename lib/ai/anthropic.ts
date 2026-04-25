import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Models per CLAUDE.md:
 *   - DRAFTING: Sonnet 4.6 (better quality, voice-sensitive)
 *   - SCORING / classification: Haiku 4.5 (fast + cheap)
 */
export const MODEL_DRAFTING = "claude-sonnet-4-6" as const;
export const MODEL_SCORING = "claude-haiku-4-5" as const;

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your environment.",
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}
