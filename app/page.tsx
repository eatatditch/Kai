import { TopNav } from "@/components/app/nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserBrands, requireProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-ditch-rust text-primary-foreground",
  manager: "bg-ditch-teal text-primary-foreground",
  contributor: "bg-ditch-denim text-primary-foreground",
  uploader: "bg-muted text-muted-foreground",
};

export default async function HomePage() {
  const { user, profile } = await requireProfile();
  const brands = await getUserBrands();

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        profile={profile}
        email={user.email ?? "(no email)"}
        brands={brands}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Your brands
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {brands.length > 0
              ? `Welcome back${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`
              : "No brand access yet."}
          </h1>
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask Tracy to add you to a brand. You&apos;re signed in, but no brand
              memberships are attached to this account.
            </p>
          ) : null}
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">{brand.display_name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {brand.slug}
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                      ROLE_BADGE[brand.membership_role] ?? ROLE_BADGE.uploader
                    }`}
                  >
                    {brand.membership_role}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Generator, calendar, and approvals for this brand land here.
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
