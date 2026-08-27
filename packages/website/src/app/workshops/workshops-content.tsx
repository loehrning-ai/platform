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
      <section className="border-b border-border py-8 sm:py-10">
        <div
          className="mx-auto grid max-w-6xl gap-3 px-4 sm:px-6 lg:grid-cols-12"
          data-workshop-bento
        >
          <div className="dark-section relative min-w-0 overflow-hidden border border-foreground bg-background p-5 text-foreground sm:p-7 lg:col-span-8">
            <span
              className="absolute right-[-2.75rem] top-[-2.75rem] h-28 w-28 rotate-45 border border-border"
              aria-hidden="true"
            />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.kicker}
            </p>
            <h1 className="relative mt-5 max-w-[15ch] text-[clamp(2.45rem,5vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.05em]">
              {copy.headingLead}{" "}
              <span className="text-brand-orange">{copy.headingSecond}</span>
            </h1>
          </div>

          <div className="grid min-w-0 gap-px border border-foreground bg-border sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <div className="relative min-w-0 overflow-hidden bg-card p-5">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.available}
              </span>
              <strong className="mt-8 block text-[clamp(4rem,8vw,6.5rem)] font-bold leading-[0.72] tracking-[-0.08em] text-foreground">
                {String(workshops.length).padStart(2, "0")}
              </strong>
            </div>
            <div className="min-w-0 bg-background p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.proofTarget}
              </p>
              <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-foreground">
                {copy.proofOutput}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {copy.introduction(workshops.length)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-8 sm:py-10"
        aria-labelledby="workshop-list-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-5 flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
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
            <ol className="grid gap-4 lg:grid-cols-2">
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

  return (
    <article
      data-testid="workshop-row"
      className="group relative flex h-full min-w-0 flex-col overflow-hidden border border-foreground bg-background"
      data-decision-card
    >
      <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
        <p className="min-w-0 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {workshop.title}
        </p>
        <span
          aria-hidden="true"
          className="shrink-0 font-mono text-xs font-bold tabular-nums text-brand-orange"
        >
          {pad(position)}
        </span>
      </div>

      <div className="dark-section relative min-w-0 overflow-hidden border-b border-border bg-background p-5 text-foreground sm:p-6">
        <span
          className="absolute bottom-[-2.5rem] right-[-2.5rem] h-24 w-24 rotate-45 border border-border transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.decision}
        </p>
        <h3
          data-workshop-decision
          className="relative mt-3 max-w-[18ch] text-2xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-3xl"
        >
          {workshop.decisionLab.title}
        </h3>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.proofTarget}
        </p>
        <p
          data-workshop-output
          className="mt-1 text-base font-semibold leading-snug text-foreground"
        >
          {copy.proofOutput}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-px border border-border bg-border text-sm text-muted-foreground">
          <div className="min-w-0 bg-background p-3">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.duration}
            </dt>
            <dd className="mt-2 break-words text-xs font-semibold text-foreground">
              {workshop.duration}
            </dd>
          </div>
          <div className="min-w-0 bg-background p-3">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.steps}
            </dt>
            <dd className="mt-2 break-words text-xs font-semibold text-foreground">
              {copy.stepCount(workshop.steps.length)}
            </dd>
          </div>
          <div className="min-w-0 bg-background p-3">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.materials}
            </dt>
            <dd className="mt-2 break-words text-xs font-semibold text-foreground">
              {copy.materialCount(workshop.materials.length)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {workshop.accessNote}
        </p>

        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          className="mt-5 inline-flex min-h-11 items-center justify-between gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        >
          {copy.openWorkshop}
          <span className="sr-only">: {workshop.title}</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
