import { createClient } from "@/lib/supabase/client";
import type {
  GeneratedScript,
  ReferenceScript,
  ScriptBrief,
  ScriptVariant,
  VoiceProfile,
  VoiceProfileJson,
  VoiceProfileSummary,
} from "./types";

type DbVoiceProfile = {
  id: string;
  name: string;
  brand: string | null;
  profile_json: VoiceProfileJson | null;
  created_at: string;
  updated_at: string;
};

type DbReferenceScript = {
  id: string;
  profile_id: string;
  title: string;
  source_format: string;
  content: string;
  created_at: string;
};

type DbGeneratedScript = {
  id: string;
  profile_id: string | null;
  brand: string | null;
  topic: string | null;
  length: string | null;
  brief_json: ScriptBrief | null;
  variants_json: ScriptVariant[];
  created_at: string;
};

function fromVoiceProfileRow(row: DbVoiceProfile): VoiceProfile {
  return {
    id: row.id,
    name: row.name,
    brand: (row.brand as VoiceProfile["brand"]) ?? null,
    profile_json: row.profile_json ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function fromReferenceRow(row: DbReferenceScript): ReferenceScript {
  return {
    id: row.id,
    profile_id: row.profile_id,
    title: row.title,
    source_format: row.source_format as ReferenceScript["source_format"],
    content: row.content,
    created_at: row.created_at,
  };
}

function fromGeneratedRow(row: DbGeneratedScript): GeneratedScript {
  return {
    id: row.id,
    profile_id: row.profile_id,
    brand: (row.brand as GeneratedScript["brand"]) ?? null,
    topic: row.topic,
    length: (row.length as GeneratedScript["length"]) ?? null,
    brief_json: row.brief_json,
    variants_json: row.variants_json ?? [],
    created_at: row.created_at,
  };
}

export async function fetchVoiceProfiles(): Promise<VoiceProfileSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("voice_profiles")
    .select(
      "id, name, brand, profile_json, created_at, updated_at, reference_scripts(count)",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const refs = (row as unknown as { reference_scripts: { count: number }[] })
      .reference_scripts;
    return {
      ...fromVoiceProfileRow(row as DbVoiceProfile),
      reference_count: refs?.[0]?.count ?? 0,
    };
  });
}

export async function fetchVoiceProfile(
  id: string,
): Promise<{ profile: VoiceProfile; references: ReferenceScript[] } | null> {
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("voice_profiles")
    .select("id, name, brand, profile_json, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const { data: refs, error: refErr } = await supabase
    .from("reference_scripts")
    .select("id, profile_id, title, source_format, content, created_at")
    .eq("profile_id", id)
    .order("created_at", { ascending: false });
  if (refErr) throw refErr;
  return {
    profile: fromVoiceProfileRow(profile as DbVoiceProfile),
    references: (refs ?? []).map((r) => fromReferenceRow(r as DbReferenceScript)),
  };
}

export async function upsertVoiceProfile(input: {
  id?: string;
  name: string;
  brand: string | null;
  profile_json: VoiceProfileJson | null;
}): Promise<VoiceProfile> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    name: input.name,
    brand: input.brand,
    profile_json: input.profile_json,
    updated_at: new Date().toISOString(),
  };
  if (input.id) payload.id = input.id;
  const { data, error } = await supabase
    .from("voice_profiles")
    .upsert(payload)
    .select("id, name, brand, profile_json, created_at, updated_at")
    .single();
  if (error) throw error;
  return fromVoiceProfileRow(data as DbVoiceProfile);
}

export async function deleteVoiceProfile(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("voice_profiles").delete().eq("id", id);
  if (error) throw error;
}

export async function insertReferenceScripts(
  profileId: string,
  refs: { title: string; source_format: string; content: string }[],
): Promise<ReferenceScript[]> {
  if (refs.length === 0) return [];
  const supabase = createClient();
  const payload = refs.map((r) => ({
    profile_id: profileId,
    title: r.title,
    source_format: r.source_format,
    content: r.content,
  }));
  const { data, error } = await supabase
    .from("reference_scripts")
    .insert(payload)
    .select("id, profile_id, title, source_format, content, created_at");
  if (error) throw error;
  return (data ?? []).map((r) => fromReferenceRow(r as DbReferenceScript));
}

export async function deleteReferenceScript(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reference_scripts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateReferenceScript(
  id: string,
  patch: { title?: string; content?: string },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reference_scripts")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchGeneratedScripts(): Promise<GeneratedScript[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_scripts")
    .select(
      "id, profile_id, brand, topic, length, brief_json, variants_json, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => fromGeneratedRow(r as DbGeneratedScript));
}

export async function saveGeneratedScript(input: {
  profile_id: string | null;
  brand: string | null;
  topic: string;
  length: string;
  brief_json: ScriptBrief;
  variants_json: ScriptVariant[];
}): Promise<GeneratedScript> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_scripts")
    .insert(input)
    .select(
      "id, profile_id, brand, topic, length, brief_json, variants_json, created_at",
    )
    .single();
  if (error) throw error;
  return fromGeneratedRow(data as DbGeneratedScript);
}

export async function deleteGeneratedScript(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("generated_scripts")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
