"use client";

import { useState } from "react";
import type { ScriptVariant } from "@/lib/scripts/types";
import { estimateRuntimeSeconds } from "@/lib/scripts/format";

type Props = {
  variant: ScriptVariant;
  index: number;
  regenerating: boolean;
  streaming?: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onUpdate: (patch: Partial<ScriptVariant>) => void;
  onLockAngle?: () => void;
};

const actionBtnCls =
  "inline-flex items-center gap-1 rounded-sm border border-line bg-white px-2.5 py-1.5 font-dm text-[12px] font-semibold text-ink transition-colors duration-150 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50";

export function VariantCard({
  variant,
  index,
  regenerating,
  streaming = false,
  onCopy,
  onRegenerate,
  onUpdate,
  onLockAngle,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const runtime =
    variant.runtime_estimate_seconds || estimateRuntimeSeconds(variant.script);

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const { exportScriptPdf } = await import("./pdfExport");
      await exportScriptPdf(variant, index);
    } catch {
      // swallow — toast handled at parent level via copy fallback
    } finally {
      setExporting(false);
    }
  };

  return (
    <article
      className={`rounded-[10px] border-[1.5px] bg-white p-5 shadow-card transition-opacity ${
        streaming
          ? "border-orange ring-[3px] ring-orange/15"
          : regenerating
            ? "border-line opacity-60"
            : "border-line"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
            Variant {index + 1}
            {streaming && (
              <span className="ml-2 inline-flex items-center gap-1 text-muted">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange" />
                writing
              </span>
            )}
          </div>
          <h3 className="m-0 min-h-[26px] font-bebas text-[24px] leading-tight tracking-[0.04em] text-navy">
            {variant.name || (streaming ? <span className="text-muted">…</span> : "")}
          </h3>
          {variant.angle ? (
            <p className="m-0 mt-1 text-[13px] italic text-muted">
              {variant.angle}
            </p>
          ) : streaming ? (
            <p className="m-0 mt-1 text-[13px] italic text-muted">…</p>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Runtime
          </div>
          <div className="font-bebas text-[20px] tracking-[0.04em] text-ink">
            {runtime ? `~${runtime}s` : "—"}
          </div>
        </div>
      </div>

      {editing && !streaming ? (
        <textarea
          value={variant.script}
          onChange={(e) => onUpdate({ script: e.target.value })}
          rows={Math.max(8, variant.script.split(/\r?\n/).length + 1)}
          className="w-full resize-y rounded-sm border-[1.5px] border-orange bg-cream px-3 py-2.5 font-mono text-[12.5px] leading-[1.55] text-ink focus:outline-none focus:ring-[3px] focus:ring-orange/15"
        />
      ) : (
        <pre className="m-0 max-h-[420px] min-h-[80px] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-cream px-3 py-2.5 font-mono text-[12.5px] leading-[1.55] text-ink">
          {variant.script}
          {streaming && variant.script && (
            <span className="ml-0.5 inline-block h-[14px] w-[7px] animate-pulse bg-ink align-middle" />
          )}
        </pre>
      )}

      {!streaming && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={actionBtnCls} onClick={onCopy}>
            Copy clean text
          </button>
          <button
            type="button"
            className={actionBtnCls}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Done editing" : "Edit"}
          </button>
          <button
            type="button"
            className={actionBtnCls}
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
          {onLockAngle && (
            <button
              type="button"
              className={actionBtnCls}
              onClick={onLockAngle}
              title="Keep this angle, generate three new drafts of it"
            >
              Lock this angle
            </button>
          )}
          <button
            type="button"
            className={actionBtnCls}
            onClick={onExportPdf}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      )}
    </article>
  );
}
