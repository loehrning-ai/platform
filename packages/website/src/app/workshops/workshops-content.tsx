import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Workshop } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";

interface Props {
  readonly workshops: readonly Workshop[];
  readonly locale: Locale;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function WorkshopsContent({ workshops, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.kicker}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:gap-10">
            <h1 className="text-3xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {copy.headingLead}{" "}
              <span className="text-brand-orange">{copy.headingSecond}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.introduction(workshops.length)}
            </p>
          </div>
        </div>
      </section>

      <section
        className="py-8 sm:py-10"
        aria-labelledby="workshop-list-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <h2
              id="workshop-list-heading"
              className="text-xl font-bold tracking-[-0.025em] sm:text-2xl"
            >
              {copy.available}
            </h2>
            <p className="text-sm text-muted-foreground">
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
            <ol className="border-t border-border">
              {workshops.map((workshop, index) => (
                <li key={workshop.slug} className="border-b border-border">
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

  return (
    <article
      data-testid="workshop-row"
      className="grid gap-5 py-6 md:grid-cols-[3rem_minmax(0,1.35fr)_minmax(15rem,0.65fr)] md:gap-6 lg:items-start"
    >
      <p
        aria-hidden="true"
        className="font-mono text-xs font-bold tabular-nums text-brand-orange"
      >
        {pad(position)}
      </p>

      <div className="min-w-0">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {workshop.title}
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.decision}
        </p>
        <h3
          data-workshop-decision
          className="mt-1 max-w-2xl text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-3xl"
        >
          {workshop.decisionLab.title}
        </h3>
      </div>

      <div className="min-w-0 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.proofTarget}
        </p>
        <p
          data-workshop-output
          className="mt-1 text-base font-semibold leading-snug text-foreground"
        >
          {copy.proofOutput}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">{copy.duration}</dt>
            <dd>{workshop.duration}</dd>
          </div>
          <div>
            <dt className="sr-only">{copy.steps}</dt>
            <dd>{copy.stepCount(workshop.steps.length)}</dd>
          </div>
          <div>
            <dt className="sr-only">{copy.materials}</dt>
            <dd>{copy.materialCount(workshop.materials.length)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {workshop.accessNote}
        </p>

        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        >
          {copy.openWorkshop}
          <span className="sr-only">: {workshop.title}</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
