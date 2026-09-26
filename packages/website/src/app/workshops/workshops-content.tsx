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
import { splitTitle } from "./workshop-title";

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
 * Each phone tile turns the line globe to a different longitude, so the four
 * tiles read as one family without repeating the same picture.
 */
function tileView(number: WorkshopNumber) {
  return { centerLat: 28, centerLon: -50 + Number(number) * 35, radius: 500 };
}

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
      {/* Phones get a compact band: a cropped corner globe, a 34px heading,
          the one-sentence lead and the start button, then straight into the
          list. From sm the reviewed desktop band returns unchanged. */}
      <CoverBand
        labelledBy="workshops-hub-heading"
        phoneGlobe
        className="md:max-lg:[&>[data-cover-globe]]:hidden lg:[&>[data-cover-globe]]:[mask-image:linear-gradient(to_right,transparent_32%,black_50%)]"
        contentClassName="pt-6 pb-6 sm:pt-16 sm:pb-12 lg:pt-24 lg:pb-16"
      >
        <Kicker>{copy.hubKicker(workshops.length)}</Kicker>
        {/* 16ch from xl keeps the EN heading on two lines; below xl the wider
            measure would reach the Germany trace. */}
        <h1
          id="workshops-hub-heading"
          className="mt-3 text-[1.875rem]/[1.08] font-bold text-balance text-foreground max-sm:tracking-[-0.01em] sm:mt-4 sm:max-w-[14ch] sm:text-display xl:max-w-[16ch]"
        >
          {copy.hubHeading}
        </h1>
        <p className="mt-3 max-w-[40ch] text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:hidden">
          {copy.hubLeadShort}
        </p>
        <p className="mt-6 hidden max-w-[56ch] text-lead md:max-w-[46ch] xl:max-w-[56ch] text-muted-foreground text-pretty sm:block">
          {copy.hubLead}
        </p>
        {/* Below 360px the button spans the column, so it never breaks into
            two lines beside a ragged caption. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 max-[359px]:grid max-[359px]:grid-cols-1 max-[359px]:[&>a]:w-full max-[359px]:[&>a]:justify-between sm:mt-8 sm:gap-y-3">
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
            className="mt-12 hidden border-t border-hairline pt-2 md:block"
          >
            {/* Below md the compact list itself is the index, so the row of
                anchors only appears with the two-column sheet. */}
            <ol className="-mb-2 flex flex-wrap gap-x-6 pb-2">
              {index.map((workshop) => (
                <li key={workshop.slug} className="shrink-0">
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

      {/* Phones skip the route: every workshop page opens with its own
          agenda, and here it would push the list below the first screen. */}
      <section
        aria-labelledby="workshop-route-heading"
        className="hidden pt-6 sm:block sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-route-heading"
            title={copy.routeHeading}
            caption={copy.routeCaption}
            size="compact"
          />
          {/* Phones: the five station names on one scroll-snapped rail, no
              captions. From sm the captions return at 14px so the five
              columns do not wrap into ragged one-word lines; the route is
              capped so it reads as deliberate. */}
          <Route
            stations={copy.routeStations.map((station) => ({
              label: station.label,
              caption: (
                <span className="hidden text-[0.875rem] leading-snug text-pretty sm:block">
                  {station.caption}
                </span>
              ),
            }))}
            mode="description"
            label={copy.routeHeading}
            locale={locale}
            layout="rail"
            className="mt-4 max-w-[60rem] sm:mt-8"
          />
        </div>
      </section>

      <section
        aria-labelledby="workshop-list-heading"
        className="pb-10 pt-7 sm:pb-24 sm:pt-20"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-list-heading"
            title={copy.listHeading}
            caption={ordered.length > 1 ? copy.listCaption : undefined}
            size="compact"
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
              {ordered.map((workshop) => (
                <li key={workshop.slug} className="min-w-0">
                  <WorkshopRow workshop={workshop} locale={locale} />
                </li>
              ))}
            </ol>
          )}

          {/* A note, not a section: two sentences do not earn a Kopflinie. */}
          <div
            data-workshop-teams=""
            className="mt-6 grid max-w-[64ch] gap-1 border-t border-hairline pt-4 sm:mt-10 sm:gap-2 sm:pt-6"
          >
            <h2
              id="workshop-teams-heading"
              className="text-[1.0625rem] font-bold leading-[1.25] text-foreground sm:text-[1.25rem]"
            >
              {copy.teamsHeading}
            </h2>
            <p className="text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:text-body">
              {copy.teamsBody(withPresenter)}
            </p>
          </div>
          <Callout variant="boundary" className="mt-4 max-w-[64ch] sm:mt-6">
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
}: {
  readonly workshop: Workshop;
  readonly locale: Locale;
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
  const isNew = NEW_WORKSHOPS.has(workshop.number);
  const isStart = workshop.number === RECOMMENDED_START;
  const title = splitTitle(workshop.title);

  // Below md a row is a list line, not a card: a 56px graphit tile with the
  // number, a duration line, the title head and one flowing "you leave with"
  // sentence, with an arrow top right. The summary, the question, the need,
  // the materials and the live date live on the workshop page. The row bleeds
  // to the screen edge so the tap highlight and hairline run full width. From
  // md the same DOM is the reviewed two-column sheet.
  return (
    <article
      id={`workshop-${workshop.slug}`}
      data-testid="workshop-row"
      aria-labelledby={headingId}
      // The link's ::after makes the whole row clickable, so keyboard focus
      // rings the whole row too. Without :has() the link keeps its own ring.
      className="group relative grid min-w-0 scroll-mt-24 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3.5 border-b border-hairline py-4 outline-offset-4 transition-colors duration-[120ms] has-[a:active]:bg-card-hover has-[a:focus-visible]:outline has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-brand-orange motion-reduce:transition-none max-md:-mx-4 max-md:px-4 max-md:outline-offset-[-3px] sm:max-md:-mx-6 sm:max-md:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-stretch md:gap-10 md:py-10"
    >
      <figure className="min-w-0">
        <div
          aria-hidden="true"
          data-workshop-tile=""
          className="relative isolate flex size-14 items-end overflow-hidden bg-dark-bg p-1.5 md:hidden"
        >
          <GlobeLines
            highlightGermany={false}
            step={15}
            view={tileView(workshop.number)}
            className="absolute -right-7 -top-7 -z-10 size-[4.75rem] max-w-none"
          />
          <span className="text-[1.0625rem] font-bold leading-none tabular-nums text-dark-fg">
            {workshop.number}
          </span>
        </div>
        {DECK_COVERS.has(workshop.number) ? (
          <div className="hidden aspect-video overflow-hidden bg-dark-bg outline outline-1 outline-foreground md:block">
            <Image
              src={`/workshops/${workshop.slug}/card-preview.webp`}
              alt=""
              width={1024}
              height={576}
              // Below the cover band at every width, and hidden on phones,
              // where a lazy image in a display:none box is never fetched.
              loading="lazy"
              sizes="(min-width: 1200px) 470px, (min-width: 768px) 40vw, calc(100vw - 32px)"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <MiniCover workshop={workshop} />
        )}
        <figcaption className="mt-2 hidden text-caption text-muted-foreground md:block">
          {workshop.format}
        </figcaption>
      </figure>

      <div className="min-w-0">
        {/* The arrow sits beside the title, so only the title keeps clear
            of it (pr-8); the meta line uses the full width. */}
        <p
          data-workshop-meta=""
          className="text-caption text-muted-foreground tabular-nums md:hidden"
        >
          {isStart ? (
            <>
              <span className="font-semibold text-foreground">
                {copy.startHere}
              </span>
              {" · "}
            </>
          ) : null}
          {isNew ? (
            <>
              <span className="font-semibold text-foreground">
                {copy.newBadge}
              </span>
              {" · "}
            </>
          ) : null}
          <span className="whitespace-nowrap">
            {copy.rowTimes(workshop.minutesLive, workshop.minutesSelfStudy)}
          </span>
        </p>
        <div className="hidden flex-wrap items-center gap-x-3 gap-y-2 md:flex">
          <Kicker>
            {[copy.workshopNumber(workshop.number), ...times].join(" · ")}
          </Kicker>
          {isNew ? <Chip>{copy.newBadge}</Chip> : null}
        </div>
        {/* A phone row shows the title head only; the subtitle stays in the
            heading's text and accessible name. */}
        <h3
          id={headingId}
          className="mt-0.5 max-w-[28ch] pr-8 text-[1.0625rem] font-bold leading-[1.2] tracking-[-0.01em] text-foreground text-balance decoration-2 underline-offset-4 group-hover:underline md:mt-2 md:text-[1.75rem]"
        >
          {title.head}
          {title.subtitle ? (
            <span className="sr-only md:not-sr-only">: {title.subtitle}</span>
          ) : null}
        </h3>
        {/* The title is the phone hook; the summary returns from md. */}
        <p className="mt-3 hidden max-w-[56ch] text-body text-muted-foreground text-pretty md:block">
          <AmountText text={workshop.summary} />
        </p>

        <figure
          data-workshop-question=""
          className="hidden max-w-[56ch] grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 md:mt-5 md:grid"
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
            the facts line up with the prose instead of wrapping early. On a
            phone only the first pair stays, as one flowing sentence over the
            full width, capped at two lines: what you leave with. */}
        <dl className="mt-1 grid max-w-[73ch] grid-cols-[auto_minmax(0,1fr)] gap-x-1.5 gap-y-1 text-caption max-md:line-clamp-2 md:mt-5 md:gap-x-4">
          <dt className="font-semibold text-foreground max-md:mr-1 max-md:inline max-md:after:content-[':']">
            {copy.leaveWith}
          </dt>
          <dd
            data-workshop-output=""
            className="text-muted-foreground max-md:inline"
          >
            {workshop.outcome}
          </dd>
          {need ? (
            <>
              <dt className="hidden font-semibold text-foreground md:block">
                {copy.requirementLabel}
              </dt>
              <dd className="hidden text-muted-foreground text-pretty md:block">
                {need}
              </dd>
            </>
          ) : null}
          <dt className="hidden font-semibold text-foreground md:block">
            {copy.materialLabel}
          </dt>
          <dd
            data-workshop-roles=""
            className="hidden text-muted-foreground md:block"
          >
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
          <p className="mt-2 hidden text-caption text-muted-foreground md:block">
            {copy.liveTested(formatDate(workshop.provenance.liveRunAt, locale))}
          </p>
        ) : null}

        {/* One link per row. Its ::after stretches over the whole row, so the
            cover and the text are clickable too; the row carries the focus
            ring where :has() is supported. On a phone the link itself covers
            the row and shows only the arrow, top right beside the title; the
            label stays its name. */}
        <Link
          href={localizeHref(`/workshops/${workshop.slug}`, locale)}
          // Starts with the visible label (WCAG 2.5.3). An sr-only span would
          // be blockified inside inline-flex and put a space before the colon.
          aria-label={`${copy.viewWorkshop}: ${workshop.title}`}
          className="inline-flex min-h-11 min-w-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] [-webkit-tap-highlight-color:transparent] after:absolute after:inset-0 hover:decoration-foreground group-hover:decoration-foreground motion-reduce:transition-none supports-[selector(:has(*))]:focus-visible:outline-none max-md:absolute max-md:inset-0 max-md:items-start max-md:justify-end max-md:px-4 max-md:pt-[2.375rem] sm:max-md:px-6 md:mt-4"
        >
          <span className="max-md:sr-only">{copy.viewWorkshop}</span>
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
      className="relative isolate hidden aspect-video overflow-hidden bg-dark-bg outline outline-1 outline-foreground md:block"
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
