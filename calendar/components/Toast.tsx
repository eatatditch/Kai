type Props = {
  message: string | null;
};

export function Toast({ message }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2 rounded-[10px] bg-navy px-4 py-2.5 text-[13px] font-medium text-cream shadow-pop transition-all duration-200 print:hidden ${
        message
          ? "translate-y-[-4px] opacity-100"
          : "translate-y-0 opacity-0"
      }`}
    >
      {message ?? ""}
    </div>
  );
}
