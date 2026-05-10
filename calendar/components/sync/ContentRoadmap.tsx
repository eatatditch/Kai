"use client";

import { useMemo, useTransition } from "react";
import { cycleMonthStatus } from "@/app/sync/actions";
import type { RoadmapMonth, RoadmapStatus } from "@/types";

type Props = {
  months: RoadmapMonth[];
  readOnly?: boolean;
  onError?: (msg: string) => void;
  onLocalUpdate?: (month: RoadmapMonth) => void;
};

const STATUS_CYCLE: RoadmapStatus[] = ["future", "todo", "mapping", "mapped"];
const STATUS_LABELS: Record<RoadmapStatus, string> = {
  future: "Future",
  todo: "To Do",
  mapping: "In Mapping",
  mapped: "Mapped",
};

const STATUS_STYLES: Record<
  RoadmapStatus,
  { bg: string; fg: string; border: string; dot: string }
> = {
  future: { bg: "bg-cream", fg: "text-muted", border: "border-line", dot: "bg-line" },
  todo: { bg: "bg-sand", fg: "text-ink", border: "border-ink", dot: "bg-muted" },
  mapping: {
    bg: "bg-orange-tint",
    fg: "text-ink",
    border: "border-orange",
    dot: "bg-orange",
  },
  mapped: {
    bg: "bg-sage-tint",
    fg: "text-ink",
    border: "border-sage",
    dot: "bg-sage",
  },
};

function monthLabel(monthStart: string): { mon: string; year: string } {
  const d = new Date(`${monthStart}T00:00:00`);
  return {
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: String(d.getFullYear()),
  };
}

export function ContentRoadmap({
  months,
  readOnly = false,
  onError,
  onLocalUpdate,
}: Props) {
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () => months.slice().sort((a, b) => a.monthStart.localeCompare(b.monthStart)),
    [months],
  );

  const onCycle = (m: RoadmapMonth) => {
    if (readOnly) return;
    const idx = STATUS_CYCLE.indexOf(m.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onLocalUpdate?.({ ...m, status: next, statusLabel: STATUS_LABELS[next] });
    startTransition(async () => {
      const res = await cycleMonthStatus(m.id);
      if (!res.ok) onError?.(res.error);
    });
  };

  return (
    <div
      className={`overflow-x-auto rounded-[10px] border-[1.5px] border-ink bg-white p-3 print:border-black ${pending ? "opacity-95" : ""}`}
    >
      <div className="flex min-w-full items-stretch gap-2">
        {sorted.map((m, i) => {
          const styles = STATUS_STYLES[m.status];
          const { mon, year } = monthLabel(m.monthStart);
          const prev = sorted[i - 1];
          const showQDivider = prev && prev.quarter !== m.quarter;

          return (
            <div key={m.id} className="flex items-stretch">
              {showQDivider && (
                <div
                  className="mx-1 flex flex-col items-center justify-center"
                  aria-hidden="true"
                >
                  <div className="h-full w-px border-l border-dashed border-line" />
                </div>
              )}
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onCycle(m)}
                className={`group relative flex min-w-[140px] flex-1 flex-col rounded-[6px] border-[1.5px] ${styles.border} ${styles.bg} px-3 py-2 text-left transition-all hover:-translate-y-px disabled:hover:translate-y-0`}
                title={`Cycle status (currently ${m.statusLabel})`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    {m.quarter}
                  </span>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${styles.dot}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-bebas text-[24px] leading-none tracking-[0.02em] text-ink">
                    {mon}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {year}
                  </span>
                </div>
                <div className={`mt-1 text-[12px] font-medium ${styles.fg}`}>
                  {m.statusLabel}
                </div>
                {m.deadlineText && (
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {m.deadlineText}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
