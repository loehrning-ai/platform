import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

const PRINCIPLE_TONES = [
  "bg-brand-acid/58",
  "bg-brand-peach/50",
  "bg-brand-sky/58",
  "bg-brand-pink/46",
] as const;

export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-sky/25 py-12 max-lg:border-b-0 max-lg:bg-background max-lg:py-5 max-lg:pb-8 md:py-20 lg:py-24"
      data-testid="platform-principles"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-8 hidden size-64 rounded-full bg-brand-acid/25 blur-2xl lg:block"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 hidden size-72 rounded-full bg-brand-pink/30 blur-2xl lg:block"
      />
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <header className="relative grid gap-5 border-b border-foreground/15 pb-6 max-lg:border-b-0 max-lg:border-t-2 max-lg:border-t-foreground max-lg:pb-0 max-lg:pt-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end md:pb-8 max-lg:md:pb-0">
          <div>
            {/* The visible headline is the section's h2; the label is a
                kicker, and below lg the Kopflinie does its job. */}
            <p className="overline border-l-[3px] border-brand-orange pl-3 max-lg:sr-only">
              {copy.overline}
            </p>
            <h2 className="mt-4 text-fluid-h3 font-bold tracking-[-0.03em] text-foreground max-lg:mt-0 max-lg:text-2xl max-lg:tracking-[-0.015em] max-lg:text-balance">
              {copy.headline}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground max-lg:hidden md:justify-self-end md:text-right">
            {copy.introduction}
          </p>
        </header>

        <dl className="relative mt-6 grid gap-3 max-lg:mt-4 max-lg:grid-cols-1 max-lg:gap-0 max-lg:border-t max-lg:border-hairline sm:grid-cols-2 sm:gap-4 max-lg:sm:grid-cols-2 max-lg:sm:gap-x-6 max-lg:sm:gap-y-0 lg:mt-7 lg:grid-cols-4">
          {copy.principles.map((item, index) => (
            <div
              key={item.label}
              className={`group relative min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${PRINCIPLE_TONES[index] ?? PRINCIPLE_TONES[0]} p-4 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none max-lg:rounded-none max-lg:border-0 max-lg:border-b max-lg:border-hairline max-lg:bg-transparent max-lg:px-0 max-lg:py-3 max-lg:shadow-none max-lg:hover:translate-y-0 max-lg:hover:shadow-none md:p-5 max-lg:md:px-0 max-lg:md:py-3 lg:min-h-64 lg:p-6`}
            >
              <dt>
                <span className="relative font-ui-mono text-xs font-bold tabular-nums text-kupfer-dark max-lg:!font-sans max-lg:text-sm max-lg:font-semibold max-lg:tracking-[0.02em] max-lg:text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </span>
                <span className="relative mt-4 block text-xl font-bold tracking-[-0.025em] text-foreground max-lg:mt-0.5 max-lg:text-base max-lg:tracking-normal lg:mt-12">
                  {item.title}
                </span>
              </dt>
              <dd className="relative mt-2 text-sm leading-relaxed text-muted-foreground max-lg:mt-0.5 max-lg:text-[0.8125rem] max-lg:leading-snug lg:mt-3">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
