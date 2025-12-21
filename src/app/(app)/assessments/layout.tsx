export default function AssessmentsLayout({ children }: { children: React.ReactNode }) {
  // Expand to the edge of the (app) layout's padded main container.
  return (
    <div className="veritas-wizard relative -mx-6 -my-10 min-h-[calc(100vh-80px)] px-6 py-10 text-[var(--text)]">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-[var(--background)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
