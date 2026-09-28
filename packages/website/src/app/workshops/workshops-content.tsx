import Link from "next/link";
import { Fragment } from "react";
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
  cx,
  Kicker,
  Route,
  SectionHead,
} from "@/components/werk";
import { PosterCover, PosterThumb } from "@/components/plakat";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { workshopPlakat, type WorkshopPlakat } from "@/lib/plakat/palettes";
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
  const withPresenter = index
    .filter((workshop) =>
      workshop.materials.some((material) => material.role === "presenter"),
    )
    .map((workshop) => workshop.number);

  return (
    <div>
      <HubHero workshops={workshops} index={index} first={first} locale={locale} />

      <section
        aria-labelledby="workshop-list-heading"
        className="pt-5 sm:pt-16"
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
            {withPresenter.length > 0 ? (
              <span data-workshop-key-hint="" className="max-lg:hidden">
                {" "}
                {copy.teamsKeyHint}
              </span>
            ) : null}
          </p>
        </div>
      </section>

      {/* The route follows the list, so the posters come right after the
          band. Phones skip it: every workshop page opens with its own
          agenda. */}
      <section
        aria-labelledby="workshop-route-heading"
        className="hidden pt-16 sm:block"
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

      <div className={cx(CONTAINER, "pb-10 pt-4 sm:pb-24 sm:pt-12")}>
        <Callout variant="boundary" className="max-w-[64ch]">
          {copy.boundary}
        </Callout>
      </div>
    </div>
  );
}

/**
 * Catalogue index bars in the hero card, one per workshop in number order,
 * widest first. Four pastel washes of the brand palette; ink text on each
 * stays above 12:1.
 */
const INDEX_WASHES = [
  "bg-brand-pink/70",
  "bg-brand-sky/70",
  "bg-brand-peach/75",
  "bg-brand-acid/80",
] as const;
const INDEX_WIDTHS = ["w-full", "w-[88%]", "w-[76%]", "w-[64%]"] as const;

/**
 * The hub header on paper (the reviewed look of 6f2617a): a mono kicker, the
 * H1 with its tail on a sky highlight band, the lead and the start button on
 * the left; a slightly tilted "Im Katalog" card on an acid offset sheet on
 * the right. Two pastel geometry blocks, a sky band top right and a pink band
 * bottom left, sit behind everything. No poster band and no key numeral: the
 * count is set in the card, where it always fits.
 */
