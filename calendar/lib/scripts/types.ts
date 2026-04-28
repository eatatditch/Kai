export type ScriptBrand = "Ditch" | "Swell Surf Co." | "Other";

export type ScriptLength = ":15" | ":30" | ":60" | ":90";

export type ScriptPlatform =
  | "IG Reel / TikTok"
  | "YouTube pre-roll"
  | "Connected TV"
  | "All";

export type ReferenceVibe =
  | "Aviation Gin"
  | "Mint Mobile"
  | "Dollar Shave Club launch"
  | "Squarespace Keanu"
  | "Cards Against Humanity press release";

export type ScriptBrief = {
  profile_id: string | null;
  brand: ScriptBrand;
  brand_other?: string;
  topic: string;
  length: ScriptLength;
  platform: ScriptPlatform;
  facts: string;
  cta: string;
  reference?: ReferenceVibe | "";
  spice: 1 | 2 | 3 | 4 | 5;
  lockin?: string;
  regenerate_index?: number;
  avoid_angles?: string[];
  lock_angle?: { name: string; angle: string };
};

export type ScriptVariant = {
  name: string;
  angle: string;
  script: string;
  runtime_estimate_seconds: number;
};

export type GenerateResponse = {
  variants: ScriptVariant[];
};

export type VoiceProfileJson = {
  voice_summary: string;
  signature_moves: string[];
  vocabulary_signatures: string[];
  banned_words: string[];
  cadence_notes: string;
  tonal_anchors: string[];
  format_tics: string[];
  do_not_imitate: string[];
};

export type VoiceProfile = {
  id: string;
  name: string;
  brand: ScriptBrand | null;
  profile_json: VoiceProfileJson | null;
  created_at: string;
  updated_at: string;
};

export type VoiceProfileSummary = VoiceProfile & {
  reference_count: number;
};

export type ReferenceScript = {
  id: string;
  profile_id: string;
  title: string;
  source_format: "paste" | "txt" | "md" | "pdf" | "docx";
  content: string;
  created_at: string;
};

export type GeneratedScript = {
  id: string;
  profile_id: string | null;
  brand: ScriptBrand | null;
  topic: string | null;
  length: ScriptLength | null;
  brief_json: ScriptBrief | null;
  variants_json: ScriptVariant[];
  created_at: string;
};

export const SCRIPT_BRANDS: ScriptBrand[] = ["Ditch", "Swell Surf Co.", "Other"];

export const SCRIPT_LENGTHS: ScriptLength[] = [":15", ":30", ":60", ":90"];

export const SCRIPT_PLATFORMS: ScriptPlatform[] = [
  "IG Reel / TikTok",
  "YouTube pre-roll",
  "Connected TV",
  "All",
];

export const REFERENCE_VIBES: ReferenceVibe[] = [
  "Aviation Gin",
  "Mint Mobile",
  "Dollar Shave Club launch",
  "Squarespace Keanu",
  "Cards Against Humanity press release",
];

export const EMPTY_PROFILE: VoiceProfileJson = {
  voice_summary: "",
  signature_moves: [],
  vocabulary_signatures: [],
  banned_words: [],
  cadence_notes: "",
  tonal_anchors: [],
  format_tics: [],
  do_not_imitate: [],
};
