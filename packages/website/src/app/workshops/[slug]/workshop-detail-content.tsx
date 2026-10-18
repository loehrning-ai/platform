import Link from "next/link";
import type { ReactNode } from "react";
import type {
  Workshop,
  WorkshopMaterial,
  WorkshopMaterialRole,
  WorkshopPhase,
} from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { workshopKitPath } from "@/lib/workshop-kit";
import { workshopKitMaterial } from "@/lib/workshops";
import { materialMeta, workshopStage } from "@/lib/workshop-stage";
import {
  ArrowGlyph,
  Callout,
  Chip,
  cx,
  Pictogram,
  StatRow,
  type PictogramName,
} from "@/components/werk";
import {
  CapsLine,
  PlakatBand,
  PosterArt,
  ResultChart,
} from "@/components/plakat";
import { WorkshopStage } from "@/components/workshops/workshop-stage";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import {
  PLAKAT,
  workshopPlakat,
  type PlakatKey,
  type WorkshopPlakat,
} from "@/lib/plakat/palettes";
import { materialLanguageLabel, WORKSHOP_PAGE_COPY } from "../workshop-copy";
import { splitTitle } from "../workshop-title";
import { WorkshopMaterialLink } from "./workshop-material-link";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

type DetailCopy = (typeof WORKSHOP_PAGE_COPY)[Locale]["detail"];

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";
// Phones get a tighter rhythm; sm hands back the reviewed spacing.
const MATERIAL_ANCHOR = "material";

/** One pictogram family on the page: every material role maps to a deck glyph. */
const ROLE_PICTOGRAM: Readonly<Record<WorkshopMaterialRole, PictogramName>> = {
  deck: "deck",
  presenter: "person",
  demo: "demo",
  guide: "guide",
  lab: "chart",
  case: "calendar",
  card: "checklist",
  exercise: "canvas",
  kit: "download",
  data: "table",
  hub: "export",
  builder: "database",
};

const PHASE_ORDER: readonly WorkshopPhase[] = ["before", "during", "after"];

const CASE_ANCHOR = "fall";

/**
 * A workshop without a registered poster still gets a scene, so the page
 * never falls back to a paper band; palettes.test.ts keeps every published
 * workshop mapped.
 */
const FALLBACK_SCENE: WorkshopPlakat = { plakat: "lemons", motif: "fan" };

/**
 * The marker band behind the tail of the H1, per scene (HighlightedText: a
 * 0.75em stripe, so the poster leading of 0.92 never lets two lines' bands
 * touch). The words stay in the scene ink; the stripe is the scene's mid
 * colour, strong enough to read as a band on the ground and never under 3:1
 * against the ink (the title is display size):
 * - lemons: Mennige, Butter on it 4.96.
 * - idea: Himbeere at 35% over Kreide, Kobalt on it 4.38.
 * - bloom: Terrakotta at 80% over Sand, Aubergine on it 5.03.
 * - autumn: Ocker at 30% over Rost, Creme on it 3.43. Rost leaves little
 *   room for a lighter wash (Creme is 4.80 on the plain ground), so the band
 *   stays a tint and the 3:1 display floor keeps its margin.
 * - sage: Bernstein at 100% over Salbei (1.75 against the ground, a visible
 *   band), Tanne on it 4.46.
 */
export const TITLE_HIGHLIGHT: Readonly<
  Record<PlakatKey, { readonly colorVar: `--color-${string}`; readonly opacity: number }>
> = {
  lemons: { colorVar: "--color-scene-mid", opacity: 100 },
  idea: { colorVar: "--color-scene-mid", opacity: 35 },
  bloom: { colorVar: "--color-scene-mid", opacity: 80 },
  autumn: { colorVar: "--color-scene-mid", opacity: 30 },
  sage: { colorVar: "--color-scene-mid", opacity: 100 },
};

/** Longest two-word tail that still reads as a short marked phrase. */
const HIGHLIGHT_PAIR_MAX = 12;

