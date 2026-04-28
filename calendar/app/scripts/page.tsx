import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ScriptsGenerator } from "@/components/scripts/ScriptsGenerator";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";

export default async function ScriptsPage() {
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

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15 text-[14px] text-muted">
          Loading…
        </div>
      }
    >
      <ScriptsGenerator userEmail={user.email!} isAdmin={isAdmin(user.email)} />
    </Suspense>
  );
}
