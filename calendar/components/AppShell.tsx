import Link from "next/link";
import type { ReactNode } from "react";

export type AppShellSection = "calendar" | "notes" | "reports" | "scripts";

type Props = {
  userEmail: string;
  isAdmin: boolean;
  current: AppShellSection;
  homeHref?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  printHidden?: boolean;
};

const NAV_LINKS: { id: AppShellSection; label: string; href: string }[] = [
  { id: "calendar", label: "Calendar", href: "/" },
  { id: "scripts", label: "Scripts", href: "/scripts" },
  { id: "notes", label: "Notes", href: "/notes" },
  { id: "reports", label: "Reports", href: "/reports" },
];

const navLinkCls =
  "font-medium text-muted underline-offset-2 hover:text-orange hover:underline";

export function AppShell({
  userEmail,
  isAdmin,
  current,
  homeHref = "/",
  eyebrow = "Ditch Hospitality Group",
  title,
  subtitle,
  actions,
  printHidden = false,
}: Props) {
  const links = NAV_LINKS.filter((l) => l.id !== current);

  return (
    <>
      <div className="mb-2 flex justify-end gap-3 text-[12px] text-muted print:hidden">
        <span>{userEmail}</span>
        {isAdmin && (
          <>
            <span aria-hidden="true">·</span>
            <Link href="/admin" className={navLinkCls}>
              Manage users
            </Link>
          </>
        )}
        {links.map((l) => (
          <span key={l.id} className="contents">
            <span aria-hidden="true">·</span>
            <Link href={l.href} className={navLinkCls}>
              {l.label}
            </Link>
          </span>
        ))}
        <span aria-hidden="true">·</span>
        <form action="/auth/signout" method="post" className="inline">
          <button type="submit" className={`cursor-pointer ${navLinkCls}`}>
            Sign out
          </button>
        </form>
      </div>

      <header
        className={`mb-[22px] flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5 ${
          printHidden
            ? "print:hidden"
            : "print:mb-2 print:gap-0 print:border-b print:border-black print:pb-1.5"
        }`}
      >
        <Link
          href={homeHref}
          className="group flex flex-col no-underline outline-none"
        >
          <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-orange print:text-[9px] print:text-black">
            {eyebrow}
          </span>
          <h1 className="m-0 font-bebas text-[clamp(40px,5vw,60px)] leading-[0.95] tracking-[0.01em] text-navy transition-colors duration-150 group-hover:text-orange print:text-[24px] print:leading-tight print:text-black">
            {title}
          </h1>
          {subtitle && (
            <span className="mt-1.5 text-[13px] font-medium text-muted print:hidden">
              {subtitle}
            </span>
          )}
        </Link>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            {actions}
          </div>
        )}
      </header>
    </>
  );
}
