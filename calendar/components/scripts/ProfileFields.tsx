"use client";

import type { VoiceProfileJson } from "@/lib/scripts/types";

type Props = {
  value: VoiceProfileJson;
  onChange: (next: VoiceProfileJson) => void;
};

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const inputCls =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15";

export function ProfileFields({ value, onChange }: Props) {
  const update = (patch: Partial<VoiceProfileJson>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card">
      <h3 className="m-0 font-bebas text-[18px] tracking-[0.1em] text-navy">
        EXTRACTED PROFILE
      </h3>

      <div>
        <label className={labelCls} htmlFor="voice-summary">
          Voice Summary
        </label>
        <textarea
          id="voice-summary"
          value={value.voice_summary}
          onChange={(e) => update({ voice_summary: e.target.value })}
          rows={3}
          className={`${inputCls} min-h-[70px] resize-y`}
        />
      </div>

      <ListEditor
        label="Signature Moves"
        items={value.signature_moves}
        onChange={(items) => update({ signature_moves: items })}
        kind="multiline"
      />

      <ListEditor
        label="Vocabulary Signatures"
        items={value.vocabulary_signatures}
        onChange={(items) => update({ vocabulary_signatures: items })}
        kind="line"
      />

      <ChipEditor
        label="Banned Words"
        items={value.banned_words}
        onChange={(items) => update({ banned_words: items })}
      />

      <div>
        <label className={labelCls} htmlFor="cadence">
          Cadence Notes
        </label>
        <textarea
          id="cadence"
          value={value.cadence_notes}
          onChange={(e) => update({ cadence_notes: e.target.value })}
          rows={4}
          className={`${inputCls} min-h-[90px] resize-y`}
        />
      </div>

      <ListEditor
        label="Tonal Anchors (lines quoted from references)"
        items={value.tonal_anchors}
        onChange={(items) => update({ tonal_anchors: items })}
        kind="multiline"
        quoted
      />

      <ListEditor
        label="Format Tics"
        items={value.format_tics}
        onChange={(items) => update({ format_tics: items })}
        kind="line"
      />

      <ListEditor
        label="Do Not Imitate"
        items={value.do_not_imitate}
        onChange={(items) => update({ do_not_imitate: items })}
        kind="line"
      />
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  kind,
  quoted = false,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  kind: "line" | "multiline";
  quoted?: boolean;
}) {
  const update = (idx: number, val: string) =>
    onChange(items.map((it, i) => (i === idx ? val : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, ""]);

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex flex-col gap-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-2">
            {kind === "multiline" ? (
              <textarea
                value={it}
                onChange={(e) => update(idx, e.target.value)}
                rows={quoted ? 3 : 2}
                className={`${inputCls} min-h-[56px] resize-y ${quoted ? "italic" : ""}`}
              />
            ) : (
              <input
                type="text"
                value={it}
                onChange={(e) => update(idx, e.target.value)}
                className={inputCls}
              />
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="mt-1 rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-semibold text-muted transition-colors duration-150 hover:border-[var(--cat-event)] hover:text-[var(--cat-event)]"
              aria-label="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="self-start rounded-sm border border-dashed border-line bg-cream px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors duration-150 hover:border-orange hover:text-orange"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function ChipEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, idx) => (
          <span
            key={`${it}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-cream px-2.5 py-1 text-[12px] text-ink"
          >
            {it}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-muted transition-colors hover:text-[var(--cat-event)]"
              aria-label={`Remove ${it}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder="Add word, press Enter"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const target = e.currentTarget;
            const val = target.value.trim();
            if (!val) return;
            onChange([...items, val]);
            target.value = "";
          }}
          className="rounded-full border border-line bg-white px-3 py-1 text-[12px] text-ink focus:border-orange focus:outline-none focus:ring-[2px] focus:ring-orange/15"
        />
      </div>
    </div>
  );
}
