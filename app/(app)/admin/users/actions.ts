"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { AppRole } from "@/types/database";

export type CreateUserState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: AppRole[] = ["owner", "manager", "contributor"];

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "owner") {
    throw new Error("Only owners can manage team members.");
  }
}

export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  try {
    await requireOwner();
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Forbidden.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "contributor");
  const role: AppRole = (ROLES as string[]).includes(roleRaw)
    ? (roleRaw as AppRole)
    : "contributor";

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: error?.message ?? "Could not create user.",
    };
  }

  // The on_auth_user_created trigger inserts a profile row with the default
  // 'contributor' role; bump it if a higher role was requested.
  if (role !== "contributor") {
    const { error: roleError } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (roleError) {
      return {
        status: "error",
        message: `User created, but role update failed: ${roleError.message}`,
      };
    }
  }

  revalidatePath("/admin/users");
  return { status: "ok", message: `Created ${email}.` };
}
