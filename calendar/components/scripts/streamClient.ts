"use client";

import {
  makeBlockStreamParser,
  type ParsedBlock,
  type ParserSpec,
} from "@/lib/scripts/blockStreamParser";

/**
 * POST a brief, stream the response, and emit live snapshots to
 * `onSnap`. Returns the final array of blocks once the stream ends.
 */
export async function consumeBlockStream(
  url: string,
  body: unknown,
  spec: ParserSpec,
  onSnap: (blocks: ParsedBlock[], inProgress: ParsedBlock | null) => void,
): Promise<ParsedBlock[]> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = makeBlockStreamParser(spec);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const snap = parser.feed(chunk);
    onSnap(snap.blocks, snap.inProgress);
  }
  return parser.end();
}
