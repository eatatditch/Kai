"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../AppShell";
import { Toast } from "../Toast";
import { ScriptsTabsNav } from "./ScriptsTabsNav";
import {
  deleteGeneratedScript,
  fetchGeneratedScripts,
  setGeneratedScriptEvent,
} from "@/lib/scripts/api";
import { fetchEvents } from "@/lib/events-api";
import { getType, isScriptableEventType } from "@/lib/event-types";
import { parseYmd } from "@/lib/date-utils";
import type { CalendarEvent } from "@/types";
import type { GeneratedScript, ScriptVariant } from "@/lib/scripts/types";
import { estimateRuntimeSeconds } from "@/lib/scripts/format";
import { exportAllScriptsPdf } from "./pdfExport";

type Props = {
  userEmail: string;
  isAdmin: boolean;
};

export function ScriptsLibrary({ userEmail, isAdmin }: Props) {
  const search = useSearchParams();
  const initialOpenId = search?.get("open") ?? null;

  const [items, setItems] = useState<GeneratedScript[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    Promise.all([fetchGeneratedScripts(), fetchEvents()])
      .then(([scripts, evs]) => {
        if (!active) return;
        setItems(scripts);
        setEvents(evs);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          showToast("Failed to load library");
        }
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  // If we deep-linked to an open script, scroll it into view once loaded.
  useEffect(() => {
    if (!loading && initialOpenId) {
      const el = document.getElementById(`script-row-${initialOpenId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, initialOpenId]);

  const eventsById = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const e of events) map.set(e.id, e);
    return map;
  }, [events]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this saved set of variants?")) return;
    try {
      await deleteGeneratedScript(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      if (openId === id) setOpenId(null);
      showToast("Deleted");
    } catch {
      showToast("Delete failed");
    }
  };

  const onExportAll = async (variants: ScriptVariant[]) => {
    try {
      await exportAllScriptsPdf(variants);
    } catch {
      showToast("Export failed");
    }
  };

  const onLinkToEvent = async (scriptId: string, eventId: string | null) => {
    try {
      await setGeneratedScriptEvent(scriptId, eventId);
      setItems((prev) =>
        prev.map((s) => (s.id === scriptId ? { ...s, event_id: eventId } : s)),
      );
      showToast(eventId ? "Linked to event" : "Unlinked");
    } catch {
      showToast("Link failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-15">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="scripts"
        homeHref="/scripts"
        title="Script Library"
        subtitle="Saved variants from past briefs"
        printHidden
        actions={
          <Link
            href="/scripts"
            className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-orange bg-orange px-3.5 py-2.5 font-dm text-[13px] font-semibold text-white shadow-card transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
          >
            ＋ New Brief
          </Link>
        }
      />
      <ScriptsTabsNav active="library" />

      {loading ? (
        <p className="text-[14px] text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-[10px] border-[1.5px] border-line bg-white px-6 py-12 text-center shadow-card">
          <p className="m-0 font-bebas text-[20px] tracking-[0.08em] text-muted">
            NOTHING SAVED YET
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Generate variants on the{" "}
            <Link
              href="/scripts"
              className="font-semibold text-orange underline-offset-2 hover:underline"
            >
              Scripts generator
            </Link>{" "}
            and click <span className="font-semibold">Save all to library</span>.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <LibraryRow
              key={item.id}
              item={item}
              linkedEvent={item.event_id ? eventsById.get(item.event_id) ?? null : null}
              events={events}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((prev) => (prev === item.id ? null : item.id))
              }
              onDelete={() => onDelete(item.id)}
              onExportAll={() => onExportAll(item.variants_json)}
              onLinkToEvent={(eventId) => onLinkToEvent(item.id, eventId)}
            />
          ))}
        </ul>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}

function LibraryRow({
  item,
  linkedEvent,
  events,
  open,
  onToggle,
  onDelete,
  onExportAll,
  onLinkToEvent,
}: {
  item: GeneratedScript;
  linkedEvent: CalendarEvent | null;
  events: CalendarEvent[];
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExportAll: () => void;
  onLinkToEvent: (eventId: string | null) => void;
}) {
  const created = useMemo(
    () =>
      new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [item.created_at],
  );

  return (
    <li id={`script-row-${item.id}`}>
      <article className="rounded-[10px] border-[1.5px] border-line bg-white shadow-card">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-sand"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              {item.brand && (
                <span className="rounded-full border border-line bg-cream px-2 py-0.5 text-navy">
                  {item.brand}
                </span>
              )}
              {item.length && <span>{item.length}</span>}
              <span>{created}</span>
              <span>
                {item.variants_json.length} variant
                {item.variants_json.length === 1 ? "" : "s"}
              </span>
              {linkedEvent && (
                <span className="rounded-full border border-navy bg-navy-tint px-2 py-0.5 text-navy">
                  📝 {linkedEvent.title}
                </span>
              )}
            </div>
            <h3 className="m-0 truncate font-bebas text-[20px] leading-tight tracking-[0.04em] text-navy">
              {item.topic || "Untitled brief"}
            </h3>
          </div>
          <span
            className="font-bebas text-[18px] text-muted"
            aria-hidden="true"
          >
            {open ? "−" : "+"}
          </span>
        </button>

        {open && (
          <div className="border-t border-dashed border-line px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onExportAll}
                className="rounded-sm border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors duration-150 hover:bg-sand"
              >
                Export all to PDF
              </button>
              <CompanionLinks scriptId={item.id} item={item} />
              <EventLinkPicker
                events={events}
                currentEventId={item.event_id}
                onChange={onLinkToEvent}
              />
              <button
                type="button"
                onClick={onDelete}
                className="ml-auto rounded-sm border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-muted transition-colors duration-150 hover:border-[var(--cat-event)] hover:text-[var(--cat-event)]"
              >
                Delete
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {item.variants_json.map((v, idx) => {
                const runtime =
                  v.runtime_estimate_seconds || estimateRuntimeSeconds(v.script);
                return (
                  <div
                    key={idx}
                    className="rounded-sm border border-line bg-cream p-3"
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <h4 className="m-0 font-bebas text-[18px] leading-tight tracking-[0.04em] text-navy">
                        {v.name}
                      </h4>
                      <span className="font-bebas text-[14px] tracking-[0.04em] text-muted">
                        ~{runtime}s
                      </span>
                    </div>
                    <p className="m-0 mb-2 text-[12px] italic text-muted">
                      {v.angle}
                    </p>
                    <pre className="m-0 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-white px-3 py-2 font-mono text-[12px] leading-[1.55] text-ink">
                      {v.script}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </li>
  );
}

function CompanionLinks({
  scriptId,
  item,
}: {
  scriptId: string;
  item: GeneratedScript;
}) {
  const baseParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("fromScriptId", scriptId);
    if (item.event_id) p.set("eventId", item.event_id);
    if (item.profile_id) p.set("profile", item.profile_id);
    if (item.topic) p.set("topic", item.topic);
    const facts = item.brief_json?.facts;
    if (facts) p.set("facts", facts);
    return p.toString();
  }, [scriptId, item]);

  const linkCls =
    "rounded-sm border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors duration-150 hover:bg-sand";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
        Make
      </span>
      <Link href={`/scripts/captions?${baseParams}`} className={linkCls}>
        Captions
      </Link>
      <Link href={`/scripts/email?${baseParams}`} className={linkCls}>
        Email
      </Link>
      <Link href={`/scripts/sms?${baseParams}`} className={linkCls}>
        SMS
      </Link>
    </div>
  );
}

function EventLinkPicker({
  events,
  currentEventId,
  onChange,
}: {
  events: CalendarEvent[];
  currentEventId: string | null;
  onChange: (eventId: string | null) => void;
}) {
  // Only offer scriptable events as link targets, sorted newest first.
  const candidates = useMemo(() => {
    return events
      .filter((e) => isScriptableEventType(e.type))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [events]);

  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
        Event
      </label>
      <select
        value={currentEventId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-sm border border-line bg-white px-2 py-1 text-[12px] text-ink focus:border-orange focus:outline-none focus:ring-[2px] focus:ring-orange/15"
      >
        <option value="">— Not linked —</option>
        {candidates.map((e) => {
          const t = getType(e.type);
          const niceDate = parseYmd(e.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <option key={e.id} value={e.id}>
              {niceDate} · {t.emoji} {e.title}
            </option>
          );
        })}
      </select>
    </div>
  );
}
