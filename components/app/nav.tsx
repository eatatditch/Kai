import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthBrand, AuthProfile } from "@/lib/auth/server";

const ROLE_LABEL: Record<AuthProfile["role"], string> = {
  owner: "Owner",
  manager: "Manager",
  contributor: "Contributor",
  uploader: "Uploader",
};

export function TopNav({
  profile,
  email,
  brands,
}: {
  profile: AuthProfile;
  email: string;
  brands: AuthBrand[];
}) {
  const displayName = profile.full_name?.trim() || email;
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            {ROLE_LABEL[profile.role]} · {brands.length} brand
            {brands.length === 1 ? "" : "s"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initial}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm">{displayName}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action="/auth/signout" method="post">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
