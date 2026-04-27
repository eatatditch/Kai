import { redirect } from "next/navigation";
import { Calendar } from "@/components/Calendar";
import { createClient } from "@/lib/supabase/server";
import { isAllowed } from "@/lib/constants";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!isAllowed(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return <Calendar userEmail={user.email!} />;
}
