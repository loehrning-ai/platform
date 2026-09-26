import Image from "next/image";
import Link from "next/link";
import type { Workshop, WorkshopNumber } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  ArrowGlyph,
  ButtonLink,
  Callout,
  Chip,
  CoverBand,
  Kicker,
  Pictogram,
  Route,
  SectionHead,
} from "@/components/werk";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";

interface Props {
  readonly workshops: readonly Workshop[];
  readonly locale: Locale;
}

/** Workshops that carry the "Neu" meta chip on the hub. */
const NEW_WORKSHOPS: ReadonlySet<WorkshopNumber> = new Set(["04"]);

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

/**
 * Hub order: newest first, so the latest workshop (and with it the cover-band
 * button) leads. The registry order stays untouched for machine surfaces.
 */
export function orderWorkshopsForHub(
  workshops: readonly Workshop[],
): readonly Workshop[] {
  return [...workshops].sort((a, b) => b.number.localeCompare(a.number));
}

/** A workshop that needs no AI account says so; otherwise its first need is the limiting one. */
function limitingNeed(workshop: Workshop, browserOnly: string): string | undefined {
  const noAccount = workshop.notNeeded.some((item) =>
    /KI-Konto|AI account/i.test(item),
  );
  return noAccount ? browserOnly : workshop.needs[0];
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function WorkshopsContent({ workshops, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;
  const ordered = orderWorkshopsForHub(workshops);
  const index = [...workshops].sort((a, b) =>
    a.number.localeCompare(b.number),
  );
  const first = ordered[0];

  return (
    <>
      <CoverBand labelledBy="workshops-hub-heading">
        <Kicker>{copy.hubKicker(workshops.length)}</Kicker>
        <h1
          id="workshops-hub-heading"
          className="mt-4 max-w-[18ch] text-display font-bold text-balance text-foreground"
        >
          {copy.hubHeading}
        </h1>
        <p className="mt-6 max-w-[56ch] text-lead text-muted-foreground text-pretty">
          {copy.hubLead}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {first ? (
            <ButtonLink
              href={localizeHref(`/workshops/${first.slug}`, locale)}
              tone="dark"
              locale={locale}
            >
              {copy.hubStart(first.number)}
            </ButtonLink>
          ) : null}
          <p className="text-caption text-muted-foreground">{copy.hubAccess}</p>
        </div>

        {index.length > 0 ? (
          <nav
            aria-label={copy.hubIndexLabel}
            data-workshop-index=""
            className="mt-10 border-t border-hairline pt-2 sm:mt-12"
          >
            {/* A rail on phones: one line, scroll-snapped, with the edge
                visible. From sm the row wraps and nothing scrolls. */}
            <ol className="-mb-2 flex snap-x gap-x-6 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
              {index.map((workshop) => (
                <li key={workshop.slug} className="shrink-0 snap-start">
                  <a
                    href={`#workshop-${workshop.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 text-label text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
                  >
                    <span className="tabular-nums text-muted">
                      {workshop.number}
                    </span>
                    {workshop.topic}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </CoverBand>

      <section
        aria-labelledby="workshop-route-heading"
        className="pt-14 sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-route-heading"
            title={copy.routeHeading}
            caption={copy.routeCaption}
          />
          <Route
            stations={copy.routeStations}
            mode="description"
            label={copy.routeHeading}
            locale={locale}
            className="mt-8"
          />
        </div>
      </section>

      <section
        aria-labelledby="workshop-list-heading"
        className="pt-14 sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-list-heading"
            title={copy.listHeading}
            caption={copy.listCaption(workshops.length)}
          />

          {ordered.length === 0 ? (
            <p
              role="status"
              className="mt-8 border-b border-hairline pb-6 text-body text-muted-foreground"
            >
              {copy.empty}
            </p>
          ) : (
            <ol className="mt-2" data-workshop-list="">
              {ordered.map((workshop, position) => (
                <li key={workshop.slug} className="min-w-0">
                  <WorkshopRow
                    workshop={workshop}
                    locale={locale}
                    eager={position === 0}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section
        aria-labelledby="workshop-teams-heading"
        className="pb-16 pt-14 sm:pb-24 sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-teams-heading"
            title={copy.teamsHeading}
            description={copy.teamsBody}
          />
          <Callout variant="boundary" className="mt-10 max-w-[64ch]">
            {copy.boundary}
          </Callout>
        </div>
      </section>
    </>
  );
}

function WorkshopRow({
  workshop,
  locale,
  eager,
}: {
  readonly workshop: Workshop;
  readonly locale: Locale;
  readonly eager: boolean;
}) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;
  const roleLabels = WORKSHOP_PAGE_COPY[locale].detail.roleLabels;
  const headingId = `workshop-${workshop.slug}-heading`;
  const roles = [
    ...new Set(workshop.materials.map((material) => roleLabels[material.role])),
  ];
  const need = limitingNeed(workshop, copy.requirementBrowserOnly);
  const times = [
    workshop.minutesLive !== undefined
      ? copy.minutesLive(workshop.minutesLive)
      : null,
    copy.minutesSelfStudy(workshop.minutesSelfStudy),
  ].filter((part): part is string => part !== null);

  return (
    <article
      id={`workshop-${workshop.slug}`}
      data-testid="workshop-row"
      aria-labelledby={headingId}
      className="group relative grid min-w-0 scroll-mt-24 gap-6 border-b border-hairline py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10"
    >
      <figure className="min-w-0">
        <div className="aspect-video overflow-hidden bg-dark-bg outline outline-1 outline-foreground">
          <Image
            src={`/workshops/${workshop.slug}/card-preview.webp`}
            alt=""
            width={1024}
            height={576}
            {...(eager
              ? { loading: "eager" as const, fetchPriority: "high" as const }
              : { loading: "lazy" as const })}
            sizes="(min-width: 1200px) 470px, (min-width: 768px) 40vw, calc(100vw - 32px)"
            className="size-full object-cover"
          />
        </div>
        <figcaption className="mt-2 text-caption text-muted-foreground">
          {workshop.format}
        </figcaption>
      </figure>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Kicker>
            {[copy.workshopNumber(workshop.number), ...times].join(" · ")}
          </Kicker>
          {NEW_WORKSHOPS.has(workshop.number) ? (
            <Chip>{copy.newBadge}</Chip>
          ) : null}
        </div>
        <h3
          id={headingId}
          className="mt-2 max-w-[28ch] text-[1.5rem] font-bold leading-[1.2] tracking-[-0.01em] text-foreground text-balance decoration-2 underline-offset-4 group-hover:underline sm:text-[1.75rem]"
        >
          {workshop.title}
        </h3>
        <p className="mt-3 max-w-[56ch] text-body text-muted-foreground text-pretty">
          {workshop.summary}
        </p>

        <figure
          data-workshop-question=""
          className="mt-5 grid max-w-[56ch] grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3"
        >
          <Pictogram
            name="question"
            strokeWidth={2}
            className="mt-0.5 size-5 text-foreground"
          />
          <div className="min-w-0">
            <figcaption className="text-caption text-muted-foreground">
              {copy.questionLabel}
            </figcaption>
            <blockquote className="text-body font-semibold text-foreground text-pretty">
              {copy.quote(workshop.question)}
            </blockquote>
          </div>
        </figure>

        <dl className="mt-5 grid max-w-[56ch] gap-y-1 text-caption sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
          <dt className="font-semibold text-foreground">{copy.leaveWith}</dt>
          <dd data-workshop-output="" className="text-muted-foreground">
            {workshop.outcome}
          </dd>
          {need ? (
            <>
              <dt className="mt-2 font-semibold text-foreground sm:mt-0">
                {copy.requirementLabel}
              </dt>
              <dd className="text-muted-foreground">{need}</dd>
            </>
          ) : null}
          <dt className="mt-2 font-semibold text-foreground sm:mt-0">
            {copy.materialLabel}
          </dt>
          <dd data-workshop-roles="" className="text-muted-foreground">
            {roles.join(" · ")}
          </dd>
        </dl>
        {workshop.provenance.liveRunAt ? (
          <p className="mt-2 text-caption text-muted-foreground">
            {copy.liveTested(formatDate(workshop.provenance.liveRunAt, locale))}
          </p>
        ) : null}

        {/* One link per row. Its ::after stretches over the whole row, so the
            cover and the text are clickable too; the focus ring stays on the
            link itself. */}
        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          // Starts with the visible label (WCAG 2.5.3). An sr-only span would
          // be blockified inside inline-flex and put a space before the colon.
          aria-label={`${copy.viewWorkshop}: ${workshop.title}`}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] after:absolute after:inset-0 hover:decoration-foreground group-hover:decoration-foreground motion-reduce:transition-none"
        >
          {copy.viewWorkshop}
          <ArrowGlyph />
        </Link>
      </div>
    </article>
  );
}
