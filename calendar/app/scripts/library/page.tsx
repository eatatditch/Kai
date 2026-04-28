import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ScriptsLibrary } from "@/components/scripts/ScriptsLibrary";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";

export default async function LibraryPage() {
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
        <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15 text-[14px] text-muted">
          Loading…
        </div>
      }
    >
      <ScriptsLibrary userEmail={user.email!} isAdmin={isAdmin(user.email)} />
    </Suspense>
  );
}
