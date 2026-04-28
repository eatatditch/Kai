import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";

type AuthOk = { ok: true; userEmail: string };
type AuthFail = { ok: false; status: 401 | 403 };

export async function requireAllowlistedUser(): Promise<AuthOk | AuthFail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false, status: 401 };
  const allowed = await isEmailAllowlisted(user.email);
  if (!allowed) return { ok: false, status: 403 };
  return { ok: true, userEmail: user.email };
}
