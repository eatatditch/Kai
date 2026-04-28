import type { ScriptVariant } from "./types";

const VO_LINE_RE = /^\s*VO\s*:\s*/i;
const ON_SCREEN_LINE_RE = /^\s*ON-SCREEN\s*:\s*/i;
const VISUAL_LINE_RE = /^\s*\[VISUAL\s*:/i;
const SFX_LINE_RE = /^\s*SFX\s*:/i;

export function estimateRuntimeSeconds(script: string): number {
  const voWords = script
    .split(/\r?\n/)
    .filter((line) => VO_LINE_RE.test(line))
    .map((line) => line.replace(VO_LINE_RE, ""))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (voWords === 0) return 0;
  return Math.round(voWords / 2.5);
}

export function extractCleanText(script: string): string {
  const lines = script.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (VISUAL_LINE_RE.test(line)) continue;
    if (SFX_LINE_RE.test(line)) continue;
    if (ON_SCREEN_LINE_RE.test(line)) {
      out.push(line.replace(ON_SCREEN_LINE_RE, "").trim());
      continue;
    }
    if (VO_LINE_RE.test(line)) {
      out.push(line.replace(VO_LINE_RE, "").trim());
      continue;
    }
    out.push(line);
  }
  return out.filter(Boolean).join("\n\n");
}

export function variantToCopyText(v: ScriptVariant): string {
  return `${v.name.toUpperCase()}\n\n${extractCleanText(v.script)}`;
}
