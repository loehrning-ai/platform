import { HOME_COPY } from "@/components/home/home-copy";
import type { Locale } from "@/lib/i18n/locale";

const PRINCIPLE_TONES = [
  "bg-brand-acid/58",
  "bg-brand-peach/50",
  "bg-brand-sky/58",
  "bg-brand-pink/46",
] as const;

/* The old home's pastel geometry in miniature: a solid block tilted into
   each card's corner, in a colour that stands off its card (pink on acid,
   sky on peach, acid on sky, peach on pink) and a different turn per card.
   The principles have no order, so they carry shapes, not numbers. Square
   corners keep every tilt visible; nothing here is round or outlined, so
   no marker reads as a checkbox or radio button. */
const PRINCIPLE_MARKS = [
  "bg-brand-pink rotate-6 rounded-md",
  "bg-brand-sky -rotate-12 rounded-md",
  "bg-brand-acid rotate-12 rounded-md",
  "bg-brand-peach -rotate-6 rounded-md",
] as const;

/**
 * Betriebsprinzipien: four operating facts as pastel cards on a sky wash,
 * with two soft colour fields behind them from lg. Each card is its title
 * and one sentence, visible at every width.
 */
export function CredibilityStrip({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].credibility;

  return (
    <section
      className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-brand-sky/25 py-12 max-lg:py-6 md:py-20 lg:py-24"
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
        <header className="relative border-b border-foreground/15 pb-6 max-lg:pb-4 md:pb-8">
          <h2 className="text-fluid-h2 font-bold tracking-[-0.035em] text-foreground max-lg:text-2xl max-lg:tracking-[-0.03em]">
            {copy.headline}
          </h2>
        </header>

        <dl className="relative mt-6 grid gap-3 max-lg:mt-4 max-lg:grid-cols-2 max-lg:gap-2 max-[22.5rem]:grid-cols-1 sm:grid-cols-2 sm:gap-4 lg:mt-7 lg:grid-cols-4">
          {copy.principles.map((item, index) => (
            <div
              key={item.title}
              className={`group relative min-w-0 overflow-hidden rounded-[1.5rem] border border-foreground/10 ${PRINCIPLE_TONES[index] ?? PRINCIPLE_TONES[0]} p-4 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none max-lg:rounded-2xl max-lg:p-3 md:p-5 lg:min-h-56 lg:p-6`}
            >
              <span
                aria-hidden="true"
                className={`block size-10 shadow-[0_2px_0_rgba(20,20,20,0.12)] max-lg:size-7 ${PRINCIPLE_MARKS[index] ?? PRINCIPLE_MARKS[0]}`}
              />
              <dt className="relative mt-4 break-words text-xl font-bold tracking-[-0.025em] text-foreground hyphens-auto max-lg:mt-2 max-lg:text-base lg:mt-10">
                {item.title}
              </dt>
              <dd className="relative mt-2 break-words text-sm leading-relaxed text-muted-foreground hyphens-auto max-lg:mt-1 max-lg:text-xs lg:mt-3">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
