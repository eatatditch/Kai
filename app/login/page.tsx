import { Suspense } from "react";

import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Sign in · Ditch Marketing OS",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="text-3xl" />
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Marketing OS
        </p>
      </div>
      <Suspense>
        <LoginForm next={searchParams.next} />
      </Suspense>
      <p className="text-xs text-muted-foreground">
        Sign-in is by invite only. Talk to Tracy if you need access.
      </p>
    </main>
  );
}
