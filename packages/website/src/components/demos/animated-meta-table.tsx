import type { Demo as CatalogEntry } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Renders the catalogue values exactly as reviewed. Metrics stay static so an
 * illustrative number is never presented as if it were a live measurement.
 */
export function AnimatedMetaTable({
  meta,
}: {
  meta: CatalogEntry["meta"];
  locale?: Locale;
}) {
  return (
    <div className="grid grid-cols-1 gap-0 overflow-hidden border border-border md:grid-cols-2">
      {meta.map(({ label, value }, i) => (
        <div
          key={label}
          className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 border-b border-border px-3 py-3 font-mono text-sm sm:px-4 md:border-b-0 ${
            i % 2 === 0 && !(i === meta.length - 1 && meta.length % 2 === 1)
              ? "md:border-r"
              : ""
          } ${i >= meta.length - (meta.length % 2 === 0 ? 2 : 1) ? "" : "md:border-b"}`}
        >
          <span className="min-w-0 break-words text-xs uppercase tracking-[0.1em] text-muted-foreground sm:tracking-[0.12em]">
            {label}
          </span>
          <span className="min-w-0 break-words text-right font-bold text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
