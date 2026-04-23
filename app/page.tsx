export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Ditch Marketing OS
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Scaffolding ready.
        </h1>
        <p className="text-base text-muted-foreground">
          Features ship one end-to-end slice at a time. Start with the content
          generator.
        </p>
      </div>
    </main>
  );
}
