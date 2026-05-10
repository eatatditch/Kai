import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";
import { AppShell } from "@/components/AppShell";
import { formatWeekRange } from "@/lib/iso-week";

export const dynamic = "force-dynamic";

type SnapshotRow = {
  id: string;
  iso_year: number;
  iso_week: number;
  created_at: string;
};

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allowed = await isEmailAllowlisted(user.email);
  if (!allowed) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  const { data, error } = await supabase
    .from("sync_snapshots")
    .select("id, iso_year, iso_week, created_at")
    .order("iso_year", { ascending: false })
    .order("iso_week", { ascending: false });

  const rows = (data as SnapshotRow[] | null) ?? [];

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={user.email!}
        isAdmin={isAdmin(user.email)}
        current="sync"
        homeHref="/sync"
        eyebrow="Marketing Operating Picture"
        title="Sync archive"
        subtitle="Past weekly snapshots"
        actions={
          <Link
            href="/sync"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
          >
            ← Current week
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-[6px] border-[1.5px] border-orange bg-orange-tint px-3 py-2 text-[13px] text-ink">
          {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-white p-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {`// no snapshots yet`}
        </div>
      ) : (
        <ul className="grid gap-2">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sync/archive/${s.iso_year}/${s.iso_week}`}
                className="flex items-center justify-between rounded-[6px] border-[1.5px] border-line bg-white px-3.5 py-3 transition-all hover:-translate-y-px hover:border-ink"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-bebas text-[20px] tracking-[0.04em] text-ink">
                    Week {String(s.iso_week).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    {s.iso_year} · {formatWeekRange({ year: s.iso_year, week: s.iso_week })}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  archived {new Date(s.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
