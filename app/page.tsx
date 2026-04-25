import { redirect } from "next/navigation";

/**
 * Supabase's Site URL fallback silently strips the path from `emailRedirectTo`
 * when the URL doesn't match the allowlist, sending magic-link users to
 * `/?code=...` instead of `/auth/callback?code=...`. Forward the code so the
 * sign-in still completes.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;

  if (code) {
    const params = new URLSearchParams({ code });
    if (next?.startsWith("/")) params.set("next", next);
    redirect(`/auth/callback?${params.toString()}`);
  }

  redirect("/dashboard");
}
