import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Sign-in failed
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
          Wipeout.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason
            ? `We couldn't finish sign-in: ${reason}`
            : "We couldn't finish sign-in."}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
