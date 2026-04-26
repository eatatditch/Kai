import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Models per CLAUDE.md:
 *   - DRAFTING: Sonnet 4.6 (better quality, voice-sensitive)
 *   - SCORING / classification: Haiku 4.5 (fast + cheap)
 */
export const MODEL_DRAFTING = "claude-sonnet-4-6" as const;
export const MODEL_SCORING = "claude-haiku-4-5" as const;

const MODEL_FALLBACKS = {
  [MODEL_DRAFTING]: ["claude-sonnet-4-20250514"],
  [MODEL_SCORING]: ["claude-haiku-4-5-20251001"],
} as const;

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

export function getModelCandidates(
  primary: typeof MODEL_DRAFTING | typeof MODEL_SCORING,
): readonly string[] {
  return [primary, ...MODEL_FALLBACKS[primary]];
}

export function isModelNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const maybe = err as Error & { status?: number; name?: string };
  return maybe.status === 404 || maybe.name === "NotFoundError";
}

export function isRetryableAnthropicError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const maybe = err as Error & { status?: number; name?: string };
  const status = maybe.status;
  if (status && [408, 409, 425, 429, 500, 502, 503, 504, 529].includes(status)) {
    return true;
  }
  return (
    maybe.name === "APIConnectionError" ||
    maybe.name === "RateLimitError" ||
    maybe.name === "InternalServerError"
  );
}

export function formatAnthropicError(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message?.trim();
    if (/^ERROR\s+\d+@E\d+$/i.test(message)) {
      return "Anthropic is temporarily unavailable. Please try again in a minute.";
    }
    if (message) return message;
  }
  return "AI request failed.";
}