/**
 * A workshop whose H1 marks one chosen word instead of its tail, per locale.
 * Workshop 05 marks "Data" in "Where Your Data Goes", the word the whole
 * workshop is about; the words after it follow the band unmarked.
 */
const HEADLINE_MARK: Readonly<
  Record<string, Readonly<Partial<Record<Locale, string>>>>
> = {
  "ki-im-unternehmen-sicher-nutzen": { de: "Daten", en: "Data" },
};

/**
 * The H1 split for its highlight: a short last pair goes on the band ("mit
 * KI", "für KI?", "the future?"), otherwise only the last word
 * ("vorhersagen?"), so the band marks a phrase and never fills two lines. A
 * one-word title gets no band. With `mark`, that whole word is the band and
 * what follows it comes back as `tail`.
 */
export function titleHighlight(
  head: string,
  mark?: string,
): {
  readonly lead: string;
  readonly highlight: string;
  readonly tail?: string;
} {
  const words = head.trim().split(/\s+/);
  if (mark) {
    const at = words.indexOf(mark);
    if (at >= 0) {
      const tail = words.slice(at + 1).join(" ");
      return {
        lead: words.slice(0, at).join(" "),
        highlight: mark,
        ...(tail ? { tail } : {}),
      };
    }
  }
  if (words.length < 2) return { lead: head, highlight: "" };
  const pair = words.slice(-2).join(" ");
  const count =
    words.length >= 3 && pair.length <= HIGHLIGHT_PAIR_MAX ? 2 : 1;
  return {
    lead: words.slice(0, -count).join(" "),
    highlight: words.slice(-count).join(" "),
  };
}

