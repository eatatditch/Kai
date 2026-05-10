import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";
import { loadSyncData } from "@/lib/sync-server";
import { currentIsoWeek, formatWeekRange } from "@/lib/iso-week";
import { SyncBoard } from "@/components/sync/SyncBoard";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
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

  const week = currentIsoWeek();
  const data = await loadSyncData(week.year, week.week);

  return (
    <SyncBoard
      userEmail={user.email!}
      isAdmin={isAdmin(user.email)}
      isoYear={week.year}
      isoWeek={week.week}
      weekLabel={formatWeekRange(week)}
      meters={data.meters}
      readings={data.readings}
      roadmap={data.roadmap}
      items={data.items}
    />
  );
}
