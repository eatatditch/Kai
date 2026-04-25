import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { UserCreateForm } from "./user-create-form";

export const metadata: Metadata = {
  title: "Team — Ditch Marketing OS",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  contributor: "Contributor",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "owner") redirect("/dashboard");

  // RLS lets owners see all profiles.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
          Team
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage Ditch Marketing OS users.
        </p>
      </header>

      <UserCreateForm />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">
          Members
        </h2>
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {(profiles ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {p.full_name || p.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.email} · added {formatDate(p.created_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {ROLE_LABEL[p.role] ?? p.role}
              </span>
            </li>
          ))}
          {!profiles?.length && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No members yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
