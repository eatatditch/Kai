import { createClient } from "@/lib/supabase/client";
import type {
  CaptionsBrief,
  CaptionVariant,
  EmailBrief,
  EmailOutput,
  GeneratedCaptions,
  GeneratedEmail,
  GeneratedSms,
  SmsBrief,
  SmsVariant,
} from "./companion-types";

const CAPTIONS_COLS =
  "id, event_id, profile_id, source_script_id, brand, topic, brief_json, variants_json, created_at";
const EMAIL_COLS =
  "id, event_id, profile_id, source_script_id, brand, topic, brief_json, output_json, created_at";
const SMS_COLS = CAPTIONS_COLS;

// ---------------------------------------------------------------------------
// Captions
// ---------------------------------------------------------------------------

export async function saveGeneratedCaptions(input: {
  event_id?: string | null;
  profile_id: string | null;
  source_script_id?: string | null;
  brand: string | null;
  topic: string;
  brief_json: CaptionsBrief;
  variants_json: CaptionVariant[];
}): Promise<GeneratedCaptions> {
  const supabase = createClient();
  const payload = {
    event_id: input.event_id ?? null,
    profile_id: input.profile_id,
    source_script_id: input.source_script_id ?? null,
    brand: input.brand,
    topic: input.topic,
    brief_json: input.brief_json,
    variants_json: input.variants_json,
  };
  const { data, error } = await supabase
    .from("generated_captions")
    .insert(payload)
    .select(CAPTIONS_COLS)
    .single();
  if (error) throw error;
  return data as unknown as GeneratedCaptions;
}

export async function fetchCaptionsForEvent(
  eventId: string,
): Promise<GeneratedCaptions[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_captions")
    .select(CAPTIONS_COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GeneratedCaptions[];
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export async function saveGeneratedEmail(input: {
  event_id?: string | null;
  profile_id: string | null;
  source_script_id?: string | null;
  brand: string | null;
  topic: string;
  brief_json: EmailBrief;
  output_json: EmailOutput;
}): Promise<GeneratedEmail> {
  const supabase = createClient();
  const payload = {
    event_id: input.event_id ?? null,
    profile_id: input.profile_id,
    source_script_id: input.source_script_id ?? null,
    brand: input.brand,
    topic: input.topic,
    brief_json: input.brief_json,
    output_json: input.output_json,
  };
  const { data, error } = await supabase
    .from("generated_emails")
    .insert(payload)
    .select(EMAIL_COLS)
    .single();
  if (error) throw error;
  return data as unknown as GeneratedEmail;
}

export async function fetchEmailsForEvent(
  eventId: string,
): Promise<GeneratedEmail[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_emails")
    .select(EMAIL_COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GeneratedEmail[];
}

// ---------------------------------------------------------------------------
// SMS
// ---------------------------------------------------------------------------

export async function saveGeneratedSms(input: {
  event_id?: string | null;
  profile_id: string | null;
  source_script_id?: string | null;
  brand: string | null;
  topic: string;
  brief_json: SmsBrief;
  variants_json: SmsVariant[];
}): Promise<GeneratedSms> {
  const supabase = createClient();
  const payload = {
    event_id: input.event_id ?? null,
    profile_id: input.profile_id,
    source_script_id: input.source_script_id ?? null,
    brand: input.brand,
    topic: input.topic,
    brief_json: input.brief_json,
    variants_json: input.variants_json,
  };
  const { data, error } = await supabase
    .from("generated_sms")
    .insert(payload)
    .select(SMS_COLS)
    .single();
  if (error) throw error;
  return data as unknown as GeneratedSms;
}

export async function fetchSmsForEvent(
  eventId: string,
): Promise<GeneratedSms[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_sms")
    .select(SMS_COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GeneratedSms[];
}

// ---------------------------------------------------------------------------
// Combined event id sets (for calendar pill 📝 across all output types)
// ---------------------------------------------------------------------------

export async function fetchEventIdsWithCompanions(): Promise<Set<string>> {
  const supabase = createClient();
  const [captions, emails, sms] = await Promise.all([
    supabase.from("generated_captions").select("event_id").not("event_id", "is", null),
    supabase.from("generated_emails").select("event_id").not("event_id", "is", null),
    supabase.from("generated_sms").select("event_id").not("event_id", "is", null),
  ]);
  const set = new Set<string>();
  for (const res of [captions, emails, sms]) {
    if (res.error) continue;
    for (const row of res.data ?? []) {
      const id = (row as { event_id: string | null }).event_id;
      if (id) set.add(id);
    }
  }
  return set;
}
