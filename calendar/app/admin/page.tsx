import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, isAdmin } from "@/lib/constants";
import { fetchAllowlist } from "@/lib/allowlist";
import { AddUserForm } from "@/components/AddUserForm";
import { RemoveUserButton } from "@/components/RemoveUserButton";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/");

  const users = await fetchAllowlist();

  return (
    <main className="mx-auto max-w-[720px] px-5 pt-6 pb-15">
      <div className="mb-2 flex justify-between text-[12px] text-muted">
        <Link
          href="/"
          className="font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
        >
          ‹ Back to calendar
        </Link>
        <form action="/auth/signout" method="post" className="inline">
          <button
            type="submit"
            className="cursor-pointer font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>

      <header className="mb-6 border-b-2 border-ink pb-5">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
          Ditch Hospitality Group
        </span>
        <h1 className="m-0 font-bebas text-[clamp(36px,4vw,48px)] leading-[0.95] tracking-[0.01em] text-navy">
          Manage Users
        </h1>
        <span className="mt-1.5 block text-[13px] font-medium text-muted">
          Admin: {user.email}
        </span>
      </header>

      <section className="mb-8">
        <h2 className="m-0 mb-3 font-bebas text-[18px] tracking-[0.1em] text-navy">
          ALLOWLISTED USERS
        </h2>
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.email}
              className="flex items-center justify-between gap-3 rounded-sm border border-line bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-ink">
                  {u.email}
                </span>
                {u.email === ADMIN_EMAIL && (
                  <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange">
                    Admin
                  </span>
                )}
              </div>
              {u.email !== ADMIN_EMAIL && (
                <RemoveUserButton email={u.email} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <AddUserForm />
      </section>
    </main>
  );
}
