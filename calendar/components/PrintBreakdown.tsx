import type { CalendarEvent, ViewMode } from "@/types";
import { ymd, parseYmd, formatTime, startOfWeek } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";

type Props = {
  events: CalendarEvent[];
  view: ViewMode;
  cursor: Date;
};

function visibleRange(view: ViewMode, cursor: Date): {
  start: string;
  end: string;
} {
  if (view === "month") {
    return {
      start: ymd(new Date(cursor.getFullYear(), cursor.getMonth(), 1)),
      end: ymd(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)),
    };
  }
  const ws = startOfWeek(cursor);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  return { start: ymd(ws), end: ymd(we) };
}

function periodHeading(view: ViewMode, cursor: Date): string {
  if (view === "month") {
    return cursor
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase();
  }
  const ws = startOfWeek(cursor);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const sameMonth = ws.getMonth() === we.getMonth();
  const startStr = ws.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = we.toLocaleDateString(
    "en-US",
    sameMonth
      ? { day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
  return `${startStr} — ${endStr}`.toUpperCase();
}

export function PrintBreakdown({ events, view, cursor }: Props) {
  const { start, end } = visibleRange(view, cursor);
  const inRange = events
    .filter((e) => e.date >= start && e.date <= end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      return 0;
    });

  const grouped = new Map<string, CalendarEvent[]>();
  for (const ev of inRange) {
    const list = grouped.get(ev.date);
    if (list) list.push(ev);
    else grouped.set(ev.date, [ev]);
  }

  return (
    <section className="hidden print:block print:break-before-page print:pt-1">
      <header className="mb-3 border-b border-black pb-1.5">
        <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-black">
          Ditch Hospitality Group · Event Breakdown
        </div>
        <div className="font-bebas text-[22px] leading-tight tracking-[0.04em] text-black">
          {periodHeading(view, cursor)}
        </div>
      </header>

      {grouped.size === 0 ? (
        <p className="text-[10px] text-black">No events scheduled.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...grouped.entries()].map(([date, evs]) => {
            const d = parseYmd(date);
            const heading = d
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase();
            return (
              <div key={date} className="break-inside-avoid">
                <h3 className="m-0 mb-0.5 font-bebas text-[12px] tracking-[0.1em] text-black">
                  {heading}
                </h3>
                <ul className="m-0 ml-3 list-disc">
                  {evs.map((ev) => {
                    const t = getType(ev.type);
                    const time = ev.time ? formatTime(ev.time) : "All day";
                    return (
                      <li
                        key={ev.id}
                        className="text-[9.5px] leading-[1.45] text-black"
                      >
                        <span className="font-semibold">{time}</span>
                        {" · "}
                        {t.emoji} {t.label}: {ev.title}
                        {ev.notes ? <> — {ev.notes}</> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
