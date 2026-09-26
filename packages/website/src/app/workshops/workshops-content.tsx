import Image from "next/image";
import Link from "next/link";
import type {
  Workshop,
  WorkshopMaterialRole,
  WorkshopNumber,
} from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  ArrowGlyph,
  ButtonLink,
  Callout,
  Chip,
  CoverBand,
  GlobeLines,
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

/**
 * Workshops whose card-preview.webp is a real Werkzeichnung deck cover
 * (design-direction 10.4). Every other row renders the CSS mini-cover from
 * 6.7, so the list stays uniform until the other covers are regenerated.
 */
const DECK_COVERS: ReadonlySet<WorkshopNumber> = new Set(["03", "04"]);

/**
 * The cover-band button is a recommendation, not "the newest": it stays on
 * this workshop when a newer one leads the list (workshop-standard 4.2).
 */
const RECOMMENDED_START: WorkshopNumber = "03";

/** Order of material nouns on a row; the list is capped at MATERIAL_CAP. */
const MATERIAL_ORDER: readonly WorkshopMaterialRole[] = [
  "deck",
  "demo",
  "kit",
  "guide",
  "lab",
  "case",
  "card",
  "exercise",
  "data",
  "hub",
  "presenter",
  "builder",
];
const MATERIAL_CAP = 4;

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

/**
 * Registry prose uses U+2212 for negative numbers. Loehrning Sans draws it as
 * a long bar that reads like a dash, so the hub shows an ASCII hyphen-minus.
 */
function plainNumbers(text: string): string {
  return text.replace(/\u2212/g, "-");
}

/** A negative amount after a space: "-19.960 €" or "-€19,960". */
const NEGATIVE_AMOUNT = /((?<=^|\s)-€?\d(?:[\d.,]*\d)?(?:\s€)?)/;

/**
 * Prose with negative amounts kept on one line: a hyphen before "€" is a
 * line-break opportunity, and "19.960 €" alone on a line reads as positive.
 */
function AmountText({ text }: { readonly text: string }) {
  return plainNumbers(text)
    .split(NEGATIVE_AMOUNT)
    .map((part, position) =>
      position % 2 === 1 ? (
        <span key={position} className="whitespace-nowrap tabular-nums">
          {part}
        </span>
      ) : (
        part
      ),
    );
}

/**
 * Hub order: newest first, so the latest workshop (and with it the cover-band
 * button) leads. The registry order stays untouched for machine surfaces.
 */
export function orderWorkshopsForHub(
  workshops: readonly Workshop[],
): readonly Workshop[] {
  return [...workshops].sort((a, b) => b.number.localeCompare(a.number));
}

/**
 * A workshop that needs no AI account says so; otherwise the hub's short
 * wording wins, then the first need.
 */
function limitingNeed(
  workshop: Workshop,
  browserOnly: string,
  short: Readonly<Record<string, string>>,
): string | undefined {
  const noAccount = workshop.notNeeded.some((item) =>
    /KI-Konto|AI account/i.test(item),
  );
  if (noAccount) return browserOnly;
  return short[workshop.slug] ?? workshop.needs[0];
}

