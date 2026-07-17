export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-orange" />
        <p className="font-mono text-xs text-muted-foreground">Kurs wird geladen…</p>
      </div>
    </div>
  );
}
