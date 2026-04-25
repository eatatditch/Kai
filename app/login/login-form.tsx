"use client";

import { useActionState } from "react";

import { sendMagicLink, type LoginState } from "./actions";

const INITIAL: LoginState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="text-foreground/80">Work email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@eatatditch.com"
          className="h-12 rounded-lg border border-border bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-primary text-primary-foreground font-semibold tracking-wide transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>

      {state.status === "sent" && (
        <p className="rounded-lg bg-accent/30 px-4 py-3 text-sm text-foreground">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
