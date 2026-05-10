"use client";

import { useState, useTransition } from "react";
import { addItem, deleteItem, toggleItem } from "@/app/sync/actions";
import type { SyncBucket, SyncItem, SyncOwner } from "@/types";

type Props = {
  title: string;
  eyebrow: string;
  bucket: SyncBucket;
  items: SyncItem[];
  isoYear: number;
  isoWeek: number;
  readOnly?: boolean;
  onError?: (msg: string) => void;
  onLocalAdd?: (item: SyncItem) => void;
  onLocalUpdate?: (item: SyncItem) => void;
  onLocalDelete?: (id: string) => void;
};

const OWNER_OPTIONS: { value: SyncOwner; label: string }[] = [
  { value: "I", label: "I" },
  { value: "T", label: "T" },
  { value: "—", label: "—" },
];

const OWNER_BADGE: Record<SyncOwner, string> = {
  I: "bg-orange text-white",
  T: "bg-navy text-white",
  "—": "bg-cream text-muted border border-line",
};

export function ItemList({
  title,
  eyebrow,
  bucket,
  items,
  isoYear,
  isoWeek,
  readOnly = false,
  onError,
  onLocalAdd,
  onLocalUpdate,
  onLocalDelete,
}: Props) {
  const [draft, setDraft] = useState("");
  const [draftOwner, setDraftOwner] = useState<SyncOwner>("I");
  const [pending, startTransition] = useTransition();

  const onToggle = (item: SyncItem) => {
    if (readOnly) return;
    const next = !item.done;
    onLocalUpdate?.({
      ...item,
      done: next,
      doneAt: next ? new Date().toISOString() : undefined,
    });
    startTransition(async () => {
      const res = await toggleItem(item.id, next);
      if (!res.ok) onError?.(res.error);
    });
  };

  const onDelete = (item: SyncItem) => {
    if (readOnly) return;
    onLocalDelete?.(item.id);
    startTransition(async () => {
      const res = await deleteItem(item.id);
      if (!res.ok) onError?.(res.error);
    });
  };

  const onAdd = () => {
    const body = draft.trim();
    if (!body || readOnly) return;

    const tempId = `tmp-${crypto.randomUUID()}`;
    onLocalAdd?.({
      id: tempId,
      bucket,
      body,
      owner: draftOwner,
      done: false,
      sortOrder: items.length,
      createdAt: new Date().toISOString(),
      isoYear,
      isoWeek,
    });
    setDraft("");

    startTransition(async () => {
      const res = await addItem({
        bucket,
        body,
        owner: draftOwner,
        isoYear,
        isoWeek,
      });
      if (!res.ok) {
        onLocalDelete?.(tempId);
        onError?.(res.error);
      } else {
        // Real row will arrive via realtime; remove the temp row.
        onLocalDelete?.(tempId);
      }
    });
  };

  return (
    <div
      className={`flex flex-col rounded-[10px] border-[1.5px] border-ink bg-white p-4 print:border-black ${pending ? "opacity-95" : ""}`}
    >
      <div className="mb-2 flex items-end justify-between border-b border-dashed border-line pb-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {`// ${eyebrow}`}
          </div>
          <h3 className="mt-0.5 font-bebas text-[22px] leading-none tracking-[0.02em] text-ink">
            <span className="italic">{title}</span>
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {items.filter((i) => !i.done).length} open
        </span>
      </div>

      <ul className="flex flex-col">
        {items.length === 0 && (
          <li className="py-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {`// empty`}
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-start gap-2.5 border-b border-dotted border-line py-2 last:border-b-0"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              disabled={readOnly}
              onClick={() => onToggle(item)}
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] transition-colors ${
                item.done
                  ? "border-sage bg-sage text-white"
                  : "border-ink bg-white hover:bg-sand"
              } print:border-black`}
            >
              {item.done && (
                <span className="text-[10px] leading-none">✓</span>
              )}
            </button>

            <span
              onClick={() => !readOnly && onToggle(item)}
              className={`flex-1 cursor-pointer text-[13px] leading-snug ${item.done ? "text-muted line-through" : "text-ink"}`}
            >
              {item.body}
            </span>

            <span
              className={`shrink-0 rounded-[3px] px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.14em] ${OWNER_BADGE[item.owner]}`}
            >
              {item.owner}
            </span>

            {!readOnly && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                aria-label="Delete item"
                className="shrink-0 text-[14px] leading-none text-muted opacity-0 transition-opacity hover:text-orange group-hover:opacity-100 print:hidden"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="mt-3 flex items-center gap-2 print:hidden">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            placeholder="Add item…"
            className="min-w-0 flex-1 rounded-[6px] border-[1.5px] border-line bg-cream px-2.5 py-1.5 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <select
            value={draftOwner}
            onChange={(e) => setDraftOwner(e.target.value as SyncOwner)}
            className="rounded-[6px] border-[1.5px] border-line bg-cream px-2 py-1.5 font-mono text-[12px] text-ink focus:border-ink focus:outline-none"
            aria-label="Owner"
          >
            {OWNER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAdd}
            disabled={!draft.trim()}
            className="rounded-[6px] border-[1.5px] border-ink bg-ink px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-cream transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
