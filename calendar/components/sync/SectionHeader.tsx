import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  right?: ReactNode;
};

export function SectionHeader({ eyebrow, title, right }: Props) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-dashed border-line pb-2">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {`// ${eyebrow}`}
        </div>
        <h2 className="mt-1 font-bebas text-[28px] leading-none tracking-[0.02em] text-ink">
          {title}
        </h2>
      </div>
      {right && <div className="print:hidden">{right}</div>}
    </div>
  );
}
