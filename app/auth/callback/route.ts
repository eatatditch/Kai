import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing route. Supabase appends `?code=...` to the redirect URL;
 * we exchange it for a session, set cookies, then forward the user to wherever
 * they were trying to go (`?next=`) or to `/`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth code exchange failed", { code: error.status });
    return NextResponse.redirect(new URL("/login?error=exchange_failed", origin));
  }

  // Only allow same-origin redirects.
  const safeNext = nextPath.startsWith("/") ? nextPath : "/";
  return NextResponse.redirect(new URL(safeNext, origin));
}
