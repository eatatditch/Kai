export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 pt-6 pb-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
        <div className="flex flex-col">
          <span className="mb-1 text-[11px] font-bold tracking-[0.22em] text-orange uppercase">
            Ditch Hospitality Group
          </span>
          <h1 className="m-0 font-bebas text-[clamp(40px,5vw,60px)] leading-[0.95] tracking-[0.01em] text-navy">
            Content Calendar
          </h1>
          <span className="mt-1.5 text-[13px] font-medium text-muted">
            May 2026 — June 2027 · Brand &amp; Marketing
          </span>
        </div>
      </header>

      <section className="rounded-[var(--radius)] border-[1.5px] border-line bg-white p-6 shadow-card">
        <p className="font-bebas text-2xl tracking-[0.04em] text-navy">
          Tokens wired. Fonts loaded. Shell ready.
        </p>
        <p className="mt-2 text-sm text-muted">
          Calendar grid, week view, modal, filters, and Supabase wiring come
          next.
        </p>
      </section>

      <p className="mt-6 text-center font-caveat text-base text-muted">
        spread joy. build community. surf well.
      </p>
    </main>
  );
}
