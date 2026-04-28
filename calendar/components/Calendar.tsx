"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent, FilterKey, Recurrence, ViewMode } from "@/types";
import { generateOccurrenceDates } from "@/lib/recurrence";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";
import { startOfWeek, ymd } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";
import {
  fetchEvents,
  upsertEvent,
  deleteEventById,
  subscribeEvents,
  mergeEvents,
  replaceAllEvents,
} from "@/lib/events-api";
import { fetchEventIdsWithScripts } from "@/lib/scripts/api";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "./AppShell";
import { CalendarToolbar } from "./Header";
import { FilterBar } from "./FilterBar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { Legend } from "./Legend";
import { EventModal } from "./EventModal";
import { Toast } from "./Toast";
import { PrintBreakdown } from "./PrintBreakdown";
import { NotesPanel } from "./NotesPanel";

function clampMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function periodLabel(view: ViewMode, cursor: Date): string {
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

type ModalState = { date: string; editId: string | null } | null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeImported(rows: unknown[]): CalendarEvent[] {
  return rows
    .filter(
      (r): r is Record<string, unknown> =>
        typeof r === "object" && r !== null,
    )
    .map((r) => {
      const rawId = typeof r.id === "string" ? r.id : "";
      const id = UUID_RE.test(rawId) ? rawId : crypto.randomUUID();
      return {
        id,
        date: typeof r.date === "string" ? r.date : "",
        type: typeof r.type === "string" ? r.type : "other",
        title: typeof r.title === "string" && r.title ? r.title : "Untitled",
        time:
          typeof r.time === "string" && r.time
            ? r.time.slice(0, 5)
            : undefined,
        notes: typeof r.notes === "string" && r.notes ? r.notes : undefined,
      };
    })
    .filter((e) => DATE_RE.test(e.date));
}

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

export function Calendar({ userEmail, isAdmin }: Props) {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(() => {
    const today = new Date();
    if (today < MIN_DATE) return new Date(MIN_DATE);
    if (today > MAX_DATE) return new Date(MAX_DATE);
    return today;
  });
  const [filters, setFilters] = useState<Set<FilterKey>>(
    () => new Set<FilterKey>(["all"]),
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scriptedEventIds, setScriptedEventIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchEvents()
      .then((rows) => {
        if (active) setEvents(rows);
      })
      .catch(() => {
        if (active) showToast("Failed to load events");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = subscribeEvents((change) => {
      if (change.kind === "upsert") {
        const incoming = change.event;
        setEvents((prev) => {
          const idx = prev.findIndex((e) => e.id === incoming.id);
          if (idx === -1) return [...prev, incoming];
          const next = prev.slice();
          next[idx] = incoming;
          return next;
        });
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== change.id));
      }
    });
    return unsubscribe;
  }, []);

  // Track which events have at least one attached script so the calendar
  // pills can show a 📝 marker. Refetch on any change to generated_scripts.
  useEffect(() => {
    let active = true;
    fetchEventIdsWithScripts()
      .then((set) => {
        if (active) setScriptedEventIds(set);
      })
      .catch(() => {
        // soft-fail: badges just don't show
      });

    const supabase = createClient();
    const channel = supabase
      .channel("generated-scripts-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generated_scripts" },
        () => {
          fetchEventIdsWithScripts()
            .then((set) => {
              if (active) setScriptedEventIds(set);
            })
            .catch(() => {});
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  const visibleEvents = useMemo(() => {
    if (filters.has("all")) return events;
    return events.filter((e) => filters.has(getType(e.type).cat));
  }, [events, filters]);

  const navDisabled = useMemo(() => {
    if (view === "month") {
      const prevTarget = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      const nextTarget = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      return {
        prev: prevTarget < clampMonth(MIN_DATE),
        next: nextTarget > clampMonth(MAX_DATE),
      };
    }
    const ws = startOfWeek(cursor);
    const prevWeekEnd = new Date(ws);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const nextWeekStart = new Date(ws);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return {
      prev: prevWeekEnd < MIN_DATE,
      next: nextWeekStart > MAX_DATE,
    };
  }, [cursor, view]);

  const navigate = (delta: number) => {
    if (view === "month") {
      const target = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + delta,
        1,
      );
      if (target < clampMonth(MIN_DATE)) return;
      if (target > clampMonth(MAX_DATE)) return;
      setCursor(target);
    } else {
      const ws = startOfWeek(cursor);
      ws.setDate(ws.getDate() + delta * 7);
      setCursor(ws);
    }
  };

  const goToday = () => {
    const today = new Date();
    if (today < MIN_DATE) setCursor(new Date(MIN_DATE));
    else if (today > MAX_DATE) setCursor(new Date(MAX_DATE));
    else setCursor(today);
  };

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (key === "all") return new Set<FilterKey>(["all"]);
      next.delete("all");
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) next.add("all");
      return next;
    });
  };

  const onDayClick = (date: string) => setModal({ date, editId: null });
  const onEventClick = (ev: CalendarEvent) =>
    setModal({ date: ev.date, editId: ev.id });

  const onNewEvent = () => {
    const today = new Date();
    const target = today < MIN_DATE || today > MAX_DATE ? MIN_DATE : today;
    setModal({ date: ymd(target), editId: null });
  };

  const onSaveEvent = (ev: CalendarEvent, recurrence: Recurrence) => {
    const isUpdate = events.some((e) => e.id === ev.id);
    const snapshot = events;

    if (!isUpdate && recurrence !== "none") {
      const dates = generateOccurrenceDates(ev.date, recurrence);
      const occurrences: CalendarEvent[] = dates.map((date, i) => ({
        ...ev,
        id: i === 0 ? ev.id : crypto.randomUUID(),
        date,
      }));
      setEvents((prev) => [...prev, ...occurrences]);
      setModal((prev) => (prev ? { date: ev.date, editId: null } : prev));

      mergeEvents(occurrences)
        .then(() => {
          showToast(
            `Added ${occurrences.length} event${occurrences.length === 1 ? "" : "s"}`,
          );
        })
        .catch(() => {
          setEvents(snapshot);
          showToast("Save failed — changes rolled back");
        });
      return;
    }

    setEvents((prev) =>
      isUpdate
        ? prev.map((e) => (e.id === ev.id ? ev : e))
        : [...prev, ev],
    );
    setModal((prev) => (prev ? { date: ev.date, editId: null } : prev));

    upsertEvent(ev)
      .then((saved) => {
        setEvents((prev) =>
          prev.map((e) => (e.id === saved.id ? saved : e)),
        );
        showToast(isUpdate ? "Event updated" : "Event added");
      })
      .catch(() => {
        setEvents(snapshot);
        showToast("Save failed — changes rolled back");
      });
  };

  const onDeleteEvent = (id: string) => {
    const snapshot = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModal((prev) =>
      prev && prev.editId === id ? { date: prev.date, editId: null } : prev,
    );

    deleteEventById(id)
      .then(() => showToast("Event deleted"))
      .catch(() => {
        setEvents(snapshot);
        showToast("Delete failed — restored");
      });
  };

  const onEditEvent = (ev: CalendarEvent) =>
    setModal({ date: ev.date, editId: ev.id });

  const onCancelEdit = () =>
    setModal((prev) => (prev ? { date: prev.date, editId: null } : prev));

  const editingEvent =
    modal && modal.editId
      ? events.find((e) => e.id === modal.editId) ?? null
      : null;

  const onExport = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            brand: "Ditch Hospitality Group",
            events,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ditch-content-calendar-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Calendar exported");
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        showToast("Invalid JSON file");
        return;
      }
      const raw = Array.isArray(parsed)
        ? parsed
        : (parsed as { events?: unknown[] })?.events;
      if (!Array.isArray(raw)) {
        showToast("Invalid format: no events array");
        return;
      }
      const incoming = normalizeImported(raw);
      if (incoming.length === 0) {
        showToast("No valid events found in file");
        return;
      }
      const choice = confirm(
        `Click OK to MERGE ${incoming.length} events with existing.\nClick Cancel to REPLACE all events with these.`,
      );
      try {
        if (choice) {
          await mergeEvents(incoming);
          showToast(`Merged ${incoming.length} events`);
        } else {
          await replaceAllEvents(incoming);
          showToast(`Replaced with ${incoming.length} events`);
        }
        const rows = await fetchEvents();
        setEvents(rows);
      } catch (err) {
        showToast(
          `Import failed: ${err instanceof Error ? err.message : "unknown error"}`,
        );
      }
    };
    input.click();
  };

  useEffect(() => {
    if (modal) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "t" || e.key === "T") {
        goToday();
      } else if (e.key === "m" || e.key === "M") {
        setView("month");
      } else if (e.key === "w" || e.key === "W") {
        setView("week");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, view, cursor]);

  return (
    <div className="page-calendar mx-auto max-w-[1400px] px-5 pt-6 pb-15 print:max-w-none print:px-0 print:pt-0 print:pb-0">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="calendar"
        title="Content Calendar"
        subtitle="April 2026 onward · Brand & Marketing"
        actions={
          <CalendarToolbar
            view={view}
            prevDisabled={navDisabled.prev}
            nextDisabled={navDisabled.next}
            onViewChange={setView}
            onPrev={() => navigate(-1)}
            onToday={goToday}
            onNext={() => navigate(1)}
            onPrint={() => window.print()}
            onExport={onExport}
            onImport={onImport}
            onNewEvent={onNewEvent}
          />
        }
      />

      <FilterBar active={filters} onToggle={toggleFilter} />

      <div className="mb-3 px-0 font-bebas text-[32px] tracking-[0.04em] text-navy print:mb-2 print:text-[20px] print:text-black">
        {periodLabel(view, cursor)}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start print:block">
        <div className="min-w-0 xl:flex-1">
          {view === "month" ? (
            <MonthView
              cursor={cursor}
              events={visibleEvents}
              scriptedEventIds={scriptedEventIds}
              onDayClick={onDayClick}
              onEventClick={onEventClick}
            />
          ) : (
            <WeekView
              cursor={cursor}
              events={visibleEvents}
              scriptedEventIds={scriptedEventIds}
              onDayClick={onDayClick}
              onEventClick={onEventClick}
            />
          )}
        </div>
        <div className="xl:w-[340px] xl:shrink-0 print:hidden">
          <NotesPanel showToast={showToast} />
        </div>
      </div>

      <PrintBreakdown events={events} view={view} cursor={cursor} />

      <Legend />

      <p className="mt-5 text-center font-caveat text-base text-muted print:hidden">
        spread joy. build community. surf well.
      </p>

      {modal && (
        <EventModal
          key={`${modal.date}-${modal.editId ?? "new"}`}
          date={modal.date}
          initialEvent={editingEvent}
          events={events}
          onClose={() => setModal(null)}
          onSave={onSaveEvent}
          onDelete={onDeleteEvent}
          onEdit={onEditEvent}
          onCancelEdit={onCancelEdit}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
