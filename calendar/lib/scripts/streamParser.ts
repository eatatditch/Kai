import type { ScriptVariant } from "./types";

export const VARIANT_DELIMITER = "<<<END_VARIANT>>>";

type Field = "name" | "angle" | "runtime" | "script";

export type ParsedVariant = ScriptVariant & {
  /** True once the closing delimiter has arrived. */
  complete: boolean;
};

type ParseState = {
  finished: ParsedVariant[];
  current: { name: string; angle: string; runtime: number; script: string } | null;
  field: Field | null;
  buffer: string;
};

function freshState(): ParseState {
  return { finished: [], current: null, field: null, buffer: "" };
}

function startVariant(state: ParseState) {
  state.current = { name: "", angle: "", runtime: 0, script: "" };
  state.field = null;
}

function commitLineToCurrent(state: ParseState, line: string) {
  if (!state.current) startVariant(state);
  const cur = state.current!;

  // Detect a label-prefixed line. SCRIPT: starts a multi-line block; the
  // others are single-line values.
  const labelMatch = line.match(/^(NAME|ANGLE|RUNTIME|SCRIPT)\s*:\s?(.*)$/);

  if (labelMatch) {
    const label = labelMatch[1].toLowerCase() as Field;
    const rest = labelMatch[2];
    if (label === "script") {
      state.field = "script";
      if (rest) cur.script += rest;
    } else if (label === "name") {
      state.field = "name";
      cur.name = rest.trim();
    } else if (label === "angle") {
      state.field = "angle";
      cur.angle = rest.trim();
    } else if (label === "runtime") {
      state.field = "runtime";
      const n = parseInt(rest.trim(), 10);
      cur.runtime = Number.isFinite(n) ? n : 0;
    }
    return;
  }

  // No label — append to the active multi-line field (only SCRIPT supports
  // multi-line; everything else stops capturing once a new label arrives).
  if (state.field === "script") {
    cur.script += (cur.script ? "\n" : "") + line;
  }
}

function finalizeCurrent(state: ParseState, complete: boolean) {
  if (!state.current) return;
  const v: ParsedVariant = {
    name: state.current.name,
    angle: state.current.angle,
    script: state.current.script.trimEnd(),
    runtime_estimate_seconds: state.current.runtime,
    complete,
  };
  state.finished.push(v);
  state.current = null;
  state.field = null;
}

/**
 * Stateful, append-only parser. Call `feed(chunk)` as text streams in;
 * each call returns the snapshot:
 *   { variants: ParsedVariant[], inProgress: ParsedVariant | null }
 *
 * `variants` only contains variants whose `${VARIANT_DELIMITER}` line has
 * arrived. `inProgress` is a live snapshot of whatever's currently being
 * written, so the UI can render it as it grows.
 */
export function makeStreamParser() {
  const state = freshState();

  return {
    feed(chunk: string): {
      variants: ParsedVariant[];
      inProgress: ParsedVariant | null;
    } {
      state.buffer += chunk;

      // Pull complete lines out of the buffer; leave the trailing partial
      // line (if any) for the next call.
      let nlIdx: number;
      while ((nlIdx = state.buffer.indexOf("\n")) !== -1) {
        const line = state.buffer.slice(0, nlIdx);
        state.buffer = state.buffer.slice(nlIdx + 1);

        if (line.trim() === VARIANT_DELIMITER) {
          finalizeCurrent(state, true);
          continue;
        }
        commitLineToCurrent(state, line);
      }

      // Snapshot of the currently-streaming variant (if any), including the
      // unflushed buffer (so live tokens show up before the newline).
      let inProgress: ParsedVariant | null = null;
      if (state.current) {
        const draft = { ...state.current };
        if (state.field === "script" && state.buffer) {
          draft.script += (draft.script ? "\n" : "") + state.buffer;
        } else if (state.field === "name" && state.buffer) {
          draft.name += state.buffer;
        } else if (state.field === "angle" && state.buffer) {
          draft.angle += state.buffer;
        }
        inProgress = {
          name: draft.name,
          angle: draft.angle,
          script: draft.script,
          runtime_estimate_seconds: draft.runtime,
          complete: false,
        };
      }

      return { variants: state.finished.slice(), inProgress };
    },

    /** Call once the stream ends, in case the model forgot a trailing delimiter. */
    end(): ParsedVariant[] {
      // Flush any unterminated trailing line into the current variant.
      if (state.buffer.length > 0) {
        const tail = state.buffer;
        state.buffer = "";
        if (tail.trim() === VARIANT_DELIMITER) {
          finalizeCurrent(state, true);
        } else {
          commitLineToCurrent(state, tail);
        }
      }
      if (state.current) {
        finalizeCurrent(state, false);
      }
      return state.finished.slice();
    },
  };
}
