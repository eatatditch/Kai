"use client";

import { useActionState } from "react";
import { removeUser, type ActionResult } from "@/app/admin/actions";

const initialState: ActionResult | null = null;

type Props = { email: string };

export function RemoveUserButton({ email }: Props) {
  const [state, formAction, pending] = useActionState(removeUser, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Remove ${email} from the allowlist?`)) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-2"
    >
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-line bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted transition-colors duration-150 hover:border-cat-event hover:bg-[#f3d5cc] hover:text-[#8a2c10] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "…" : "Remove"}
      </button>
      {state && !state.ok && (
        <span className="text-[11px] font-medium text-[#8a2c10]">
          {state.error}
        </span>
      )}
    </form>
  );
}
