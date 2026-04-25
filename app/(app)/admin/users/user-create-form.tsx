"use client";

import { useActionState, useEffect, useRef } from "react";

import { createUser, type CreateUserState } from "./actions";

const INITIAL: CreateUserState = { status: "idle" };

export function UserCreateForm() {
  const [state, formAction, pending] = useActionState(createUser, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="font-display text-xl font-bold text-foreground">
        Add team member
      </h2>

      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="text-foreground/80">Full name</span>
        <input
          type="text"
          name="full_name"
          autoComplete="name"
          placeholder="Isabelle Smith"
          className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="text-foreground/80">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          inputMode="email"
          placeholder="name@eatatditch.com"
          className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="text-foreground/80">
          Initial password
          <span className="ml-2 font-normal text-muted-foreground">
            (min 8 chars — share securely)
          </span>
        </span>
        <input
          type="text"
          name="password"
          required
          minLength={8}
          autoComplete="off"
          className="h-11 rounded-lg border border-border bg-background px-3 font-mono text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        <span className="text-foreground/80">Role</span>
        <select
          name="role"
          defaultValue="contributor"
          className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="contributor">Contributor</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary text-primary-foreground font-semibold tracking-wide transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>

      {state.status === "ok" && (
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
