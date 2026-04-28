"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, Note } from "@/types";
import { MIN_DATE } from "@/lib/constants";
import { ymd, parseYmd, formatTime } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";
import { fetchEvents } from "@/lib/events-api";
import { fetchNotes } from "@/lib/notes-api";
import { getNoteCategory, NOTE_CATEGORIES } from "@/lib/note-categories";
import { AppShell } from "./AppShell";
import { MonthView } from "./MonthView";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

type Quarter = { year: number; quarter: 1 | 2 | 3 | 4 };

function quarterOf(d: Date): Quarter {
  return {
    year: d.getFullYear(),
    quarter: (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
  };
}

function quarterRange(q: Quarter): { start: Date; end: Date } {
  const startMonth = (q.quarter - 1) * 3;
  return {
    start: new Date(q.year, startMonth, 1),
    end: new Date(q.year, startMonth + 3, 0),
  };
}

function quarterLabel(q: Quarter): string {
  return `Q${q.quarter} ${q.year}`;
}

function quartersFrom(min: Date, count: number): Quarter[] {
  const list: Quarter[] = [];
  const startQ = quarterOf(min);
  let y = startQ.year;
  let q: 1 | 2 | 3 | 4 = startQ.quarter;
  for (let i = 0; i < count; i++) {
    list.push({ year: y, quarter: q });
    if (q === 4) {
      q = 1;
      y += 1;
    } else {
      q = (q + 1) as 1 | 2 | 3 | 4;
    }
  }
  return list;
}

const noop = () => {};

export function Reports({ userEmail, isAdmin }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const initial = today < MIN_DATE ? quarterOf(MIN_DATE) : quarterOf(today);
  const [picked, setPicked] = useState<Quarter>(initial);

  const quarterOptions = useMemo(() => {
    const minQ = quarterOf(MIN_DATE);
    const todayQ = quarterOf(new Date());
    const span =
      (todayQ.year - minQ.year) * 4 +
      (todayQ.quarter - minQ.quarter) +
      8; // 2 years ahead of "today"
    return quartersFrom(MIN_DATE, Math.max(span, 12));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchEvents(), fetchNotes()])
      .then(([evs, ns]) => {
        if (!active) return;
        setEvents(evs);
        setNotes(ns);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { start, end } = quarterRange(picked);

  const monthCursors = useMemo(() => {
    const startMonth = (picked.quarter - 1) * 3;
    return [
      new Date(picked.year, startMonth, 1),
      new Date(picked.year, startMonth + 1, 1),
      new Date(picked.year, startMonth + 2, 1),
    ];
  }, [picked]);

  const eventsByDate = useMemo(() => {
    const range = quarterRange(picked);
    const startStr = ymd(range.start);
    const endStr = ymd(range.end);
    const filtered = events
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        return 0;
      });
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filtered) {
      const list = map.get(ev.date);
      if (list) list.push(ev);
      else map.set(ev.date, [ev]);
    }
    return map;
  }, [events, picked]);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15 print:max-w-none print:px-0 print:pt-0 print:pb-0">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="reports"
        homeHref="/reports"
        title="Quarterly Reports"
        subtitle="Print-ready calendar, event schedule, and notes for any quarter"
        printHidden
        actions={
          <>
            <div className="flex flex-col">
              <label
                htmlFor="quarter-pick"
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
              >
                Quarter
              </label>
              <select
                id="quarter-pick"
                value={`${picked.year}-${picked.quarter}`}
                onChange={(e) => {
                  const [y, q] = e.target.value.split("-").map(Number);
                  setPicked({ year: y, quarter: q as 1 | 2 | 3 | 4 });
                }}
                className="rounded-sm border-[1.5px] border-ink bg-white px-3 py-2.5 text-sm font-semibold text-ink shadow-card transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
              >
                {quarterOptions.map((q) => (
                  <option key={`${q.year}-${q.quarter}`} value={`${q.year}-${q.quarter}`}>
                    {quarterLabel(q)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-3.5 py-2.5 font-dm text-[13px] font-semibold text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
            >
              <span className="text-sm leading-none">🖨</span> Print Report
            </button>
          </>
        }
      />

      <div className="hidden print:block print:mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-black">
          Ditch Hospitality Group · Quarterly Report
        </span>
        <h1 className="m-0 font-bebas text-[28px] leading-tight tracking-[0.02em] text-black">
          {quarterLabel(picked)} ·{" "}
          {start.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}{" "}
          —{" "}
          {end.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h1>
      </div>

      {loading ? (
        <p className="text-[14px] text-muted">Loading…</p>
      ) : (
        <>
          <section className="mb-8 page-calendar">
            <h2 className="mb-3 font-bebas text-[20px] tracking-[0.1em] text-navy print:text-black print:text-[14px]">
              CALENDAR GRIDS
            </h2>
            <div className="flex flex-col gap-4">
              {monthCursors.map((c, i) => (
                <div
                  key={c.toISOString()}
                  className={
                    i > 0
                      ? "print:break-before-page"
                      : ""
                  }
                >
                  <h3 className="mb-2 font-bebas text-[18px] tracking-[0.06em] text-navy print:text-[16px] print:text-black">
                    {c
                      .toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                      .toUpperCase()}
                  </h3>
                  <MonthView
                    cursor={c}
                    events={events}
                    onDayClick={noop}
                    onEventClick={noop}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 page-breakdown print:break-before-page">
            <h2 className="mb-3 font-bebas text-[20px] tracking-[0.1em] text-navy print:text-black print:text-[14px]">
              EVENT SCHEDULE
            </h2>
            {eventsByDate.size === 0 ? (
              <p className="text-[13px] text-muted">
                No events scheduled in this quarter.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...eventsByDate.entries()].map(([date, evs]) => {
                  const d = parseYmd(date);
                  const heading = d
                    .toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                    .toUpperCase();
                  return (
                    <div
                      key={date}
                      className="rounded-sm border border-line bg-white p-3 break-inside-avoid print:rounded-none print:border-black print:bg-white print:p-2"
                    >
                      <h3 className="m-0 mb-1 font-bebas text-[14px] tracking-[0.1em] text-navy print:text-black">
                        {heading}
                      </h3>
                      <ul className="m-0 ml-4 list-disc">
                        {evs.map((ev) => {
                          const t = getType(ev.type);
                          const time = ev.time
                            ? formatTime(ev.time)
                            : "All day";
                          return (
                            <li
                              key={ev.id}
                              className="text-[12px] leading-[1.45] text-ink print:text-black"
                            >
                              <span className="font-semibold">
                                {time}
                              </span>{" "}
                              · {t.emoji} {t.label}: {ev.title}
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

          <section className="page-breakdown print:break-before-page">
            <h2 className="mb-3 font-bebas text-[20px] tracking-[0.1em] text-navy print:text-black print:text-[14px]">
              NOTES &amp; IDEAS
            </h2>
            {notes.length === 0 ? (
              <p className="text-[13px] text-muted">No notes recorded.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {NOTE_CATEGORIES.map((cat) => {
                  const inCat = notes.filter((n) => n.category === cat.id);
                  if (inCat.length === 0) return null;
                  return (
                    <div key={cat.id} className="break-inside-avoid">
                      <h3
                        className="m-0 mb-2 font-bebas text-[14px] tracking-[0.1em] print:text-[13px] print:text-black"
                        style={{ color: cat.color }}
                      >
                        {cat.emoji} {cat.label.toUpperCase()}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {inCat.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-sm border border-line bg-white p-3 break-inside-avoid print:rounded-none print:border-black print:bg-white print:p-2"
                            style={{
                              borderLeftColor: getNoteCategory(note.category)
                                .color,
                              borderLeftWidth: 3,
                            }}
                          >
                            <h4 className="m-0 font-dm text-[14px] font-semibold text-ink print:text-black">
                              {note.title}
                            </h4>
                            {note.body && (
                              <p className="m-0 mt-1 whitespace-pre-line text-[12px] leading-[1.45] text-muted print:text-black">
                                {note.body}
                              </p>
                            )}
                            <div className="mt-1.5 text-[10px] uppercase tracking-[0.06em] text-muted print:text-black">
                              Updated{" "}
                              {new Date(note.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
