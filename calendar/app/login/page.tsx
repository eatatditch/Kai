"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAllowed } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError =
    searchParams.get("error") === "unauthorized"
      ? "This email isn't authorized to access the calendar."
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!isAllowed(trimmed)) {
      setError("This email isn't authorized to access the calendar.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-12">
      <div className="w-full max-w-[420px] rounded-[10px] border-[1.5px] border-ink bg-white p-7 shadow-card">
        <div className="mb-6 border-b-2 border-ink pb-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            Ditch Hospitality Group
          </div>
          <h1 className="m-0 font-bebas text-[44px] leading-[0.95] tracking-[0.01em] text-navy">
            Content Calendar
          </h1>
          <div className="mt-1.5 text-[13px] font-medium text-muted">
            Sign in to continue
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
            />
          </div>

          {error && (
            <div className="rounded-sm border border-cat-event bg-[#fbe5d4] px-3 py-2 text-[13px] font-medium text-[#8a2c10]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-sm border-[1.5px] border-orange bg-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center font-caveat text-base text-muted">
          spread joy. build community. surf well.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
