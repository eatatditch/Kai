import { CATEGORIES } from "@/lib/event-types";

export function Legend() {
  return (
    <div className="mt-[22px] flex flex-wrap items-center gap-[14px] rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3.5 print:hidden">
      <span className="mr-1.5 font-bebas text-sm tracking-[0.12em] text-navy">
        CATEGORIES
      </span>
      {CATEGORIES.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1.5 text-xs text-ink"
        >
          <span
            className="inline-block h-3 w-3 rounded-[3px]"
            style={{ background: c.color }}
          />
          {c.label}
        </span>
      ))}
    </div>
  );
}
