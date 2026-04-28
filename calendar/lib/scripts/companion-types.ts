import type { ScriptBrand } from "./types";

// ---------------------------------------------------------------------------
// Brief shapes (what the user fills in; what gets sent to /api/scripts/...)
// ---------------------------------------------------------------------------

export type CaptionsPlatform = "Instagram" | "TikTok" | "Both";

export type CaptionsBrief = {
  profile_id: string | null;
  event_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand;
  brand_other?: string;
  topic: string;
  facts: string;
  cta: string;
  platform: CaptionsPlatform;
  hashtag_count: 0 | 3 | 5;
  spice: 1 | 2 | 3 | 4 | 5;
};

export type EmailBrief = {
  profile_id: string | null;
  event_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand;
  brand_other?: string;
  topic: string;
  facts: string;
  cta: string;
  cta_url?: string;
  audience: "Members" | "First-timers" | "All subscribers";
  spice: 1 | 2 | 3 | 4 | 5;
};

export type SmsBrief = {
  profile_id: string | null;
  event_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand;
  brand_other?: string;
  topic: string;
  facts: string;
  cta: string;
  spice: 1 | 2 | 3 | 4 | 5;
};

// ---------------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------------

export type CaptionVariant = {
  name: string;
  angle: string;
  caption: string;
  hashtags: string;
};

export type EmailOutput = {
  subject: string;
  preheader: string;
  body: string;
};

export type SmsVariant = {
  name: string;
  angle: string;
  sms: string;
  char_count: number;
};

// ---------------------------------------------------------------------------
// Persisted DB rows
// ---------------------------------------------------------------------------

export type GeneratedCaptions = {
  id: string;
  event_id: string | null;
  profile_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand | null;
  topic: string | null;
  brief_json: CaptionsBrief | null;
  variants_json: CaptionVariant[];
  created_at: string;
};

export type GeneratedEmail = {
  id: string;
  event_id: string | null;
  profile_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand | null;
  topic: string | null;
  brief_json: EmailBrief | null;
  output_json: EmailOutput;
  created_at: string;
};

export type GeneratedSms = {
  id: string;
  event_id: string | null;
  profile_id: string | null;
  source_script_id: string | null;
  brand: ScriptBrand | null;
  topic: string | null;
  brief_json: SmsBrief | null;
  variants_json: SmsVariant[];
  created_at: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CAPTIONS_PLATFORMS: CaptionsPlatform[] = [
  "Instagram",
  "TikTok",
  "Both",
];

export const HASHTAG_COUNTS: { value: 0 | 3 | 5; label: string }[] = [
  { value: 0, label: "None" },
  { value: 3, label: "3 tags" },
  { value: 5, label: "5 tags" },
];

export const EMAIL_AUDIENCES: EmailBrief["audience"][] = [
  "Members",
  "First-timers",
  "All subscribers",
];

export const SMS_CHAR_LIMIT = 160;

// Delimiters live here (rather than companion-prompts.ts which is
// server-only) so client streaming parsers can import them safely.
export const CAPTIONS_DELIMITER = "<<<END_CAPTION>>>";
export const EMAIL_DELIMITER = "<<<END_EMAIL>>>";
export const SMS_DELIMITER = "<<<END_SMS>>>";
