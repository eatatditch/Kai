import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe. Returns 200 if the server runtime is up. Does not touch
 * Supabase or Anthropic — those get their own diagnostic endpoints later.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ditch-marketing-os",
    timestamp: new Date().toISOString(),
  });
}
