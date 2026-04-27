import type { ViewMode } from "@/types";

type Props = {
  view: ViewMode;
  prevDisabled: boolean;
  nextDisabled: boolean;
  userEmail: string;
  onViewChange: (v: ViewMode) => void;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onPrint: () => void;
  onExport: () => void;
  onImport: () => void;
  onNewEvent: () => void;
};

const groupCls =
  "inline-flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-ink bg-white shadow-card";

const btnCls =
  "inline-flex items-center gap-1.5 border-r-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink transition-colors duration-150 last:border-r-0 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white";

const btnActiveCls = "bg-navy text-cream hover:bg-navy";

const btnPrimaryCls =
  "inline-flex items-center gap-1.5 bg-orange px-3.5 py-2.5 font-dm text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#b8541f]";

export function Header({
  view,
  prevDisabled,
  nextDisabled,
  userEmail,
  onViewChange,
  onPrev,
  onToday,
  onNext,
  onPrint,
  onExport,
  onImport,
  onNewEvent,
}: Props) {
  return (
    <>
      <div className="mb-2 flex justify-end gap-3 text-[12px] text-muted">
        <span>{userEmail}</span>
        <span aria-hidden="true">·</span>
        <form action="/auth/signout" method="post" className="inline">
          <button
            type="submit"
            className="cursor-pointer font-medium text-muted underline-offset-2 hover:text-orange hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
        <div className="flex flex-col">
          <span className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            Ditch Hospitality Group
          </span>
          <h1 className="m-0 font-bebas text-[clamp(40px,5vw,60px)] leading-[0.95] tracking-[0.01em] text-navy">
            Content Calendar
          </h1>
          <span className="mt-1.5 text-[13px] font-medium text-muted">
            May 2026 — June 2027 · Brand &amp; Marketing
          </span>
        </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className={groupCls}>
          <button
            type="button"
            onClick={() => onViewChange("month")}
            className={`${btnCls} ${view === "month" ? btnActiveCls : ""}`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onViewChange("week")}
            className={`${btnCls} ${view === "week" ? btnActiveCls : ""}`}
          >
            Week
          </button>
        </div>

        <div className={groupCls}>
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled}
            className={btnCls}
            title="Previous"
            aria-label="Previous"
          >
            <span className="text-sm leading-none">‹</span>
          </button>
          <button type="button" onClick={onToday} className={btnCls}>
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={btnCls}
            title="Next"
            aria-label="Next"
          >
            <span className="text-sm leading-none">›</span>
          </button>
        </div>

        <div className={groupCls}>
          <button type="button" onClick={onPrint} className={btnCls}>
            <span className="text-sm leading-none">🖨</span> Print
          </button>
          <button type="button" onClick={onExport} className={btnCls}>
            <span className="text-sm leading-none">⬇</span> Export
          </button>
          <button type="button" onClick={onImport} className={btnCls}>
            <span className="text-sm leading-none">⬆</span> Import
          </button>
        </div>

        <div className={`${groupCls} border-orange`}>
          <button
            type="button"
            onClick={onNewEvent}
            className={btnPrimaryCls}
          >
            <span className="text-sm leading-none">＋</span> New Event
          </button>
        </div>
        </div>
      </header>
    </>
  );
}
