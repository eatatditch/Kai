import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AllowlistEntry = {
  email: string;
  createdAt: string;
};

export async function fetchAllowlist(): Promise<AllowlistEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("allowlist")
    .select("email, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    email: row.email as string,
    createdAt: row.created_at as string,
  }));
}

export async function isEmailAllowlisted(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("allowlist")
    .select("email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) return false;
  return data !== null;
}