function formatDate(value: string, locale: Locale): string {
  // Provenance dates may be a month ("2026-08") or a day ("2026-09-25").
  const monthOnly = /^\d{4}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    ...(monthOnly
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${monthOnly ? `${value}-01` : value}T00:00:00Z`));
}

/** A no-break space before a currency sign, so "19.960 €" never ends a line with the number alone. */
function keepAmountsTogether(text: string): string {
  return text.replace(/(\d) (?=[€$£])/g, "$1\u00a0");
}

/** Caption lines join facts that start lowercase mid-line; the line itself starts upper case. */
function sentenceStart(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** Characters that fit two phone lines at 14px on a 320px screen. */
const PHONE_DESCRIPTION_BUDGET = 72;

/**
 * A material description for a phone row. An authored short text wins.
 * Otherwise the first sentence, without parentheses and without what follows
 * a semicolon. A registry material whose sentence is still longer than two
 * phone lines carries a short text (the registry test pins that), so the
 * fallback below, which ends at the last comma or word with an ellipsis,
 * only guards material added without one. The meta line under it already
 * says format, language and "optional".
 */
export function phoneDescription(text: string, short?: string): string {
  if (short) return short;
  let first = text.split(/(?<=[.!?])\s+(?=\p{Lu})/u)[0] ?? text;
  first = first.replace(/\s*\([^)]*\)/g, "");
  const semicolon = first.indexOf(";");
  if (semicolon > 0) first = `${first.slice(0, semicolon).trimEnd()}.`;
  first = first.trim();
  if (first.length <= PHONE_DESCRIPTION_BUDGET) return first;
  const head = first.slice(0, PHONE_DESCRIPTION_BUDGET);
  const comma = head.lastIndexOf(", ");
  const cut = comma > 30 ? comma : head.lastIndexOf(" ");
  return `${head.slice(0, cut).replace(/[\s,:;]+$/, "")} …`;
}

function SquareList({
  items,
  className,
}: {
  readonly items: readonly ReactNode[];
  readonly className?: string;
}) {
  return (
    <ul className={cx("grid gap-1.5 sm:gap-3", className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className="grid grid-cols-[0.625rem_minmax(0,1fr)] items-baseline gap-3 text-[0.9375rem]/[1.5] text-foreground sm:text-body"
        >
          <span
            aria-hidden="true"
            className="size-2.5 -translate-y-px bg-foreground"
          />
          <span className="max-w-[60ch] text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const MATERIAL_LINK_CLASS =
  "-mt-2.5 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] after:absolute after:inset-0 after:content-[''] group-hover:decoration-foreground max-sm:absolute max-sm:inset-0 max-sm:mt-0 max-sm:items-start max-sm:justify-end max-sm:pt-[0.9375rem] sm:min-w-0 sm:justify-start sm:self-start";

function MaterialRow({
  workshopSlug,
  material,
  copy,
  locale,
  pagePath,
}: {
  readonly workshopSlug: string;
  readonly material: WorkshopMaterial;
  readonly copy: DetailCopy;
  readonly locale: Locale;
  /** Set when the card opens a page about the material (the kit page) instead of the file itself. */
  readonly pagePath?: string;
}) {
  const download = material.kind !== "html" && !pagePath;
  const shortDescription = phoneDescription(
    material.description,
    material.short,
  );
  const notes = [
    material.primary ? copy.startHere : null,
    // Skip the minutes when the label already carries them ("Browserlabor · 12 Min.").
    material.minutes && !material.label.includes(copy.minutes(material.minutes))
      ? copy.minutes(material.minutes)
      : null,
    material.optional ? copy.optional : null,
  ].filter((note): note is string => Boolean(note));

  const actionContent = (
    <>
      <span className="max-sm:sr-only">
        {pagePath
          ? copy.kitPageAction
          : download
            ? copy.downloadAction
            : copy.openAction}
      </span>
      <span className="sr-only">{`: ${material.label}, `}</span>
      <span className="sr-only">
        {`${copy.language}: ${materialLanguageLabel(locale, material.language)}`}
      </span>
      <ArrowGlyph direction={download ? "down" : "right"} />
    </>
  );

  return (
    <li
      data-material-row=""
      data-material-role={material.role}
      className={cx(
        "group relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-3 border-b border-hairline py-3 transition-colors duration-[120ms] hover:bg-card-hover has-[a:active]:bg-card-hover sm:grid-cols-[2rem_minmax(0,1fr)_8.5rem_7.5rem] sm:items-start sm:gap-x-6 sm:gap-y-2 sm:py-5",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-orange [&_a:focus-visible]:outline-none",
      )}
    >
      <Pictogram
        name={ROLE_PICTOGRAM[material.role]}
        strokeWidth={2}
        className="mt-0.5 size-6 text-foreground sm:-mt-1 sm:size-8"
      />
      <div className="min-w-0">
        <h4 className="text-base font-bold leading-snug text-foreground max-sm:pr-8 sm:text-[1.0625rem]">
          {material.primary ? (
            <span
              aria-hidden="true"
              className="mr-2 inline-block size-2.5 -translate-y-0.5 bg-foreground"
            />
          ) : null}
          {material.label}
        </h4>
        {/* A phone row shows the first clause, so a clamp never cuts a
            sentence mid-word; the full text returns from sm. */}
        {shortDescription === material.description ? (
          <p className="mt-0.5 line-clamp-2 max-w-[62ch] text-[0.875rem] leading-normal text-muted-foreground text-pretty sm:mt-1 sm:line-clamp-none sm:text-[0.9375rem]">
            {material.description}
          </p>
        ) : (
          <>
            <p
              data-material-short=""
              className="mt-0.5 line-clamp-2 text-[0.875rem] leading-normal text-muted-foreground text-pretty sm:hidden"
            >
              {shortDescription}
            </p>
            <p className="mt-1 hidden max-w-[62ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty sm:block">
              {material.description}
            </p>
          </>
        )}
        {/* Phones: format and size join the notes line instead of a chip. */}
        {notes.length > 0 ? (
          <p className="mt-1 text-caption text-muted-foreground tabular-nums sm:mt-1.5">
            {notes.join(" · ")}
            <span className="sm:hidden"> · {materialMeta(material)}</span>
          </p>
        ) : (
          <p className="mt-1 text-caption text-muted-foreground tabular-nums sm:hidden">
            {materialMeta(material)}
          </p>
        )}
      </div>
      {/* Phones: the link covers the row and shows only the arrow, top
          right beside the title, so the text keeps the full width; the label
          stays its accessible name. From sm chip and labelled action sit on
          the title line in their own columns. */}
      <div className="contents">
        <div
          className="hidden sm:col-start-auto sm:-mt-0.5 sm:block sm:justify-self-start"
          aria-hidden="true"
        >
          <Chip className="tabular-nums">{materialMeta(material)}</Chip>
        </div>
        {pagePath ? (
          // The kit card of a workshop with a kit page opens that page; the
          // download (and its count) happens there.
          <Link href={pagePath} className={MATERIAL_LINK_CLASS}>
            {actionContent}
          </Link>
        ) : (
          <WorkshopMaterialLink
            workshopSlug={workshopSlug}
            material={material}
            className={MATERIAL_LINK_CLASS}
          >
            {actionContent}
          </WorkshopMaterialLink>
        )}
      </div>
    </li>
  );
}

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].detail;
  const { caseStudy, realWorldCase, provenance } = workshop;

  // The "all in English" note is derived from the data, so it disappears as
  // soon as one material is published in another language.
  const allMaterialsEnglish = workshop.materials.every(
    (material) => material.language === "en",
  );
  // A workshop with a kit block sends its kit row (in the material list, if
  // it shows one) to the kit page instead of to the zip.
  const kitMaterial = workshopKitMaterial(workshop);
  const kitPath = kitMaterial
    ? localizeHref(workshopKitPath(workshop.slug), locale)
    : undefined;
  const kitPagePath = (material: WorkshopMaterial) =>
    material === kitMaterial ? kitPath : undefined;
  const title = splitTitle(workshop.title);
  const heading = titleHighlight(title.head, HEADLINE_MARK[workshop.slug]?.[locale]);
  const scene = workshopPlakat(workshop.slug) ?? FALLBACK_SCENE;

  // The stage's two cards reach the first two materials. A material list in
  // "More details" is only worth its place when some file is left over.
  const stage = workshopStage(workshop, locale);
  const reachedByStage = new Set<WorkshopMaterial>(
    [stage.a?.material, stage.b?.material].filter((material): material is WorkshopMaterial =>
      Boolean(material),
    ),
  );
  const showMaterials = workshop.materials.some(
    (material) => !reachedByStage.has(material),
  );

  const coverFacts = [
    workshop.minutesLive ? copy.minutesLive(workshop.minutesLive) : null,
    workshop.selfStudyDurationLabel ?? copy.minutesSelfStudy(workshop.minutesSelfStudy),
    // An invented case is named once, in the caption line of the case section.
    caseStudy.isFictional
      ? realWorldCase
        ? copy.coverFacts.publicFigures
        : null
      : copy.realCompanyData,
    allMaterialsEnglish && locale === "de"
      ? copy.coverFacts.materialsInEnglish
      : null,
    copy.coverFacts.free,
  ].filter((fact): fact is string => Boolean(fact));

  // The materials the outcomes need, in taught order, with the place to start
  // first; optional files wait behind one disclosure.
  const ordered = PHASE_ORDER.flatMap((phase) =>
    workshop.materials.filter((material) => material.phase === phase),
  );
  const coreMaterials = ordered.filter((material) => !material.optional);
  const optionalMaterials = ordered.filter((material) => material.optional);
  const hasPresenter = workshop.materials.some(
    (material) => material.role === "presenter",
  );

  // One slim line: who, when it was checked, and what kind of data.
  const provenanceFacts = [
    provenance.author,
    `${copy.provenanceLabels.reviewedAt} ${formatDate(provenance.reviewedAt, locale)}`,
    provenance.aiOutputsRecordedAt
      ? `${copy.provenanceLabels.aiOutputsRecordedAt} ${formatDate(provenance.aiOutputsRecordedAt, locale)}`
      : null,
    provenance.liveRunAt
      ? `${copy.provenanceLabels.liveRunAt} ${formatDate(provenance.liveRunAt, locale)}`
      : null,
    provenance.data === "synthetic" ? null : copy.provenanceData[provenance.data],
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <article
      data-plakat-page={scene.plakat}
      className="bg-background pb-28 sm:pb-24"
    >
      {/* Phones carry the back link at the top of the band instead, so the
          band starts right under the compact header. */}
      <nav
        aria-label={copy.navigation}
        className="border-b border-hairline max-sm:hidden"
      >
        <div className={CONTAINER}>
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            // The bar is exactly as tall as the link, between the sticky
            // header and the cover band, so the ring is drawn inside it.
            className="inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-foreground focus-visible:outline-offset-[-3px]"
          >
            <BackGlyph />
            {copy.allWorkshops}
          </Link>
        </div>
      </nav>

      <PlakatBand
        plakat={scene.plakat}
        labelledBy="workshop-title"
        // Below lg the poster is a full-bleed 16:9 row after the actions:
        // the numeral and the motif at full column width (219px at 390), so
        // a phone band reads as the poster, not as a page of type with a
        // scrap of art in the corner.
        artPhoneLayout="poster"
        // Phones: an 8:3 poster row, so the title, the summary and the top of
        // the first action card share the first screen (390 x 664).
        className="[&>[data-plakat-art-phone]]:mt-4 max-sm:[&>[data-plakat-art-phone]]:mt-3 max-sm:[&>[data-plakat-art-phone]]:aspect-[8/3]"
        // IDEA marks the band's own corners, as on the reference poster; the
        // art inside then carries no dots of its own. Phones start the
        // content at the same 20px on every band: the back link sits clear
        // of the dots, so the band rhythm does not change per workshop.
        cornerDots={PLAKAT[scene.plakat].cornerDots}
        contentClassName="max-sm:pt-5 lg:py-10"
        art={
          <PosterArt
            plakat={scene.plakat}
            motif={scene.motif}
            numeral={workshop.number}
            format="portrait"
            cornerDots={false}
          />
        }
        artPhone={
          <PosterArt
            plakat={scene.plakat}
            motif={scene.motif}
            numeral={workshop.number}
            format="landscape"
            cornerDots={false}
          />
        }
      >
        {/* Phones carry the back link inside the band; from sm the paper bar
            above the band holds it. */}
        <Link
          href={localizeHref("/workshops", locale)}
          aria-label={copy.backAria}
          data-cover-back=""
          className="-my-2 inline-flex min-h-11 items-center gap-2 text-[1.0625rem] font-semibold text-scene-ink underline decoration-transparent decoration-2 underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-scene-ink sm:hidden"
        >
          <BackGlyph />
          {copy.workshopsShort}
        </Link>
        {/* CapsLine keeps each " · " part whole with its separator, so a
            narrow phone never opens a line with a dot. */}
        <CapsLine className="mt-3 max-[359px]:mt-2 sm:mt-0">{workshop.eyebrow}</CapsLine>
        <h1
          id="workshop-title"
          // Below 360px the poster step scales with the width (42px, as 50px
          // at 390), so the start button stays above the tab bar at 320x568.
          className="poster-title mt-3 max-w-[16ch] text-scene-ink max-[359px]:mt-2 max-[359px]:[--text-poster:2.625rem] sm:mt-4"
          style={posterTitleFallbackStyle(title.head)}
        >
          {/* Positioned, so a descender paints above the next line's band. */}
          <span className="relative">{heading.lead}</span>
          {heading.highlight ? (
            <>
              {" "}
              <HighlightedText
                colorVar={TITLE_HIGHLIGHT[scene.plakat].colorVar}
                opacity={TITLE_HIGHLIGHT[scene.plakat].opacity}
                className="title-mark"
              >
                {heading.highlight}
              </HighlightedText>
              {heading.tail ? ` ${heading.tail}` : null}
            </>
          ) : null}
          {title.subtitle ? (
            <>
              {/* The colon stays visible, so the text, the accessible name
                  and the search snippet all read as the full title. The
                  subtitle drops to the band's body size. */}
              :{" "}
              <span
                data-title-subtitle=""
                className="mt-3 block text-[1.0625rem] font-semibold leading-snug tracking-normal max-[359px]:mt-2"
              >
                {title.subtitle}
              </span>
            </>
          ) : null}
        </h1>
        <p className="mt-4 max-w-[40ch] text-body text-scene-ink text-pretty max-[359px]:mt-3 sm:mt-5 lg:max-w-[46ch]">
          {keepAmountsTogether(workshop.summary)}
        </p>
      </PlakatBand>

      <WorkshopStage workshop={workshop} locale={locale} plakat={scene.plakat} />

      {/* The one facts line. Everything else waits in "More details". */}
      <div className={CONTAINER}>
        <p
          data-workshop-facts=""
          className="pt-6 text-caption text-muted-foreground tabular-nums"
        >
          {coverFacts.map((fact, index) => (
            <span key={fact}>
              {index > 0 ? " · " : null}
              <span className="whitespace-nowrap">
                {index === 0 ? sentenceStart(fact) : fact}
              </span>
            </span>
          ))}
        </p>
      </div>

      <section
        aria-labelledby="workshop-details-heading"
        className={cx(CONTAINER, "pt-6 sm:pt-8")}
      >
        <details className="group/details border-t-2 border-scene-line pt-3 sm:pt-4">
          <summary className="flex min-h-11 cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1">
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="size-4 shrink-0 self-center transition-transform duration-[120ms] group-open/details:rotate-90"
            >
              <path d="M7 3l7 7-7 7" />
            </svg>
            <h2
              id="workshop-details-heading"
              className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3"
            >
              {copy.detailsHeading}
            </h2>
            <span className="text-caption text-muted-foreground">
              {copy.detailsSummary}
            </span>
          </summary>
          <div className="mt-6 grid gap-8 sm:gap-12 md:grid-cols-2 md:gap-12">
            {showMaterials ? (
              <section
                id={MATERIAL_ANCHOR}
                aria-labelledby="workshop-materials-heading"
                className="md:col-span-2"
              >
                <MinorHead id="workshop-materials-heading" title={copy.materialHeading} />
                <ul className="mt-3 sm:mt-6">
                  {coreMaterials.map((material) => (
                    <MaterialRow
                      key={material.href}
                      workshopSlug={workshop.slug}
                      material={material}
                      copy={copy}
                      locale={locale}
                      pagePath={kitPagePath(material)}
                    />
                  ))}
                </ul>
                {optionalMaterials.length > 0 ? (
                  <details className="group mt-4 sm:mt-6">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-caption font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                      {copy.moreMaterials(optionalMaterials.length)}
                    </summary>
                    <ul className="mt-2 border-t border-hairline">
                      {optionalMaterials.map((material) => (
                        <MaterialRow
                          key={material.href}
                          workshopSlug={workshop.slug}
                          material={material}
                          copy={copy}
                          locale={locale}
                          pagePath={kitPagePath(material)}
                        />
                      ))}
                    </ul>
                  </details>
                ) : null}
                {hasPresenter ? (
                  <p className="mt-4 max-w-[64ch] text-caption text-muted-foreground max-lg:hidden">
                    <span className="font-semibold text-foreground">
                      {copy.selfHostHeading}:
                    </span>{" "}
                    {copy.selfHostBody}
                  </p>
                ) : null}
              </section>
            ) : null}
            <section aria-labelledby="workshop-needs-heading">
              <MinorHead id="workshop-needs-heading" title={copy.needLabel} />
              <SquareList items={workshop.needs} className="mt-3 sm:mt-6" />
            </section>
            <section aria-labelledby="workshop-not-needed-heading">
              <MinorHead id="workshop-not-needed-heading" title={copy.notNeededHeading} />
              <ul className="mt-3 grid gap-1.5 text-[0.9375rem] leading-normal text-muted-foreground sm:mt-6">
                {workshop.notNeeded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Callout variant="boundary" className="mt-4 max-w-[64ch] sm:mt-6">
                {workshop.accessNote}
              </Callout>
            </section>
            <section aria-labelledby="workshop-audience-heading">
              <MinorHead id="workshop-audience-heading" title={copy.forWhom} />
              <SquareList items={workshop.audience} className="mt-3 sm:mt-6" />
              <p className="mt-3 max-w-[60ch] sm:mt-5 text-caption text-muted-foreground">
                {workshop.notForYou}
              </p>
            </section>
            <section aria-labelledby="workshop-not-covered-heading">
              <MinorHead id="workshop-not-covered-heading" title={copy.notCoveredHeading} />
              <ul className="mt-3 border-t border-hairline sm:mt-6">
                {workshop.notCovered.map((item) => (
                  <li
                    key={item}
                    className="border-b border-hairline py-2 text-[0.9375rem]/[1.5] text-foreground sm:py-3 sm:text-body"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section
              id={CASE_ANCHOR}
              aria-labelledby="workshop-case-heading"
              className="md:col-span-2"
            >
              <MinorHead id="workshop-case-heading" title={copy.caseHeading} />
              <div className="mt-3 sm:mt-6">
                <p className="text-[1.125rem]/[1.2] font-bold text-foreground">
                  {caseStudy.companyName}
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {[
                    caseStudy.isFictional ? copy.syntheticCase : copy.realCompanyData,
                    caseStudy.sector,
                    caseStudy.period,
                  ].join(" · ")}
                </p>
                <p className="mt-2 max-w-[64ch] text-[0.9375rem]/[1.55] text-foreground text-pretty sm:mt-3 sm:text-body">
                  {caseStudy.narrative}
                </p>
                {/* The one question of the workshop, with the Mennige bar. */}
                <div
                  data-case-question=""
                  className="mt-4 grid max-w-[64ch] grid-cols-[0.25rem_minmax(0,1fr)] gap-4 sm:mt-6"
                >
                  <span aria-hidden="true" className="bg-mennige" />
                  <p className="text-[1.0625rem]/[1.4] font-semibold text-foreground text-pretty sm:text-[1.25rem]/[1.35]">
                    {workshop.question}
                  </p>
                </div>
                {caseStudy.isFictional ? null : (
                  <p className="mt-3 max-w-[64ch] text-caption text-muted-foreground">
                    {copy.realExplanation(caseStudy.companyName, caseStudy.period)}
                  </p>
                )}
              </div>

              {caseStudy.resultChart ? (
                <ResultChart
                  plakat={scene.plakat}
                  className="mt-8 max-w-[56rem] sm:mt-10"
                  chart={{
                    heading: copy.resultChartHeading,
                    caption: copy.resultChartCaption(
                      caseStudy.resultChart.unit,
                      caseStudy.resultChart.basis,
                      caseStudy.isFictional,
                    ),
                    note: caseStudy.resultChart.note,
                    unit: caseStudy.resultChart.unit,
                    bars: caseStudy.resultChart.bars,
                  }}
                />
              ) : null}

              {realWorldCase ? (
                <div className="mt-8 border-t border-hairline pt-5 sm:mt-10 sm:pt-6">
                  <h4 className="text-[1.0625rem]/[1.2] font-bold text-foreground">
                    {copy.realWorldHeading}
                  </h4>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {realWorldCase.companyName}
                  </p>
                  <p className="mt-2 max-w-[64ch] text-[0.9375rem]/[1.55] text-foreground text-pretty sm:mt-3 sm:text-body">
                    {realWorldCase.narrative}
                  </p>
                  <StatRow
                    className="mt-5 gap-y-4 sm:mt-6 sm:gap-y-6 [&>div]:justify-between"
                    stats={realWorldCase.metrics.map((metric) => ({
                      label: metric.label,
                      value: <StatValue>{metric.value}</StatValue>,
                    }))}
                  />
                  <p className="mt-3 max-w-[80ch] sm:mt-4 text-caption text-muted-foreground">
                    {copy.source}:{" "}
                    <a
                      href={realWorldCase.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                    >
                      {realWorldCase.source}
                      <ArrowGlyph direction="external" className="size-3.5" />
                      <span className="sr-only">
                        {locale === "de"
                          ? " (öffnet neues Fenster)"
                          : " (opens in a new window)"}
                      </span>
                    </a>{" "}
                    · {copy.published}{" "}
                    <time dateTime={realWorldCase.sourcePublishedAt}>
                      {formatDate(realWorldCase.sourcePublishedAt, locale)}
                    </time>{" "}
                    · {copy.reviewed}{" "}
                    <time dateTime={realWorldCase.sourceReviewedAt}>
                      {formatDate(realWorldCase.sourceReviewedAt, locale)}
                    </time>
                    . {realWorldCase.sourceLimitation}
                  </p>
                </div>
              ) : null}
            </section>
            <section aria-labelledby="workshop-case-facts-heading" className="md:col-span-2">
              <MinorHead
                id="workshop-case-facts-heading"
                title={caseStudy.limitationsHeading ?? copy.limitations}
              />
              {/* justify-between keeps the values on one line when a label wraps. */}
              <StatRow
                className="mt-3 gap-y-4 sm:mt-6 sm:gap-y-6 [&>div]:justify-between"
                stats={caseStudy.metrics.map((metric) => ({
                  label: metric.label,
                  value: <StatValue>{metric.value}</StatValue>,
                }))}
              />
              <ul className="mt-4 grid gap-1.5 text-[0.875rem] leading-normal text-muted-foreground sm:mt-6 sm:gap-2 sm:text-[0.9375rem]">
                {caseStudy.dataLimitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
              <p className="mt-4 max-w-[64ch] text-caption text-muted-foreground sm:mt-6">
                {provenance.note}
              </p>
            </section>
          </div>
        </details>
      </section>

      <footer
        aria-label={copy.provenanceHeading}
        className={cx(CONTAINER, "pt-4 sm:pt-8")}
      >
        <p className="border-t border-hairline pt-5 text-caption text-muted-foreground tabular-nums">
          {provenanceFacts.join(" · ")}
        </p>
      </footer>
    </article>
  );
}

/**
 * Kopflinie head for the short two-column blocks (Für wen, Das brauchst du):
 * still an h2 in the outline, but set at h3 size so the page keeps a clear
 * step between the main sections and these lists.
 */
function MinorHead({
  id,
  title,
}: {
  readonly id: string;
  readonly title: ReactNode;
}) {
  return (
    <header className="border-t-2 border-scene-line pt-3 sm:pt-4">
      <h3
        id={id}
        className="text-[1.0625rem]/[1.2] font-bold text-foreground"
      >
        {title}
      </h3>
    </header>
  );
}

/** Stat values like "21,69 Mio. €" are long; step the size so they never overflow a column. */
function StatValue({ children }: { readonly children: ReactNode }) {
  return (
    <span className="block text-[1.375rem] leading-tight [overflow-wrap:anywhere] sm:text-[1.625rem] lg:text-num-lg">
      {children}
    </span>
  );
}

/** Left arrow for the back link, drawn like ArrowGlyph (square caps, miter joins). */
function BackGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-4 shrink-0"
    >
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}
