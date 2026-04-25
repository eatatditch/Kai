import Link from "next/link";

import { signOut } from "@/app/login/actions";

import { BrandSwitcher } from "./brand-switcher";

import type { BrandSummary } from "@/lib/active-brand";

export function AppNav({
  brands,
  activeBrand,
  userEmail,
}: {
  brands: BrandSummary[];
  activeBrand: BrandSummary | null;
  userEmail: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-screen-md items-center gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Ditch
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Marketing OS
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {activeBrand && <BrandSwitcher brands={brands} active={activeBrand} />}
          <form action={signOut}>
            <button
              type="submit"
              title={userEmail}
              className="h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
