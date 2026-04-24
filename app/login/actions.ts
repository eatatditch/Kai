"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

const schema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

export type SendLinkResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Sends a passwordless magic-link email. The link redirects to
 * /auth/callback, which exchanges the code for a session.
 */
export async function sendMagicLink(formData: FormData): Promise<SendLinkResult> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const env = serverEnv();
  const supabase = createClient();

  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  if (parsed.data.next) {
    callbackUrl.searchParams.set("next", parsed.data.next);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("magic link send failed", { code: error.status });
    return { ok: false, error: "Could not send the link. Try again." };
  }

  return { ok: true, email: parsed.data.email };
}
