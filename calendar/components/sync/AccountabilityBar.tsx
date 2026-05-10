import type { SyncItem, SyncOwner } from "@/types";

type Props = {
  items: SyncItem[];
};

const OWNER_NAMES: Record<SyncOwner, string> = {
  I: "Isabelle",
  T: "Tracy",
  "—": "Both",
};

const OWNER_ORDER: SyncOwner[] = ["I", "T", "—"];

export function countByOwner(items: SyncItem[]) {
  const counts: Record<SyncOwner, { open: number; done: number }> = {
    I: { open: 0, done: 0 },
    T: { open: 0, done: 0 },
    "—": { open: 0, done: 0 },
  };
  for (const i of items) {
    if (i.done) counts[i.owner].done += 1;
    else counts[i.owner].open += 1;
  }
  return counts;
}

const OWNER_TOKENS: Record<SyncOwner, { ring: string; chip: string }> = {
  I: { ring: "border-orange", chip: "bg-orange text-white" },
  T: { ring: "border-navy", chip: "bg-navy text-white" },
  "—": { ring: "border-line", chip: "bg-cream text-muted border border-line" },
};

export function AccountabilityBar({ items }: Props) {
  const counts = countByOwner(items);
  const total = items.length;
  const totalDone = items.filter((i) => i.done).length;

  return (
    <div className="rounded-[10px] border-[1.5px] border-ink bg-white p-4 print:border-black">
      <div className="mb-3 flex items-end justify-between border-b border-dashed border-line pb-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {`// Accountability`}
          </div>
          <h3 className="mt-0.5 font-bebas text-[20px] leading-none tracking-[0.02em] text-ink">
            <span className="italic">Owners</span>
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {totalDone}/{total} closed
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
        {OWNER_ORDER.map((owner) => {
          const c = counts[owner];
          const tok = OWNER_TOKENS[owner];
          return (
            <div
              key={owner}
              className={`flex items-center gap-3 rounded-[6px] border-[1.5px] ${tok.ring} bg-cream px-3 py-2`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-[4px] font-mono text-[12px] ${tok.chip}`}
              >
                {owner}
              </span>
              <div className="flex flex-col">
                <span className="font-bebas text-[16px] leading-none tracking-[0.04em] text-ink">
                  {OWNER_NAMES[owner]}
                </span>
                <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {c.open} open · {c.done} done
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
