import { redirect } from "next/navigation";
import { VoiceProfileEditor } from "@/components/scripts/VoiceProfileEditor";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowlisted } from "@/lib/allowlist";
import { isAdmin } from "@/lib/constants";

type Params = Promise<{ id: string }>;

export default async function VoiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;
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
    <VoiceProfileEditor
      userEmail={user.email!}
      isAdmin={isAdmin(user.email)}
      mode="edit"
      profileId={id}
    />
  );
}
