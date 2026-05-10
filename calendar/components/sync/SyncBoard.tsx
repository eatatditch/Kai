"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Toast } from "@/components/Toast";
import { MindMap } from "./MindMap";
import { CadenceGrid } from "./CadenceGrid";
import { ContentRoadmap } from "./ContentRoadmap";
import { ItemList } from "./ItemList";
import { AccountabilityBar } from "./AccountabilityBar";
import { SectionHeader } from "./SectionHeader";
import {
  subscribeItems,
  subscribeReadings,
  subscribeRoadmap,
} from "@/lib/sync-api";
import type {
  CadenceMeter,
  CadenceReading,
  RoadmapMonth,
  SyncItem,
} from "@/types";

type Props = {
  userEmail: string;
  isAdmin: boolean;
  isoYear: number;
  isoWeek: number;
  weekLabel: string;
  meters: CadenceMeter[];
  readings: CadenceReading[];
  roadmap: RoadmapMonth[];
  items: SyncItem[];
  readOnly?: boolean;
  weekHeading?: string;
};

export function SyncBoard({
  userEmail,
  isAdmin,
  isoYear,
  isoWeek,
  weekLabel,
  meters,
  readings: initialReadings,
  roadmap: initialRoadmap,
  items: initialItems,
  readOnly = false,
  weekHeading,
}: Props) {
  const [readings, setReadings] = useState<CadenceReading[]>(initialReadings);
  const [roadmap, setRoadmap] = useState<RoadmapMonth[]>(initialRoadmap);
  const [items, setItems] = useState<SyncItem[]>(initialItems);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    if (readOnly) return;
    const off = subscribeReadings(isoYear, isoWeek, (c) => {
      if (c.kind === "delete") {
        setReadings((p) => p.filter((r) => r.id !== c.id));
      } else {
        setReadings((p) => {
          const idx = p.findIndex((r) => r.id === c.reading.id);
          if (idx === -1) return [...p, c.reading];
          const next = p.slice();
          next[idx] = c.reading;
          return next;
        });
      }
    });
    return off;
  }, [isoYear, isoWeek, readOnly]);

  useEffect(() => {
    if (readOnly) return;
    const off = subscribeRoadmap((c) => {
      if (c.kind === "delete") {
        setRoadmap((p) => p.filter((m) => m.id !== c.id));
      } else {
        setRoadmap((p) => {
          const idx = p.findIndex((m) => m.id === c.month.id);
          if (idx === -1) return [...p, c.month];
          const next = p.slice();
          next[idx] = c.month;
          return next;
        });
      }
    });
    return off;
  }, [readOnly]);

  useEffect(() => {
    if (readOnly) return;
    const off = subscribeItems((c) => {
      if (c.kind === "delete") {
        setItems((p) => p.filter((i) => i.id !== c.id));
      } else {
        setItems((p) => {
          const incoming = c.item;
          // For thisweek items, keep only the current week.
          if (
            incoming.bucket === "thisweek" &&
            (incoming.isoYear !== isoYear || incoming.isoWeek !== isoWeek)
          ) {
            return p.filter((i) => i.id !== incoming.id);
          }
          const idx = p.findIndex((i) => i.id === incoming.id);
          if (idx === -1) return [...p, incoming];
          const next = p.slice();
          next[idx] = incoming;
          return next;
        });
      }
    });
    return off;
  }, [isoYear, isoWeek, readOnly]);

  const thisweekItems = useMemo(
    () => items.filter((i) => i.bucket === "thisweek"),
    [items],
  );
  const radarItems = useMemo(
    () => items.filter((i) => i.bucket === "radar"),
    [items],
  );

  return (
    <div className="page-sync mx-auto max-w-[1180px] px-5 pt-6 pb-15 print:px-0 print:pt-0">
      <AppShell
        userEmail={userEmail}
        isAdmin={isAdmin}
        current="sync"
        homeHref="/sync"
        eyebrow="Marketing Operating Picture"
        title="Weekly Sync"
        subtitle={weekHeading ?? `Week of ${weekLabel}`}
        actions={
          !readOnly && (
            <>
              <Link
                href="/sync/archive"
                className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
              >
                Archive
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-ink bg-white px-3.5 py-2.5 font-dm text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:bg-sand"
              >
                Print
              </button>
            </>
          )
        }
      />

      <section
        id="mindmap"
        className="mb-7 rounded-[10px] border-[1.5px] border-ink bg-cream p-5 print:border-black print:p-3"
        style={{ boxShadow: "6px 6px 0 0 var(--ink)" }}
      >
        <SectionHeader
          eyebrow="Operating Picture"
          title="Mind map"
          right={
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {isoYear} · W{String(isoWeek).padStart(2, "0")}
            </span>
          }
        />
        <MindMap meters={meters} readings={readings} roadmap={roadmap} />
      </section>

      <section id="cadence" className="mb-7">
        <SectionHeader
          eyebrow="Cadence Meters"
          title={<span className="italic">Cadence meters</span>}
          right={
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              vs. weekly target
            </span>
          }
        />
        <CadenceGrid
          meters={meters}
          readings={readings}
          isoYear={isoYear}
          isoWeek={isoWeek}
          readOnly={readOnly}
          onError={showToast}
          onLocalUpdate={(reading) => {
            setReadings((p) => {
              const idx = p.findIndex((r) => r.meterId === reading.meterId);
              if (idx === -1) return [...p, reading];
              const next = p.slice();
              next[idx] = reading;
              return next;
            });
          }}
        />
      </section>

      <section id="roadmap" className="mb-7">
        <SectionHeader
          eyebrow="Content Roadmap"
          title={<span className="italic">Content roadmap</span>}
          right={
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              click to cycle status
            </span>
          }
        />
        <ContentRoadmap
          months={roadmap}
          readOnly={readOnly}
          onError={showToast}
          onLocalUpdate={(month) => {
            setRoadmap((p) => p.map((m) => (m.id === month.id ? month : m)));
          }}
        />
      </section>

      <section
        id="items"
        className="mb-7 grid gap-5 md:grid-cols-2 print:grid-cols-2 print:gap-3"
      >
        <ItemList
          title="This week"
          eyebrow="Action — this week"
          bucket="thisweek"
          items={thisweekItems}
          isoYear={isoYear}
          isoWeek={isoWeek}
          readOnly={readOnly}
          onError={showToast}
          onLocalAdd={(item) => setItems((p) => [...p, item])}
          onLocalUpdate={(item) =>
            setItems((p) => p.map((i) => (i.id === item.id ? item : i)))
          }
          onLocalDelete={(id) => setItems((p) => p.filter((i) => i.id !== id))}
        />
        <ItemList
          title="Radar"
          eyebrow="Action — radar"
          bucket="radar"
          items={radarItems}
          isoYear={isoYear}
          isoWeek={isoWeek}
          readOnly={readOnly}
          onError={showToast}
          onLocalAdd={(item) => setItems((p) => [...p, item])}
          onLocalUpdate={(item) =>
            setItems((p) => p.map((i) => (i.id === item.id ? item : i)))
          }
          onLocalDelete={(id) => setItems((p) => p.filter((i) => i.id !== id))}
        />
      </section>

      <section id="accountability">
        <AccountabilityBar items={thisweekItems} />
      </section>

      <Toast message={toast} />
    </div>
  );
}
