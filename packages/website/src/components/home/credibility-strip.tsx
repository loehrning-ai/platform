import { HOME_COPY } from "@/components/home/home-copy";
import { HOME_CONTAINER } from "@/components/home/home-container";
import { HomeSectionHead } from "@/components/home/home-section-head";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Betriebsprinzipien: four operating facts as an evidence row. From lg the
 * four columns sit side by side, separated by hairlines; below lg they are
 * hairline rows (two columns from sm). The four have no order, so they carry
 * no numbers or labels: each is its title and one sentence. Below sm the
 * sentence is for assistive tech only and each fact is one line. No boxes,
 * no tints, no decoration.
 */
export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="scroll-mt-24 bg-background pt-12 pb-24 max-lg:py-5 max-lg:pb-8"
      data-testid="platform-principles"
    >
      <div className={HOME_CONTAINER}>
        <HomeSectionHead
          introduction={copy.introduction}
          title={copy.headline}
        />

        <dl className="mt-8 grid grid-cols-4 max-lg:mt-4 max-lg:grid-cols-1 max-lg:border-t max-lg:border-hairline max-lg:sm:grid-cols-2 max-lg:sm:gap-x-6">
          {copy.principles.map((item) => (
            <div
              key={item.title}
              className="min-w-0 border-l border-hairline px-6 first:border-l-0 first:pl-0 last:pr-0 max-lg:border-l-0 max-lg:border-b max-lg:px-0 max-lg:py-3"
            >
              <dt className="text-lg leading-snug font-bold text-foreground max-lg:text-base">
                {item.title}
              </dt>
              <dd className="mt-2 text-body text-muted-foreground max-lg:mt-0.5 max-lg:text-caption max-lg:leading-snug">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
