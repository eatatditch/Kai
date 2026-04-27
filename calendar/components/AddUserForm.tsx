"use client";

import { useActionState, useEffect, useRef } from "react";
import { addUser, type ActionResult } from "@/app/admin/actions";

const initialState: ActionResult | null = null;

export function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUser, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3.5 rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card"
    >
      <h3 className="m-0 font-bebas text-[18px] tracking-[0.1em] text-navy">
        ADD USER
      </h3>

      <div>
        <label
          htmlFor="new-email"
          className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
        >
          Email
        </label>
        <input
          id="new-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
        />
      </div>

      <div>
        <label
          htmlFor="new-password"
          className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
        >
          Initial Password
        </label>
        <input
          id="new-password"
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          placeholder="At least 8 characters"
          className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
        />
        <p className="mt-1 text-[11px] text-muted">
          Share this with the user; they can change it after sign-in via Supabase
          if needed.
        </p>
      </div>

      {state && !state.ok && (
        <div className="rounded-sm border border-cat-event bg-[#fbe5d4] px-3 py-2 text-[13px] font-medium text-[#8a2c10]">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-sm border border-sage bg-sage-tint px-3 py-2 text-[13px] font-medium text-sage">
          {state.message ?? "User created and allowlisted."}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm border-[1.5px] border-orange bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
