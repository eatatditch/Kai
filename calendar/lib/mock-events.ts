import type { CalendarEvent } from "@/types";

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: "m1",  date: "2026-05-01", type: "burger_night",    title: "Burger Night",                time: "18:00" },
  { id: "m2",  date: "2026-05-02", type: "ig_reel",         title: "Burger Night recap reel" },
  { id: "m3",  date: "2026-05-05", type: "photo_shoot",     title: "Brunch menu shoot",            time: "09:30" },
  { id: "m4",  date: "2026-05-07", type: "email",           title: "May newsletter",               time: "10:00" },
  { id: "m5",  date: "2026-05-08", type: "happy_hour",      title: "Happy Hour kickoff",           time: "16:00" },
  { id: "m6",  date: "2026-05-10", type: "brunch",          title: "Mother's Day Brunch",          time: "10:00" },
  { id: "m7",  date: "2026-05-10", type: "live_music",      title: "Acoustic set",                 time: "19:30" },
  { id: "m8",  date: "2026-05-10", type: "ig_story",        title: "Behind the bar" },
  { id: "m9",  date: "2026-05-10", type: "launch",          title: "New cocktail launch" },
  { id: "m10", date: "2026-05-10", type: "promo",           title: "20% off shareables" },
  { id: "m11", date: "2026-05-12", type: "meeting",         title: "Weekly marketing sync",        time: "14:00" },
  { id: "m12", date: "2026-05-15", type: "ad_campaign",     title: "Summer ad flight" },
  { id: "m13", date: "2026-05-18", type: "video_shoot",     title: "Margarita class B-roll",       time: "15:00" },
  { id: "m14", date: "2026-05-20", type: "margarita_class", title: "Margarita Class",              time: "18:30" },
  { id: "m15", date: "2026-05-22", type: "tiktok_post",     title: "Behind the scenes" },
  { id: "m16", date: "2026-05-25", type: "deadline",        title: "Approve June creative" },
  { id: "m17", date: "2026-05-28", type: "private_event",   title: "Anniversary party",            time: "19:00" },
  { id: "m18", date: "2026-05-30", type: "design",          title: "Summer menu design review" },
];
