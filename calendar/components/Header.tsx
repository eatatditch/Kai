import type { ViewMode } from "@/types";

type Props = {
  view: ViewMode;
  prevDisabled: boolean;
  nextDisabled: boolean;
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

export function CalendarToolbar({
  view,
  prevDisabled,
  nextDisabled,
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
    </>
  );
}
