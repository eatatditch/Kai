/**
 * Claude model IDs used in this app. Centralized so model upgrades happen in
 * one place.
 *
 * - DRAFTING: used for caption/email/script generation and anything requiring
 *   strong brand-voice fidelity.
 * - LIGHTWEIGHT: used for voice scoring, tag extraction, and other
 *   classification/triage tasks where Sonnet would be overkill.
 */
export const CLAUDE_MODELS = {
  DRAFTING: "claude-sonnet-4-6",
  LIGHTWEIGHT: "claude-haiku-4-5",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];
