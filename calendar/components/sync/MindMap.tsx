"use client";

import { useMemo } from "react";
import { meterColor, meterPct } from "./CadenceGrid";
import type {
  CadenceMeter,
  CadenceReading,
  RoadmapMonth,
  RoadmapStatus,
} from "@/types";

type Props = {
  meters: CadenceMeter[];
  readings: CadenceReading[];
  roadmap: RoadmapMonth[];
};

type BranchState = "ok" | "warn" | "crit" | "neutral";

type Branch = {
  id: string;
  side: "left" | "right";
  group: "cadence" | "content";
  label: string;
  sub: string;
  state: BranchState;
  anchor: string; // section id to scroll to
};

const STATE_FILL: Record<BranchState, string> = {
  ok: "var(--sage)",
  warn: "var(--sand)",
  crit: "var(--orange)",
  neutral: "var(--line)",
};

const STATE_TEXT: Record<BranchState, string> = {
  ok: "var(--ink)",
  warn: "var(--ink)",
  crit: "white",
  neutral: "var(--muted)",
};

const STATUS_TO_STATE: Record<RoadmapStatus, BranchState> = {
  mapped: "ok",
  mapping: "warn",
  todo: "crit",
  future: "neutral",
};

function nextFourMonths(months: RoadmapMonth[]): RoadmapMonth[] {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return months
    .slice()
    .sort((a, b) => a.monthStart.localeCompare(b.monthStart))
    .filter(
      (m) => new Date(`${m.monthStart}T00:00:00`) >= startOfMonth,
    )
    .slice(0, 4);
}

function meterState(pct: number): BranchState {
  const c = meterColor(pct);
  if (c === "sage") return "ok";
  if (c === "sand") return "warn";
  return "crit";
}

export function MindMap({ meters, readings, roadmap }: Props) {
  const branches: Branch[] = useMemo(() => {
    const orderedMeters = meters.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const cadenceBranches: Branch[] = orderedMeters.slice(0, 4).map((m) => {
      const r = readings.find((x) => x.meterId === m.id);
      const value = r?.currentValue ?? 0;
      const pct = meterPct(value, m.maxValue);
      return {
        id: `meter-${m.id}`,
        side: "left",
        group: "cadence",
        label: m.name,
        sub: `${value}/${m.maxValue}`,
        state: meterState(pct),
        anchor: "cadence",
      };
    });

    const contentBranches: Branch[] = nextFourMonths(roadmap).map((m) => {
      const d = new Date(`${m.monthStart}T00:00:00`);
      const mon = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      return {
        id: `month-${m.id}`,
        side: "right",
        group: "content",
        label: mon,
        sub: m.statusLabel,
        state: STATUS_TO_STATE[m.status],
        anchor: "roadmap",
      };
    });

    // Pad to 4 each so the layout stays balanced.
    while (cadenceBranches.length < 4)
      cadenceBranches.push({
        id: `cad-pad-${cadenceBranches.length}`,
        side: "left",
        group: "cadence",
        label: "—",
        sub: "",
        state: "neutral",
        anchor: "cadence",
      });
    while (contentBranches.length < 4)
      contentBranches.push({
        id: `con-pad-${contentBranches.length}`,
        side: "right",
        group: "content",
        label: "—",
        sub: "",
        state: "neutral",
        anchor: "roadmap",
      });

    return [...cadenceBranches, ...contentBranches];
  }, [meters, readings, roadmap]);

  const onJump = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // SVG layout: 920 x 360, center node in middle.
  const W = 920;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const yPositions = [60, 140, 220, 300];
  const leftX = 110;
  const rightX = W - 110;

  const leftBranches = branches.filter((b) => b.side === "left");
  const rightBranches = branches.filter((b) => b.side === "right");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Marketing operating picture mind map"
        className="block h-auto w-full min-w-[640px]"
      >
        {/* connector lines */}
        {leftBranches.map((b, i) => (
          <line
            key={`l-${b.id}`}
            x1={cx}
            y1={cy}
            x2={leftX}
            y2={yPositions[i]}
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        ))}
        {rightBranches.map((b, i) => (
          <line
            key={`r-${b.id}`}
            x1={cx}
            y1={cy}
            x2={rightX}
            y2={yPositions[i]}
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        ))}

        {/* center trunk node */}
        <g>
          <rect
            x={cx - 90}
            y={cy - 32}
            width={180}
            height={64}
            rx={8}
            fill="var(--ink)"
            stroke="var(--ink)"
            strokeWidth={1.5}
          />
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fontSize="10"
            letterSpacing="2"
            fill="var(--cream)"
          >
            {`// OPERATING PICTURE`}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontFamily="var(--font-bebas), sans-serif"
            fontSize="22"
            letterSpacing="1"
            fill="var(--cream)"
          >
            DITCH MARKETING
          </text>
        </g>

        {/* sub-trunk labels */}
        <text
          x={cx - 220}
          y={26}
          textAnchor="middle"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="2"
          fill="var(--muted)"
        >
          {`// CADENCE`}
        </text>
        <text
          x={cx + 220}
          y={26}
          textAnchor="middle"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="2"
          fill="var(--muted)"
        >
          {`// CONTENT`}
        </text>

        {/* leaves */}
        {leftBranches.map((b, i) => {
          const y = yPositions[i];
          return (
            <BranchNode
              key={b.id}
              x={leftX}
              y={y}
              align="left"
              branch={b}
              onClick={() => onJump(b.anchor)}
            />
          );
        })}
        {rightBranches.map((b, i) => {
          const y = yPositions[i];
          return (
            <BranchNode
              key={b.id}
              x={rightX}
              y={y}
              align="right"
              branch={b}
              onClick={() => onJump(b.anchor)}
            />
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        <LegendDot color={STATE_FILL.ok} label="On track" />
        <LegendDot color={STATE_FILL.warn} label="Watch" />
        <LegendDot color={STATE_FILL.crit} label="Behind" />
        <LegendDot color={STATE_FILL.neutral} label="Future / N/A" />
      </div>
    </div>
  );
}

function BranchNode({
  x,
  y,
  align,
  branch,
  onClick,
}: {
  x: number;
  y: number;
  align: "left" | "right";
  branch: Branch;
  onClick: () => void;
}) {
  const w = 170;
  const h = 56;
  const rectX = align === "left" ? x - w : x;
  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={onClick}
      role="button"
      aria-label={`${branch.label} ${branch.sub}`}
    >
      <rect
        x={rectX}
        y={y - h / 2}
        width={w}
        height={h}
        rx={6}
        fill={STATE_FILL[branch.state]}
        stroke="var(--ink)"
        strokeWidth={1.5}
      />
      <text
        x={align === "left" ? rectX + 12 : rectX + w - 12}
        y={y - 6}
        textAnchor={align === "left" ? "start" : "end"}
        fontFamily="var(--font-bebas), sans-serif"
        fontSize="18"
        letterSpacing="1"
        fill={STATE_TEXT[branch.state]}
      >
        {branch.label}
      </text>
      <text
        x={align === "left" ? rectX + 12 : rectX + w - 12}
        y={y + 14}
        textAnchor={align === "left" ? "start" : "end"}
        fontFamily="var(--font-mono), ui-monospace, monospace"
        fontSize="10"
        letterSpacing="1.4"
        fill={STATE_TEXT[branch.state]}
        opacity={0.85}
      >
        {branch.sub}
      </text>
    </g>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full border border-ink"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
