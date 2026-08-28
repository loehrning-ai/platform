import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

const PRINCIPLE_TONES = [
  "bg-brand-acid/58",
  "bg-brand-lilac/50",
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
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-sky/25 py-16 md:py-24"
      data-testid="platform-principles"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-8 size-64 rounded-full bg-brand-acid/25 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 size-72 rounded-full bg-brand-pink/30 blur-2xl"
      />
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <header className="relative grid gap-5 border-b border-foreground/15 pb-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end">
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

        <dl className="relative mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.principles.map((item, index) => (
            <div
              key={item.label}
              className={`group relative min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${PRINCIPLE_TONES[index] ?? PRINCIPLE_TONES[0]} p-5 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none md:min-h-64 md:p-6`}
            >
              <dt>
                <span className="relative font-ui-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </span>
                <span className="relative mt-12 block text-xl font-bold tracking-[-0.025em] text-foreground">
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
