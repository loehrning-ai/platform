import { HOME_COPY } from "@/components/home/home-copy";
import { HomeSectionHead } from "@/components/home/home-section-head";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Betriebsprinzipien: four operating facts as an evidence row. From lg the
 * four columns sit side by side, separated by hairlines; below lg they are
 * hairline rows (two columns from sm). No boxes, no tints, no decoration.
 */
export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="scroll-mt-24 bg-background px-6 pt-12 pb-24 max-lg:py-5 max-lg:pb-8 md:px-12"
      data-testid="platform-principles"
    >
      <div className="mx-auto max-w-6xl">
        {/* The visible headline is the section's h2; the label is a kicker,
            and below lg the Kopflinie does its job. */}
        <HomeSectionHead
          kicker={copy.overline}
          introduction={copy.introduction}
          title={copy.headline}
        />

        <dl className="mt-8 grid grid-cols-4 max-lg:mt-4 max-lg:grid-cols-1 max-lg:border-t max-lg:border-hairline max-lg:sm:grid-cols-2 max-lg:sm:gap-x-6">
          {copy.principles.map((item, index) => (
            <div
              key={item.label}
              className="min-w-0 border-l border-hairline px-6 first:border-l-0 first:pl-0 last:pr-0 max-lg:border-l-0 max-lg:border-b max-lg:px-0 max-lg:py-3"
            >
              <dt>
                <span className="text-label text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </span>
                <span className="mt-2 block text-fluid-h3 font-bold text-foreground max-lg:mt-0.5 max-lg:text-base">
                  {item.title}
                </span>
              </dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground max-lg:mt-0.5 max-lg:text-[0.8125rem] max-lg:leading-snug">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
