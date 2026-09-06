import Link from "next/link";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { AccountPageCopy } from "../account-copy";
import { KONTO_SECTION_IDS } from "./account-data";
import { ACCOUNT_CONTROLS_COPY } from "./region-copy";

/**
 * Konto verwalten: where the learner's data is, and where the controls for it
 * live.
 *
 * The region always renders, including during a progress or auth outage: a
 * learner who cannot read their record must still reach export, reset and
 * deletion. It names all three and says what each one does, then opens the
 * privacy workspace that performs them. It deliberately does not repeat the
 * controls themselves: export, reset and deletion each carry a confirmation
 * step, deletion is irreversible, and a second copy of those flows would mean
 * two places to keep correct and two places to get a deletion wrong.
 *
 * Its privacy landmark keeps an accessible name distinct from the section
 * navigation above, so a query by landmark name stays a single match.
 */
export function KontoVerwaltenSection({
  copy,
  locale,
}: {
  readonly copy: AccountPageCopy;
  readonly locale: Locale;
}) {
  const controls = ACCOUNT_CONTROLS_COPY[locale];
  const privacyHref = localizeHref("/konto/datenschutz", locale);

  return (
    <section
      id={KONTO_SECTION_IDS.verwalten}
      aria-labelledby="konto-verwalten-heading"
      className="mt-12 scroll-mt-24"
    >
      <h2
        id="konto-verwalten-heading"
        className="text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
        {copy.sectionSettings}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {controls.intro}
      </p>

      {/* Export, reset and deletion. The deletion row carries the destructive
          accent so the irreversible control is not one grey row among three. */}
      <ul className="mt-4 grid gap-px border border-border bg-border">
        {controls.items.map((item) => (
          <li key={item.id} className="bg-background">
            <Link
              href={privacyHref}
              className={`flex min-h-11 flex-col justify-center gap-1 border-l-[3px] px-3 py-2.5 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                item.id === "delete"
                  ? "border-l-red-700"
                  : "border-l-brand-orange"
              }`}
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-foreground">
                  {item.title}
                </span>{" "}
                <span
                  className={`font-mono text-xs font-bold uppercase tracking-[0.08em] ${
                    item.id === "delete"
                      ? "text-destructive"
                      : "text-brand-orange"
                  }`}
                >
                  {item.action} <span aria-hidden="true">→</span>
                </span>
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Storage and legacy-export disclosure */}
      <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange p-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {copy.localDataHeading}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.localDataBody}
        </p>
      </div>

      <nav
        aria-label={copy.privacyNavigationLabel}
        className="mt-4 border-t border-border pt-4"
      >
        <p className="text-sm text-muted-foreground">
          <Link
            href={privacyHref}
            className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.privacyLink}
          </Link>
          {": "}
          {copy.privacySummary}
        </p>
      </nav>
    </section>
  );
}
