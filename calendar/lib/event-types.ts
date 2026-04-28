import type { CategoryDef, EventType } from "@/types";

export const EVENT_TYPES: EventType[] = [
  { id: "photo_shoot",     emoji: "📸", label: "Photo Shoot",         cat: "shoot" },
  { id: "video_shoot",     emoji: "🎥", label: "Video Shoot",         cat: "shoot" },
  { id: "ig_post",         emoji: "📷", label: "Instagram Post",      cat: "social" },
  { id: "ig_reel",         emoji: "🎬", label: "Instagram Reel",      cat: "social" },
  { id: "ig_story",        emoji: "📱", label: "Instagram Story",     cat: "social" },
  { id: "tiktok_post",     emoji: "🎵", label: "TikTok",              cat: "social" },
  { id: "fb_post",         emoji: "👍", label: "Facebook Post",       cat: "social" },
  { id: "yt_post",         emoji: "▶️",  label: "YouTube",             cat: "social" },
  { id: "pin_post",        emoji: "📌", label: "Pinterest Pin",       cat: "social" },
  { id: "li_post",         emoji: "💼", label: "LinkedIn Post",       cat: "social" },
  { id: "x_post",          emoji: "✖️",  label: "X / Twitter",         cat: "social" },
  { id: "email",           emoji: "📧", label: "Email Campaign",      cat: "comms" },
  { id: "sms",             emoji: "💬", label: "SMS Blast",           cat: "comms" },
  { id: "push",            emoji: "🔔", label: "Push Notification",   cat: "comms" },
  { id: "meeting",         emoji: "🤝", label: "Meeting",             cat: "meeting" },
  { id: "event",           emoji: "🎪", label: "Event / Activation",  cat: "event" },
  { id: "burger_night",    emoji: "🍔", label: "Burger Night",        cat: "event" },
  { id: "happy_hour",      emoji: "🍹", label: "Happy Hour",          cat: "event" },
  { id: "live_music",      emoji: "🎤", label: "Live Music",          cat: "event" },
  { id: "margarita_class", emoji: "🥃", label: "Margarita Class",     cat: "event" },
  { id: "brunch",          emoji: "🥑", label: "Brunch Service",      cat: "event" },
  { id: "private_event",   emoji: "🎉", label: "Private Event",       cat: "event" },
  { id: "blog",            emoji: "📝", label: "Blog Post",           cat: "comms" },
  { id: "design",          emoji: "🎨", label: "Design / Creative",   cat: "other" },
  { id: "promo",           emoji: "🎟️", label: "Promo / Sale",         cat: "comms" },
  { id: "analytics",       emoji: "📊", label: "Analytics Review",    cat: "meeting" },
  { id: "launch",          emoji: "🚀", label: "Launch",              cat: "event" },
  { id: "influencer",      emoji: "⭐", label: "Influencer / UGC",     cat: "social" },
  { id: "ad_campaign",     emoji: "📣", label: "Ad Campaign",         cat: "comms" },
  { id: "deadline",        emoji: "⏰", label: "Deadline",             cat: "other" },
  { id: "review",          emoji: "✅", label: "Approval / Review",   cat: "meeting" },
  { id: "other",           emoji: "🌊", label: "Other",               cat: "other" },
];

export const CATEGORIES: CategoryDef[] = [
  { id: "shoot",   label: "Shoots",   color: "#cd6028" },
  { id: "social",  label: "Social",   color: "#325269" },
  { id: "comms",   label: "Comms",    color: "#547352" },
  { id: "event",   label: "Events",   color: "#c44a1f" },
  { id: "meeting", label: "Meetings", color: "#6a4d8c" },
  { id: "other",   label: "Other",    color: "#6c7780" },
];

const FALLBACK = EVENT_TYPES[EVENT_TYPES.length - 1];

export function getType(id: string): EventType {
  return EVENT_TYPES.find((t) => t.id === id) ?? FALLBACK;
}

// Event types eligible for AI script generation. Anything in `comms` plus
// IG Reels and YouTube. Matches the user's V2 scope.
const SCRIPTABLE_TYPE_IDS = new Set<string>([
  "ig_reel",
  "yt_post",
  "email",
  "sms",
  "push",
  "blog",
  "promo",
  "ad_campaign",
]);

export function isScriptableEventType(typeId: string): boolean {
  return SCRIPTABLE_TYPE_IDS.has(typeId);
}
