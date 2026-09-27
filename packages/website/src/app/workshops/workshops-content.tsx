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
  Kicker,
  Pictogram,
  Route,
  SectionHead,
} from "@/components/werk";
import {
  CapsLine,
  PlakatBand,
  PosterCover,
  PosterNumeral,
  PosterThumb,
} from "@/components/plakat";
import { posterTitleStyle } from "@/lib/plakat/fit";
import {
  hubPlakat,
  workshopPlakat,
  type WorkshopPlakat,
} from "@/lib/plakat/palettes";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";
import { splitTitle } from "./workshop-title";

interface Props {
  readonly workshops: readonly Workshop[];
  readonly locale: Locale;
}

/** Workshops that carry the "Neu" meta chip on the hub. */
const NEW_WORKSHOPS: ReadonlySet<WorkshopNumber> = new Set(["04"]);

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
 * A workshop without a registered poster still gets one; palettes.test.ts
 * keeps every published workshop mapped, so this only guards new entries.
 */
const FALLBACK_POSTER: WorkshopPlakat = { plakat: "lemons", motif: "fan" };

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
  const scene = hubPlakat(workshops);
  const withPresenter = index
    .filter((workshop) =>
      workshop.materials.some((material) => material.role === "presenter"),
    )
    .map((workshop) => workshop.number);

  return (
    <div data-plakat-page={scene}>
      {/* The band takes the newest workshop's scene. Its one poster object is
          the key numeral, the workshop count, in the scene's mark colour: in
          the lg art column, and as a strip after the button on phones. The
          list below is the index, so the band carries no anchor row. */}
      <PlakatBand
        plakat={scene}
        labelledBy="workshops-hub-heading"
        // Phones: a 96px strip with a 10rem glyph, so the first row still
        // starts inside the first screen with the wider fallback face.
        className="[&>[data-plakat-art-phone]]:mt-4 [&>[data-plakat-art-phone]]:h-24"
        art={<PosterNumeral value={workshops.length} plakat={scene} />}
        artPhone={
          <PosterNumeral
            value={workshops.length}
            plakat={scene}
            format="strip"
            className="[&_text]:text-[10rem]"
          />
        }
      >
        <CapsLine>{copy.hubKicker(workshops.length)}</CapsLine>
        <h1
          id="workshops-hub-heading"
          className="poster-title mt-3 max-w-[14ch] text-scene-ink sm:mt-4"
          style={posterTitleStyle(copy.hubHeading)}
        >
          {copy.hubHeading}
        </h1>
        <p className="mt-3 max-w-[40ch] text-body text-scene-ink text-pretty sm:hidden">
          {copy.hubLeadShort}
        </p>
        <p className="mt-5 hidden max-w-[52ch] text-body text-scene-ink text-pretty sm:block">
          {copy.hubLead}
        </p>
        {/* Below 360px the button spans the column, so it never breaks into
            two lines beside a ragged line. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 max-[359px]:grid max-[359px]:grid-cols-1 max-[359px]:[&>a]:w-full max-[359px]:[&>a]:justify-between sm:mt-8">
          {first ? (
            <ButtonLink
              href={localizeHref(`/workshops/${first.slug}`, locale)}
              tone="scene"
              locale={locale}
            >
              {copy.hubStart(first.number)}
            </ButtonLink>
          ) : null}
          <p className="text-body text-scene-ink">{copy.hubAccess}</p>
        </div>
      </PlakatBand>

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
        className="pb-10 pt-5 sm:pb-24 sm:pt-20"
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

          {/* A note, not a section: two sentences do not earn a Kopflinie,
              so it sits under the last row's hairline with no rule of its
              own, its lead-in set in ink. */}
          <p
            data-workshop-teams=""
            className="mt-6 max-w-[64ch] text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:mt-10 sm:text-body"
          >
            <strong className="font-semibold text-foreground">
              {copy.teamsHeading}.
            </strong>{" "}
            {copy.teamsBody(withPresenter)}
          </p>
          <Callout variant="boundary" className="mt-4 max-w-[64ch] sm:mt-6">
            {copy.boundary}
          </Callout>
        </div>
      </section>
    </div>
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
  const poster = workshopPlakat(workshop.slug) ?? FALLBACK_POSTER;

  // Below md a row is a list line, not a card: an 80px poster thumb with the
  // number, a duration line, the title head and one flowing "you leave with"
  // sentence, with an arrow top right. The summary, the question, the need,
  // the materials and the live date live on the workshop page. The row bleeds
  // to the screen edge so the tap highlight and hairline run full width. From
  // md the same DOM is the two-column sheet with the poster cover left.
  return (
    <article
      id={`workshop-${workshop.slug}`}
      data-testid="workshop-row"
      aria-labelledby={headingId}
      // The link's ::after makes the whole row clickable, so keyboard focus
      // rings the whole row too. Without :has() the link keeps its own ring.
      className="group relative grid min-w-0 scroll-mt-24 grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-4 border-b border-hairline py-4 outline-offset-4 transition-colors duration-[120ms] has-[a:active]:bg-card-hover has-[a:focus-visible]:outline has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-brand-orange motion-reduce:transition-none max-md:-mx-4 max-md:px-4 max-md:outline-offset-[-3px] sm:max-md:-mx-6 sm:max-md:px-6 md:grid-cols-[14rem_minmax(0,1fr)] md:items-start md:gap-10 md:py-10 lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <figure className="min-w-0">
        {/* Each row shows its workshop's own poster, in its own palette, on
            the paper list: an 80px thumb on a phone, the cover from md. Both
            are decorative; the row's heading names the workshop. */}
        <div aria-hidden="true" data-workshop-tile="" className="md:hidden">
          <PosterThumb
            plakat={poster.plakat}
            motif={poster.motif}
            numeral={workshop.number}
            size="md"
          />
        </div>
        <div
          aria-hidden="true"
          data-workshop-mini-cover=""
          className="hidden md:block"
        >
          <PosterCover
            plakat={poster.plakat}
            motif={poster.motif}
            numeral={workshop.number}
          />
        </div>
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
