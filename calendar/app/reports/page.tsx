import { redirect } from "next/navigation";
import { Reports } from "@/components/Reports";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";

export default async function ReportsPage() {
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

  return <Reports userEmail={user.email!} isAdmin={isAdmin(user.email)} />;
}
