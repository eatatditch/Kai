import type { FilterKey } from "@/types";
import { CATEGORIES } from "@/lib/event-types";

type Props = {
  active: Set<FilterKey>;
  onToggle: (key: FilterKey) => void;
};

export function FilterBar({ active, onToggle }: Props) {
  const allOn = active.has("all");

  return (
    <div className="mb-[18px] flex flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-3">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        Filter
      </span>
      <button
        type="button"
        onClick={() => onToggle("all")}
        className={`whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-[5px] text-xs font-medium transition-all duration-150 ${
          allOn
            ? "border-orange bg-orange text-white"
            : "border-line bg-cream text-ink hover:border-navy"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((c) => {
        const on = active.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={`flex items-center whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-[5px] text-xs font-medium transition-all duration-150 ${
              on
                ? "border-navy bg-navy text-white"
                : "border-line bg-cream text-ink hover:border-navy"
            }`}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: c.color }}
            />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
