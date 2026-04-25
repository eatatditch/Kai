import type { ContentFormat } from "@/types/database";

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  instagram_caption: "Instagram caption",
  tiktok_caption: "TikTok caption",
  email_subject: "Email subject line",
  email_body: "Email body",
  ad_script: "Ad script (15s read)",
  series_script: "Series script scene",
};
