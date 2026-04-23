import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";

let cached: Anthropic | undefined;

/**
 * Anthropic SDK instance. Server-only — the API key never touches the browser.
 */
export function anthropic(): Anthropic {
  if (cached) return cached;
  const env = serverEnv();
  cached = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cached;
}
