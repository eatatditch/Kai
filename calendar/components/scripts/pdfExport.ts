"use client";

import type { ScriptVariant } from "@/lib/scripts/types";
import { estimateRuntimeSeconds } from "@/lib/scripts/format";

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportScriptPdf(
  variant: ScriptVariant,
  index: number,
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const { buildScriptPdf } = await import("./ScriptPdfDoc");
  const runtime =
    variant.runtime_estimate_seconds || estimateRuntimeSeconds(variant.script);
  const blob = await pdf(
    buildScriptPdf({
      variants: [variant],
      meta: {
        runtime,
        date: new Date().toISOString().slice(0, 10),
        variantNumber: index + 1,
      },
    }),
  ).toBlob();
  const slug = variant.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  await downloadBlob(blob, `script-${slug || "variant"}.pdf`);
}

export async function exportAllScriptsPdf(
  variants: ScriptVariant[],
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const { buildScriptPdf } = await import("./ScriptPdfDoc");
  const blob = await pdf(
    buildScriptPdf({
      variants,
      meta: { date: new Date().toISOString().slice(0, 10) },
    }),
  ).toBlob();
  await downloadBlob(blob, `scripts-${new Date().toISOString().slice(0, 10)}.pdf`);
}
