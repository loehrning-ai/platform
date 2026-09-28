import type { Demo as CatalogEntry } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Renders the catalogue values exactly as reviewed, as hairline ledger rows.
 * Metrics stay static so an illustrative number is never presented as if it
 * were a live measurement.
 */
export function AnimatedMetaTable({
  meta,
}: {
  meta: CatalogEntry["meta"];
  locale?: Locale;
}) {
  return (
    <dl data-demo-meta>
      {meta.map(({ label, value }) => (
        <div
          key={label}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-hairline py-3"
        >
          <dt className="min-w-0 break-words text-label text-muted-foreground">
            {label}
          </dt>
          <dd className="min-w-0 break-words text-body text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
