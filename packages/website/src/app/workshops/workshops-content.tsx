import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Workshop } from "@/lib/workshops";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";

interface Props {
  readonly workshops: readonly Workshop[];
  readonly locale: Locale;
}

const WORKSHOP_WASHES = [
  "bg-brand-sky/50",
  "bg-brand-pink/50",
  "bg-brand-peach/55",
] as const;

// Catalogue index bars in the hero aside, one per workshop, widest first.
const INDEX_BARS = [
  "w-full bg-brand-pink/70",
  "w-[86%] bg-brand-sky/70",
  "w-[68%] bg-brand-peach/75",
] as const;

// Offset sheets behind each card. All three stay in the light half of the
// palette: brand-teal is the one dark, saturated hue here, and behind the
// pink wash of card two it read as a muddy grey-green next to card one's
// clean acid. Sky carries the same cool contrast without the mud.
const WORKSHOP_SHEETS = [
  "bg-brand-acid/75",
  "bg-brand-sky/60",
  "bg-brand-pink/65",
] as const;

export function WorkshopsContent({ workshops, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;

  return (
    <>
      {/* Phone-first geometry throughout: base values are the compact
          companion values, and every `sm:`/`md:`/`lg:` variant restores the
          reviewed desktop layout unchanged. */}
      <section className="relative isolate overflow-hidden border-b border-border bg-paper py-6 sm:py-14">
        <span
          className="pointer-events-none absolute -right-10 top-12 h-28 w-80 rotate-3 bg-brand-sky/60"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -left-20 bottom-10 h-20 w-72 -rotate-6 bg-brand-pink/55"
          aria-hidden="true"
        />
        <div
          className="relative mx-auto grid max-w-6xl gap-5 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10"
          data-workshop-editorial-spread
        >
          <header className="relative min-w-0 py-1 sm:py-3 lg:col-span-8 lg:py-8">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              <span className="h-3 w-3 bg-brand-teal" aria-hidden="true" />
              {copy.kicker}
            </p>
            <h1 className="relative mt-4 max-w-[15ch] text-[2.25rem] font-bold leading-[0.9] tracking-[-0.06em] text-foreground sm:mt-5 sm:text-[clamp(2.65rem,6vw,5.75rem)]">
              {copy.headingLead}{" "}
              <HighlightedText colorVar="--color-brand-sky">
                {copy.headingSecond}
              </HighlightedText>
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              {copy.introduction(workshops.length)}
            </p>
          </header>

          <aside
            className="relative min-w-0 pb-3 pr-3 lg:col-span-4 lg:-rotate-1"
            aria-label={copy.catalogueIndex}
          >
            <span
              className="absolute inset-0 translate-x-3 translate-y-3 bg-brand-acid/75"
              aria-hidden="true"
            />
            <div className="relative bg-paper p-4 shadow-card ring-1 ring-foreground/30 sm:p-6">
              <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {copy.catalogueIndex}
                </span>
                <strong className="text-3xl font-bold leading-none tracking-[-0.07em] text-foreground sm:text-4xl">
                  {String(workshops.length).padStart(2, "0")}
                </strong>
              </div>
              {/* Jump links to each card: hidden on phones, where the cards
                  follow directly and the count above already says enough. */}
              {workshops.length > 0 ? (
                <ol className="mt-5 hidden space-y-2 sm:block">
                  {workshops.map((workshop, index) => (
                    <li key={workshop.slug}>
                      <a
                        href={`#workshop-${workshop.slug}`}
                        className={`flex min-h-11 items-center gap-3 px-3 font-mono text-xs font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange ${INDEX_BARS[index % INDEX_BARS.length]}`}
                      >
                        <span>{workshop.number}</span>
                        <span className="font-sans text-sm">
                          {workshop.topic}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section
        className="py-6 sm:py-12"
        aria-labelledby="workshop-list-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-5 grid gap-3 border-b border-border pb-4 sm:mb-8 sm:grid-cols-[minmax(12rem,0.48fr)_minmax(0,1fr)] sm:items-end sm:gap-8">
            <h2
              id="workshop-list-heading"
              className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl"
            >
              {copy.available}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:justify-self-end sm:text-right">
              {copy.availableDescription}
            </p>
          </header>

          {workshops.length === 0 ? (
            <p
              role="status"
              className="border-y border-border py-5 text-sm text-muted-foreground"
            >
              {copy.empty}
            </p>
          ) : (
            <ol className="grid gap-6 sm:gap-12">
              {workshops.map((workshop, index) => (
                <li key={workshop.slug} className="min-w-0">
                  <WorkshopRow
                    workshop={workshop}
                    locale={locale}
                    position={index + 1}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

function WorkshopRow({
  workshop,
  locale,
  position,
}: {
  readonly workshop: Workshop;
  readonly locale: Locale;
  readonly position: number;
}) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;
  const headingId = `workshop-${workshop.slug}-heading`;

  return (
    <article
      id={`workshop-${workshop.slug}`}
      data-testid="workshop-row"
      className="group relative isolate grid min-w-0 scroll-mt-24 bg-paper shadow-card ring-1 ring-foreground/20 transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none md:grid-cols-[minmax(18rem,0.88fr)_minmax(0,1.12fr)]"
      aria-labelledby={headingId}
      data-decision-card
    >
      <span
        className={`absolute inset-0 -z-10 translate-x-2 translate-y-2 transition-transform duration-200 group-hover:translate-x-3 group-hover:translate-y-3 motion-reduce:transition-none ${WORKSHOP_SHEETS[(position - 1) % WORKSHOP_SHEETS.length]}`}
        aria-hidden="true"
      />

      <div
        className={`relative min-w-0 overflow-hidden border-b border-foreground/20 p-4 md:flex md:flex-col md:justify-center md:border-b-0 md:border-r sm:p-6 ${
          position % 2 === 0 ? "md:order-2 md:border-l md:border-r-0" : ""
        } ${WORKSHOP_WASHES[(position - 1) % WORKSHOP_WASHES.length]}`}
      >
        <span className="absolute left-3 top-3 z-10 bg-paper px-2 py-1 font-mono text-xs font-bold text-foreground ring-1 ring-foreground/30">
          {workshop.number}
        </span>
        <div className="relative mt-4 bg-paper p-2 shadow-card ring-1 ring-foreground/30 transition-transform duration-300 group-hover:-rotate-1 motion-reduce:transition-none sm:mt-5">
          <Image
            src={`/workshops/${workshop.slug}/card-preview.webp`}
            alt=""
            aria-hidden="true"
            width={1024}
            height={576}
            {...(position === 1
              ? { loading: "eager" as const, fetchPriority: "high" as const }
              : { loading: "lazy" as const })}
            sizes="(min-width: 1024px) 430px, (min-width: 768px) 42vw, calc(100vw - 64px)"
            className="aspect-[16/7] h-auto w-full object-cover object-top ring-1 ring-foreground/20 sm:aspect-[16/9]"
          />
        </div>
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {workshop.format}
        </p>
      </div>

      {/* On a phone the title comes first, then the link into the workshop,
          with the decision, summary and facts after it. That is pure `order`
          on this flex column (the link is the only control here, so focus
          order still follows the screen), and from md the reviewed reading
          order returns. */}
      <div className="flex min-w-0 flex-col p-4 sm:p-7">
        <h3
          id={headingId}
          className="order-first max-w-[22ch] text-2xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-4xl md:order-none"
        >
          <span className="mb-2 flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange sm:mb-3">
            <span className="h-3 w-3 bg-brand-cobalt" aria-hidden="true" />
            {copy.workshopHeading(workshop.number)}
            <span className="sr-only">:</span>
          </span>{" "}
          {workshop.title}
        </h3>

        <p
          data-workshop-decision
          className="mt-4 max-w-2xl text-base font-semibold leading-snug text-foreground sm:text-lg"
        >
          {copy.firstDecision(workshop.decisionLab.title)}
        </p>

        <p className="mt-4 max-w-2xl border-l-[3px] border-foreground bg-brand-acid/35 px-4 py-3 text-sm leading-relaxed text-muted-foreground sm:mt-5">
          {workshop.summary}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-3 text-sm text-muted-foreground sm:mt-6 sm:gap-y-4 sm:py-4">
          <div className="min-w-[7rem] flex-1">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.duration}
            </dt>
            <dd className="mt-1 break-words text-xs font-semibold text-foreground">
              {workshop.duration}
            </dd>
          </div>
          <div className="min-w-[7rem] flex-1">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.steps}
            </dt>
            <dd className="mt-1 break-words text-xs font-semibold text-foreground">
              {copy.stepCount(workshop.steps.length)}
            </dd>
          </div>
          <div className="min-w-[7rem] flex-1">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.materials}
            </dt>
            <dd className="mt-1 break-words text-xs font-semibold text-foreground">
              {copy.materialCount(workshop.materials.length)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline gap-3 sm:mt-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
            {copy.proofTarget}
          </p>
          <p
            data-workshop-output
            className="text-base font-semibold leading-snug text-foreground"
          >
            {workshop.outcome}
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {workshop.accessNote}
        </p>

        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          className="-order-1 mt-4 inline-flex min-h-11 items-center justify-between gap-2 self-start bg-brand-orange px-4 py-2 text-sm font-bold text-white ring-1 ring-foreground/20 transition-colors hover:bg-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange sm:mt-6 md:order-none"
        >
          {copy.openWorkshop}
          <span className="sr-only">: {workshop.title}</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
