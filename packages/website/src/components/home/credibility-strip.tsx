import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="dark-section scroll-mt-24 border-b border-border py-16 md:py-20"
      data-testid="platform-principles"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <header className="grid gap-5 border-b border-border pb-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end">
          <div>
            <h2 className="overline border-l-[3px] border-brand-orange pl-3">
              {copy.overline}
            </h2>
            <p className="mt-4 text-fluid-h3 font-bold tracking-[-0.03em] text-foreground">
              {copy.headline}
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:justify-self-end md:text-right">
            {copy.introduction}
          </p>
        </header>

        <dl className="grid border-l border-border sm:grid-cols-2 lg:grid-cols-4">
          {copy.principles.map((item, index) => (
            <div
              key={item.label}
              className="group relative min-w-0 overflow-hidden border-b border-r border-border p-5 transition-colors duration-150 hover:bg-card motion-reduce:transition-none md:min-h-64 md:p-6"
            >
              <dt>
                <span className="relative font-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </span>
                <span className="relative mt-12 block text-lg font-bold tracking-[-0.02em] text-foreground">
                  {item.title}
                </span>
              </dt>
              <dd className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
