"use client";

import { useRef } from "react";

type DraftReference = {
  key: string;
  id?: string;
  title: string;
  content: string;
  source_format: "paste" | "txt" | "md" | "pdf" | "docx";
};

type Props = {
  references: DraftReference[];
  onUpdate: (key: string, patch: Partial<DraftReference>) => void;
  onRemove: (key: string) => void;
  onUploadFile: (key: string, file: File) => void;
  onAddPaste: () => void;
};

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted";
const inputCls =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15";

export function ReferenceList({
  references,
  onUpdate,
  onRemove,
  onUploadFile,
  onAddPaste,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {references.map((r, idx) => (
        <ReferenceBlock
          key={r.key}
          index={idx}
          reference={r}
          onUpdate={(patch) => onUpdate(r.key, patch)}
          onRemove={() => onRemove(r.key)}
          onUploadFile={(file) => onUploadFile(r.key, file)}
        />
      ))}
      <button
        type="button"
        onClick={onAddPaste}
        className="self-start rounded-sm border border-dashed border-line bg-cream px-3 py-2 text-[12px] font-semibold text-muted transition-colors duration-150 hover:border-orange hover:text-orange"
      >
        + Add another reference
      </button>
      <p className="text-[11px] text-muted">
        Paste in 2–5 scripts in the same writer&apos;s voice. .txt, .md, .pdf,
        and .docx uploads also work.
      </p>
    </div>
  );
}

function ReferenceBlock({
  index,
  reference,
  onUpdate,
  onRemove,
  onUploadFile,
}: {
  index: number;
  reference: DraftReference;
  onUpdate: (patch: Partial<DraftReference>) => void;
  onRemove: () => void;
  onUploadFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-sm border-[1.5px] border-line bg-cream p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bebas text-[14px] tracking-[0.1em] text-navy">
          REFERENCE {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-semibold text-ink transition-colors duration-150 hover:bg-sand"
          >
            Upload file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={onRemove}
            className="rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-semibold text-muted transition-colors duration-150 hover:border-[var(--cat-event)] hover:text-[var(--cat-event)]"
            aria-label={`Remove reference ${index + 1}`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mb-2">
        <label className={labelCls} htmlFor={`ref-title-${reference.key}`}>
          Title
        </label>
        <input
          id={`ref-title-${reference.key}`}
          type="text"
          value={reference.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Margarita MasterClass :30"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor={`ref-content-${reference.key}`}>
          Script
        </label>
        <textarea
          id={`ref-content-${reference.key}`}
          value={reference.content}
          onChange={(e) =>
            onUpdate({ content: e.target.value, source_format: "paste" })
          }
          rows={6}
          placeholder="Paste the full script here…"
          className={`${inputCls} min-h-[140px] resize-y font-mono text-[12.5px] leading-[1.55]`}
        />
        {reference.source_format !== "paste" && reference.content && (
          <p className="mt-1 text-[11px] text-muted">
            Imported from .{reference.source_format}. Edit above if anything got
            mangled.
          </p>
        )}
      </div>
    </div>
  );
}