/** Material nouns of a row in a fixed order, capped, with "N weitere". */
function materialNouns(workshop: Workshop, locale: Locale): readonly string[] {
  const copy = WORKSHOP_PAGE_COPY[locale];
  const present = new Set(workshop.materials.map((material) => material.role));
  const nouns = MATERIAL_ORDER.filter((role) => present.has(role)).map(
    (role) => copy.catalog.materialNouns[role] ?? copy.detail.roleLabels[role],
  );
  if (nouns.length <= MATERIAL_CAP + 1) return nouns;
  return [
    ...nouns.slice(0, MATERIAL_CAP),
    copy.catalog.moreMaterials(nouns.length - MATERIAL_CAP),
  ];
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
  const first =
    workshops.find((workshop) => workshop.number === RECOMMENDED_START) ??
    ordered[0];
  const withPresenter = index
    .filter((workshop) =>
      workshop.materials.some((material) => material.role === "presenter"),
    )
    .map((workshop) => workshop.number);

  return (
    <>
      {/* Between md and lg the globe would sit under the text column, so it
          starts at lg here. From lg the mask stays clear until 32% of the
          globe layer: the text column ends before that at 1024 to 1920 in
          both locales, and Germany sits past the 50% stop, so nothing drawn
          runs under the copy. The bottom padding matches the top. */}
      <CoverBand
        labelledBy="workshops-hub-heading"
        className="md:max-lg:[&>[data-cover-globe]]:hidden lg:[&>[data-cover-globe]]:[mask-image:linear-gradient(to_right,transparent_32%,black_50%)]"
        contentClassName="pb-12 lg:pb-16"
      >
        <Kicker>{copy.hubKicker(workshops.length)}</Kicker>
        {/* 16ch from xl keeps the EN heading on two lines; below xl the wider
            measure would reach the Germany trace. */}
        <h1
          id="workshops-hub-heading"
          className="mt-4 max-w-[14ch] text-display font-bold text-balance text-foreground xl:max-w-[16ch]"
        >
          {copy.hubHeading}
        </h1>
        <p className="mt-6 max-w-[56ch] text-lead md:max-w-[46ch] xl:max-w-[56ch] text-muted-foreground text-pretty">
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
            <ol className="-mb-2 flex snap-x scroll-px-4 gap-x-6 overflow-x-auto pb-2 pr-4 sm:flex-wrap sm:overflow-visible sm:pr-0">
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
          {/* Captions at 14px so the five columns do not wrap into ragged
              one-word lines; the route is capped so it reads as deliberate. */}
          <Route
            stations={copy.routeStations.map((station) => ({
              label: station.label,
              caption: (
                <span className="block text-[0.875rem] leading-snug text-pretty">
                  {station.caption}
                </span>
              ),
            }))}
            mode="description"
            label={copy.routeHeading}
            locale={locale}
            className="mt-8 max-w-[60rem]"
          />
        </div>
      </section>

      <section
        aria-labelledby="workshop-list-heading"
        className="pb-16 pt-14 sm:pb-24 sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-list-heading"
            title={copy.listHeading}
            caption={ordered.length > 1 ? copy.listCaption : undefined}
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

          {/* A note, not a section: two sentences do not earn a Kopflinie. */}
          <div
            data-workshop-teams=""
            className="mt-10 grid max-w-[64ch] gap-2 border-t border-hairline pt-6"
          >
            <h2
              id="workshop-teams-heading"
              className="text-[1.25rem] font-bold leading-[1.25] text-foreground"
            >
              {copy.teamsHeading}
            </h2>
            <p className="text-body text-muted-foreground text-pretty">
              {copy.teamsBody(withPresenter)}
            </p>
          </div>
          <Callout variant="boundary" className="mt-6 max-w-[64ch]">
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
  const headingId = `workshop-${workshop.slug}-heading`;
  const roles = materialNouns(workshop, locale);
  const need = limitingNeed(
    workshop,
    copy.requirementBrowserOnly,
    copy.requirementShort,
  );
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
      // The link's ::after makes the whole row clickable, so keyboard focus
      // rings the whole row too. Without :has() the link keeps its own ring.
      className="group relative grid min-w-0 scroll-mt-24 gap-6 border-b border-hairline py-10 outline-offset-4 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-brand-orange md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10"
    >
      <figure className="min-w-0">
        {DECK_COVERS.has(workshop.number) ? (
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
        ) : (
          <MiniCover workshop={workshop} />
        )}
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
          <AmountText text={workshop.summary} />
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
              <AmountText text={copy.quote(workshop.question)} />
            </blockquote>
          </div>
        </figure>

        {/* 73ch at 13px is the 56ch measure of the 17px summary above, so
            the facts line up with the prose instead of wrapping early. */}
        <dl className="mt-5 grid max-w-[73ch] gap-y-1 text-caption sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
          <dt className="font-semibold text-foreground">{copy.leaveWith}</dt>
          <dd data-workshop-output="" className="text-muted-foreground">
            {workshop.outcome}
          </dd>
          {need ? (
            <>
              <dt className="mt-2 font-semibold text-foreground sm:mt-0">
                {copy.requirementLabel}
              </dt>
              <dd className="text-muted-foreground text-pretty">{need}</dd>
            </>
          ) : null}
          <dt className="mt-2 font-semibold text-foreground sm:mt-0">
            {copy.materialLabel}
          </dt>
          <dd data-workshop-roles="" className="text-muted-foreground">
            {/* Each separator stays on the line of the word before it. */}
            {roles.map((role, position) => (
              <span key={role} className="whitespace-nowrap">
                {role}
                {position < roles.length - 1 ? " · " : ""}
              </span>
            ))}
          </dd>
        </dl>
        {workshop.provenance.liveRunAt ? (
          <p className="mt-2 text-caption text-muted-foreground">
            {copy.liveTested(formatDate(workshop.provenance.liveRunAt, locale))}
          </p>
        ) : null}

        {/* One link per row. Its ::after stretches over the whole row, so the
            cover and the text are clickable too; the row carries the focus
            ring where :has() is supported. */}
        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          // Starts with the visible label (WCAG 2.5.3). An sr-only span would
          // be blockified inside inline-flex and put a space before the colon.
          aria-label={`${copy.viewWorkshop}: ${workshop.title}`}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] after:absolute after:inset-0 hover:decoration-foreground group-hover:decoration-foreground motion-reduce:transition-none supports-[selector(:has(*))]:focus-visible:outline-none"
        >
          {copy.viewWorkshop}
          <ArrowGlyph />
        </Link>
      </div>
    </article>
  );
}

/**
 * CSS mini-cover (design-direction 6.7) for workshops without a deck cover
 * image: graphit, the line globe cut off at the right, the title in paper.
 * Decorative, because the row's h3 carries the title. No Germany trace, so
 * the row keeps no second Mennige mark.
 */
function MiniCover({ workshop }: { readonly workshop: Workshop }) {
  return (
    <div
      aria-hidden="true"
      data-workshop-mini-cover=""
      className="relative isolate aspect-video overflow-hidden bg-dark-bg outline outline-1 outline-foreground"
    >
      <GlobeLines
        highlightGermany={false}
        className="absolute right-[-38%] top-1/2 -z-10 h-auto w-[95%] max-w-none -translate-y-[40%]"
      />
      <div className="flex h-full max-w-[70%] flex-col justify-between p-5 sm:p-6">
        <p className="text-label font-semibold tabular-nums text-dark-muted">
          {workshop.number}
        </p>
        <p className="text-[1.25rem] font-bold leading-[1.2] text-dark-fg text-balance">
          {workshop.title}
        </p>
      </div>
    </div>
  );
}
