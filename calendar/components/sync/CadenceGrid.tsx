"use client";

import { useTransition } from "react";
import { adjustMeter } from "@/app/sync/actions";
import type { CadenceMeter, CadenceReading } from "@/types";

type Props = {
  meters: CadenceMeter[];
  readings: CadenceReading[];
  isoYear: number;
  isoWeek: number;
  readOnly?: boolean;
  onError?: (msg: string) => void;
  onLocalUpdate?: (reading: CadenceReading) => void;
};

export function meterPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

export function meterColor(pct: number): "sage" | "sand" | "coral" {
  if (pct >= 0.8) return "sage";
  if (pct >= 0.5) return "sand";
  return "coral";
}

const FILL_BG: Record<"sage" | "sand" | "coral", string> = {
  sage: "var(--sage)",
  sand: "var(--sand)",
  coral: "var(--orange)",
};

export function CadenceGrid({
  meters,
  readings,
  isoYear,
  isoWeek,
  readOnly = false,
  onError,
  onLocalUpdate,
}: Props) {
  const [pending, startTransition] = useTransition();

  const onAdjust = (meter: CadenceMeter, delta: number) => {
    if (readOnly) return;
    const reading = readings.find((r) => r.meterId === meter.id);
    const current = reading?.currentValue ?? 0;
    const next = Math.max(0, Math.min(meter.maxValue, current + delta));
    if (next === current) return;

    onLocalUpdate?.({
      id: reading?.id ?? `local-${meter.id}`,
      meterId: meter.id,
      isoYear,
      isoWeek,
      currentValue: next,
    });

    startTransition(async () => {
      const res = await adjustMeter(
        meter.id,
        isoYear,
        isoWeek,
        delta,
        meter.maxValue,
      );
      if (!res.ok) onError?.(res.error);
    });
  };

  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 ${pending ? "opacity-95" : ""}`}
    >
      {meters.map((m) => {
        const reading = readings.find((r) => r.meterId === m.id);
        const value = reading?.currentValue ?? 0;
        const pct = meterPct(value, m.maxValue);
        const color = meterColor(pct);
        return (
          <div
            key={m.id}
            className="flex flex-col rounded-[10px] border-[1.5px] border-ink bg-white p-3 print:border-black"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bebas text-[18px] leading-none tracking-[0.04em] text-ink">
                {m.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {value}/{m.maxValue}
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              {m.targetLabel}
            </div>

            <div className="mt-3 h-3 w-full overflow-hidden rounded-[3px] border border-line bg-cream">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${Math.round(pct * 100)}%`,
                  background: FILL_BG[color],
                }}
              />
            </div>

            {!readOnly && (
              <div className="mt-3 flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => onAdjust(m, -1)}
                  disabled={value <= 0}
                  aria-label={`Decrement ${m.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border-[1.5px] border-ink bg-white font-mono text-[14px] text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onAdjust(m, 1)}
                  disabled={value >= m.maxValue}
                  aria-label={`Increment ${m.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border-[1.5px] border-ink bg-ink font-mono text-[14px] text-cream transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {Math.round(pct * 100)}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
