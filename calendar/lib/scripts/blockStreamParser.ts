/**
 * Generic streaming parser for label-prefixed text blocks separated by a
 * delimiter line. Used by /scripts (NAME/ANGLE/RUNTIME/SCRIPT), captions,
 * email, and SMS — each with a different field spec.
 *
 * Spec example for scripts:
 *   {
 *     delimiter: "<<<END_VARIANT>>>",
 *     fields: [
 *       { label: "NAME",    multiline: false, kind: "string" },
 *       { label: "ANGLE",   multiline: false, kind: "string" },
 *       { label: "RUNTIME", multiline: false, kind: "number" },
 *       { label: "SCRIPT",  multiline: true,  kind: "string" },
 *     ],
 *   }
 */

export type FieldKind = "string" | "number";

export type FieldSpec = {
  label: string;
  multiline: boolean;
  kind: FieldKind;
};

export type ParserSpec = {
  delimiter: string;
  fields: FieldSpec[];
};

export type ParsedBlock = {
  values: Record<string, string | number>;
  complete: boolean;
};

type State = {
  finished: ParsedBlock[];
  current: Record<string, string | number> | null;
  field: string | null;
  buffer: string;
};

function freshState(): State {
  return { finished: [], current: null, field: null, buffer: "" };
}

function emptyValues(spec: ParserSpec): Record<string, string | number> {
  const v: Record<string, string | number> = {};
  for (const f of spec.fields) v[f.label] = f.kind === "number" ? 0 : "";
  return v;
}

function startBlock(state: State, spec: ParserSpec) {
  state.current = emptyValues(spec);
  state.field = null;
}

function commitLine(state: State, spec: ParserSpec, line: string) {
  if (!state.current) startBlock(state, spec);
  const cur = state.current!;

  // Try to match against any of the spec's labels.
  for (const f of spec.fields) {
    const labelRe = new RegExp(`^${f.label}\\s*:\\s?(.*)$`, "i");
    const match = line.match(labelRe);
    if (match) {
      const rest = match[1];
      state.field = f.label;
      if (f.multiline) {
        if (rest) cur[f.label] = rest;
      } else if (f.kind === "number") {
        const n = parseInt(rest.trim(), 10);
        cur[f.label] = Number.isFinite(n) ? n : 0;
      } else {
        cur[f.label] = rest.trim();
      }
      return;
    }
  }

  // No label matched. If we're inside a multiline field, append; otherwise
  // ignore (e.g. a stray blank line between fields).
  if (state.field) {
    const f = spec.fields.find((x) => x.label === state.field);
    if (f?.multiline) {
      const prev = String(cur[f.label] ?? "");
      cur[f.label] = (prev ? prev + "\n" : "") + line;
    }
  }
}

function finalizeCurrent(state: State, spec: ParserSpec, complete: boolean) {
  if (!state.current) return;
  // Trim trailing whitespace on multiline fields for cleanliness.
  for (const f of spec.fields) {
    if (f.multiline && typeof state.current[f.label] === "string") {
      state.current[f.label] = (state.current[f.label] as string).trimEnd();
    }
  }
  state.finished.push({ values: state.current, complete });
  state.current = null;
  state.field = null;
}

export function makeBlockStreamParser(spec: ParserSpec) {
  const state = freshState();

  return {
    feed(chunk: string): {
      blocks: ParsedBlock[];
      inProgress: ParsedBlock | null;
    } {
      state.buffer += chunk;

      let nlIdx: number;
      while ((nlIdx = state.buffer.indexOf("\n")) !== -1) {
        const line = state.buffer.slice(0, nlIdx);
        state.buffer = state.buffer.slice(nlIdx + 1);

        if (line.trim() === spec.delimiter) {
          finalizeCurrent(state, spec, true);
          continue;
        }
        commitLine(state, spec, line);
      }

      // Snapshot current block including trailing buffer for live cursor feel.
      let inProgress: ParsedBlock | null = null;
      if (state.current) {
        const draft: Record<string, string | number> = { ...state.current };
        // If the trailing buffer is starting a new label (e.g. "ANGLE: ")
        // don't fold it into the previous field — the user briefly seeing
        // "...DisclaimerANGLE: " is uglier than missing a few tokens.
        const startsNewLabel =
          state.buffer.length > 0 &&
          spec.fields.some((f) =>
            new RegExp(`^${f.label}\\s*:`, "i").test(state.buffer),
          );
        if (state.field && state.buffer && !startsNewLabel) {
          const f = spec.fields.find((x) => x.label === state.field);
          if (f) {
            if (f.multiline) {
              const prev = String(draft[f.label] ?? "");
              draft[f.label] = (prev ? prev + "\n" : "") + state.buffer;
            } else if (f.kind === "string") {
              draft[f.label] = String(draft[f.label] ?? "") + state.buffer;
            }
          }
        }
        inProgress = { values: draft, complete: false };
      }

      return { blocks: state.finished.slice(), inProgress };
    },

    end(): ParsedBlock[] {
      if (state.buffer.length > 0) {
        const tail = state.buffer;
        state.buffer = "";
        if (tail.trim() === spec.delimiter) {
          finalizeCurrent(state, spec, true);
        } else {
          commitLine(state, spec, tail);
        }
      }
      if (state.current) finalizeCurrent(state, spec, false);
      return state.finished.slice();
    },
  };
}