function HubHero({
  workshops,
  index,
  first,
  locale,
}: {
  readonly workshops: readonly Workshop[];
  readonly index: readonly Workshop[];
  readonly first: Workshop | undefined;
  readonly locale: Locale;
}) {
  const copy = WORKSHOP_PAGE_COPY[locale].catalog;
  const highlight = copy.hubHeading.endsWith(copy.hubHeadingHighlight)
    ? copy.hubHeadingHighlight
    : "";
  const lead = copy.hubHeading.slice(
    0,
    copy.hubHeading.length - highlight.length,
  ).trim();

  return (
    <section
      aria-labelledby="workshops-hub-heading"
      data-workshop-hero=""
      className="relative isolate overflow-hidden border-b border-border bg-paper pb-6 pt-5 sm:py-14"
    >
      {/* Geometry: decorative pastel blocks, behind the text (isolate keeps
          them inside this section's stacking context). */}
      <span
        aria-hidden="true"
        data-workshop-geometry="sky"
        // Phones: a short band in the free corner right of the kicker, above
        // the H1, so it never sits under the lead or the highlight band.
        className="pointer-events-none absolute -right-10 top-2 -z-10 h-10 w-[42vw] rotate-3 bg-brand-sky/60 sm:top-12 sm:h-28 sm:w-80"
      />
      <span
        aria-hidden="true"
        data-workshop-geometry="pink"
        className="pointer-events-none absolute -left-20 bottom-10 -z-10 h-16 w-56 -rotate-6 bg-brand-pink/55 sm:h-20 sm:w-72"
      />
      <div className={cx(CONTAINER, "relative grid gap-5 sm:gap-8 md:grid-cols-12 md:items-center lg:gap-10")}>
        <header className="relative min-w-0 py-1 sm:py-3 md:col-span-7 lg:col-span-8 lg:py-8">
          <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            <span className="size-3 shrink-0 bg-brand-teal" aria-hidden="true" />
            {copy.hubKicker(workshops.length)}
          </p>
          <h1
            id="workshops-hub-heading"
            className="mt-4 max-w-[15ch] text-[2.25rem] font-bold leading-[0.9] tracking-[-0.06em] text-foreground text-balance sm:mt-5 sm:text-[clamp(2.65rem,6vw,5.75rem)]"
          >
            {/* Positioned, so its glyphs paint above the next line's band:
                a descender ("p") would otherwise sit under the sky wash. */}
            <span className="relative">{lead}</span>
            {highlight ? (
              <>
                {" "}
                <HighlightedText colorVar="--color-brand-sky">
                  {highlight}
                </HighlightedText>
              </>
            ) : null}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {copy.hubLead}
          </p>
          {first ? (
            // Below 360px the button spans the column, so its label never
            // breaks into two lines.
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 max-[359px]:grid max-[359px]:grid-cols-1 max-[359px]:[&>a]:w-full max-[359px]:[&>a]:justify-between sm:mt-8">
              <ButtonLink
                href={localizeHref(`/workshops/${first.slug}`, locale)}
                locale={locale}
              >
                {copy.hubStart(first.number)}
              </ButtonLink>
              <p className="text-sm text-muted-foreground">{copy.hubAccess}</p>
            </div>
          ) : null}
        </header>

        <aside
          aria-label={copy.catalogueIndex}
          data-workshop-catalogue=""
          className="relative min-w-0 max-w-md -rotate-1 pb-3 pr-3 md:col-span-5 md:max-w-none lg:col-span-4"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 bg-brand-acid/75"
          />
          <div className="relative bg-paper p-4 shadow-card ring-1 ring-foreground/30 sm:p-6">
            <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3 sm:pb-4">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.catalogueIndex}
              </span>
              <strong className="text-3xl font-bold leading-none tracking-[-0.07em] text-foreground tabular-nums sm:text-4xl">
                {String(workshops.length).padStart(2, "0")}
              </strong>
            </div>
            {/* Jump links to each row. Phones get one row of four numbered
                squares (44px targets); from sm each bar names its topic. */}
            {index.length > 0 ? (
              <ol
                data-workshop-catalogue-chips=""
                className="mt-3 flex flex-wrap gap-2 sm:hidden"
              >
                {index.map((workshop, position) => (
                  <li key={workshop.slug}>
                    <a
                      href={`#workshop-${workshop.slug}`}
                      className={cx(
                        "flex size-11 items-center justify-center font-mono text-xs font-bold text-foreground focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                        INDEX_WASHES[position % INDEX_WASHES.length],
                      )}
                    >
                      {workshop.number}
                      <span className="sr-only"> {workshop.topic}</span>
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
            {index.length > 0 ? (
              <ol className="mt-5 hidden space-y-2 sm:block">
                {index.map((workshop, position) => (
                  <li key={workshop.slug}>
                    <a
                      href={`#workshop-${workshop.slug}`}
                      className={cx(
                        "flex min-h-11 items-center gap-3 px-3 font-mono text-xs font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                        INDEX_WASHES[position % INDEX_WASHES.length],
                        INDEX_WIDTHS[position % INDEX_WIDTHS.length],
                      )}
                    >
                      <span>{workshop.number}</span>
                      <span className="font-sans text-sm">{workshop.topic}</span>
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
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
  // sentence, with an arrow top right. The summary, the need, the
  // materials and the live date live on the workshop page. The row bleeds
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
          {/* Each time stays whole, with its separator on the line before:
              at 320px the pair no longer fits one line, and a single
              unbreakable run would push into the arrow. */}
          {copy
            .rowTimes(workshop.minutesLive, workshop.minutesSelfStudy)
            .split(" · ")
            .map((part, position, parts) =>
              position < parts.length - 1 ? (
                <Fragment key={part}>
                  <span className="whitespace-nowrap">{part} ·</span>{" "}
                </Fragment>
              ) : (
                <span key={part} className="whitespace-nowrap">
                  {part}
                </span>
              ),
            )}
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
