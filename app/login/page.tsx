import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Ditch Marketing OS",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/dashboard";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Ditch Marketing OS
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&rsquo;ll email you a one-tap sign-in link.
          </p>
        </header>

        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
