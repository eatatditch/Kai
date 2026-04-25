import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleBrands, getActiveBrand } from "@/lib/active-brand";

import { AppNav } from "./_components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should already have redirected, but belt-and-suspenders.
  if (!user) redirect("/login");

  const brands = await getAccessibleBrands();
  const activeBrand = await getActiveBrand(brands);

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav
        brands={brands}
        activeBrand={activeBrand}
        userEmail={user.email ?? ""}
      />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
