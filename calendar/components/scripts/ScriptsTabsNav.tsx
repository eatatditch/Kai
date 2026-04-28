import Link from "next/link";

type Tab = "scripts" | "captions" | "email" | "sms" | "voices" | "library";

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "scripts", label: "Scripts", href: "/scripts" },
  { id: "captions", label: "Captions", href: "/scripts/captions" },
  { id: "email", label: "Email", href: "/scripts/email" },
  { id: "sms", label: "SMS", href: "/scripts/sms" },
  { id: "voices", label: "Voices", href: "/scripts/voices" },
  { id: "library", label: "Library", href: "/scripts/library" },
];

export function ScriptsTabsNav({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="Scripts sections"
      className="mb-6 -mt-3 flex flex-wrap gap-1.5 border-b border-line pb-2"
    >
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`rounded-full border-[1.5px] px-3 py-[5px] text-xs font-medium transition-all duration-150 ${
              on
                ? "border-orange bg-orange text-white"
                : "border-line bg-cream text-ink hover:border-navy"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
