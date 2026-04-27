"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL, isAdmin } from "@/lib/constants";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function addUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to Vercel env vars and redeploy.",
    };
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let alreadyExisted = false;
  if (createError) {
    const code = (createError as { code?: string }).code ?? "";
    const msg = createError.message ?? "";
    const looksLikeDuplicate =
      code === "email_exists" ||
      code === "user_already_exists" ||
      /already (registered|exists)/i.test(msg);
    if (looksLikeDuplicate) {
      alreadyExisted = true;
    } else {
      return {
        ok: false,
        error: `${msg}${code ? ` (code: ${code})` : ""}`,
      };
    }
  }

  const { error: insertError } = await supabase
    .from("allowlist")
    .upsert({ email, created_by: user.id }, { onConflict: "email" });
  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/admin");
  return alreadyExisted
    ? {
        ok: true,
        message:
          "Already had a Supabase auth account — added to allowlist. Their existing password still applies.",
      }
    : { ok: true };
}

export async function removeUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required." };
  if (email === ADMIN_EMAIL) {
    return { ok: false, error: "The admin account can't be removed." };
  }

  const { error } = await supabase.from("allowlist").delete().eq("email", email);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
