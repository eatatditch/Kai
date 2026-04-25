import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link / email confirmation handler. Uses Supabase's token_hash flow,
 * which (unlike PKCE `?code=`) does not require the link to be opened in the
 * same browser that requested it — so phones-after-laptop works.
 *
 * Requires the Supabase Magic Link email template to point here, e.g.:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=missing_token", url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    const errorUrl = new URL("/auth/error", url.origin);
    errorUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
