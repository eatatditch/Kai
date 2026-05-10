import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";
import { formatWeekRange } from "@/lib/iso-week";
import { SyncBoard } from "@/components/sync/SyncBoard";
import type { SyncSnapshotPayload } from "@/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ year: string; week: string }>;

export default async function ArchiveSnapshotPage({
  params,
}: {
  params: Params;
}) {
  const { year, week } = await params;
  const isoYear = Number(year);
  const isoWeek = Number(week);
  if (!Number.isFinite(isoYear) || !Number.isFinite(isoWeek)) notFound();

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

  const { data } = await supabase
    .from("sync_snapshots")
    .select("payload")
    .eq("iso_year", isoYear)
    .eq("iso_week", isoWeek)
    .maybeSingle();

  if (!data) notFound();
  const payload = data.payload as SyncSnapshotPayload;

  const weekLabel = formatWeekRange({ year: isoYear, week: isoWeek });

  return (
    <SyncBoard
      userEmail={user.email!}
      isAdmin={isAdmin(user.email)}
      isoYear={isoYear}
      isoWeek={isoWeek}
      weekLabel={weekLabel}
      weekHeading={`Snapshot — ${weekLabel} · W${String(isoWeek).padStart(2, "0")}`}
      meters={payload.meters ?? []}
      readings={payload.readings ?? []}
      roadmap={payload.roadmap ?? []}
      items={payload.items ?? []}
      readOnly
    />
  );
}
