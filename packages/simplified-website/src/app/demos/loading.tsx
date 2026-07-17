export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center pt-20" role="status" aria-live="polite">
      <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
        ◆ Praxisbeispiele werden geladen…
      </div>
    </div>
  );
}
