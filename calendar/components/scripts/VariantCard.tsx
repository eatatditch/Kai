"use client";

import { useState } from "react";
import type { ScriptVariant } from "@/lib/scripts/types";
import { estimateRuntimeSeconds } from "@/lib/scripts/format";

type Props = {
  variant: ScriptVariant;
  index: number;
  regenerating: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onUpdate: (patch: Partial<ScriptVariant>) => void;
};

const actionBtnCls =
  "inline-flex items-center gap-1 rounded-sm border border-line bg-white px-2.5 py-1.5 font-dm text-[12px] font-semibold text-ink transition-colors duration-150 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50";

export function VariantCard({
  variant,
  index,
  regenerating,
  onCopy,
  onRegenerate,
  onUpdate,
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
      className={`rounded-[10px] border-[1.5px] border-line bg-white p-5 shadow-card transition-opacity ${
        regenerating ? "opacity-60" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
            Variant {index + 1}
          </div>
          <h3 className="m-0 font-bebas text-[24px] leading-tight tracking-[0.04em] text-navy">
            {variant.name}
          </h3>
          <p className="m-0 mt-1 text-[13px] italic text-muted">
            {variant.angle}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Runtime
          </div>
          <div className="font-bebas text-[20px] tracking-[0.04em] text-ink">
            ~{runtime}s
          </div>
        </div>
      </div>

      {editing ? (
        <textarea
          value={variant.script}
          onChange={(e) => onUpdate({ script: e.target.value })}
          rows={Math.max(8, variant.script.split(/\r?\n/).length + 1)}
          className="w-full resize-y rounded-sm border-[1.5px] border-orange bg-cream px-3 py-2.5 font-mono text-[12.5px] leading-[1.55] text-ink focus:outline-none focus:ring-[3px] focus:ring-orange/15"
        />
      ) : (
        <pre className="m-0 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-cream px-3 py-2.5 font-mono text-[12.5px] leading-[1.55] text-ink">
          {variant.script}
        </pre>
      )}

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
        <button
          type="button"
          className={actionBtnCls}
          onClick={onExportPdf}
          disabled={exporting}
        >
          {exporting ? "Exporting…" : "Export PDF"}
        </button>
      </div>
    </article>
  );
}
