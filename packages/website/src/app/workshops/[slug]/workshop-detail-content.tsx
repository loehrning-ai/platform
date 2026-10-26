import Link from "next/link";
import type { ReactNode } from "react";
import type { Workshop } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { ArrowGlyph, cx } from "@/components/werk";
import { CapsLine, PlakatBand, PosterArt } from "@/components/plakat";
import { StageExplainer } from "@/components/workshops/stage-explainer";
import { WorkshopStage } from "@/components/workshops/workshop-stage";
import { WorkshopObjective } from "@/components/workshops/workshop-objective";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import {
  workshopPlakat,
  type PlakatKey,
  type WorkshopPlakat,
} from "@/lib/plakat/palettes";
import { WORKSHOP_PAGE_COPY } from "../workshop-copy";
import { splitTitle } from "../workshop-title";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

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
 * - idea: Himbeere at 85% over Kreide (3.04 on the ground), Druckschwarz
 *   (`--color-lab-ink`) on it 5.13: a pale wash behind Kobalt vanished (1.54
 *   on the ground), and light words on a dark band end on Kreide wherever a
 *   line's box is taller than its band (Bogen on Kreide is 1.17).
 * - bloom: Terrakotta at 80% over Sand, Aubergine on it 5.03.
 * - autumn: Ocker at full strength (2.78 on Rost), Druckschwarz (`--color-lab-ink`, a fixed value the scene never overrides) on it 9.0: a
 *   30% wash was 1.40 on the ground and read as brown on brown. Rost leaves no
 *   room for a lighter wash behind Creme, so the band turns the pair round.
 * - sage: Bernstein at 100% over Salbei (1.75 against the ground, a visible
 *   band), Tanne on it 4.46.
 * - kraft: Mennige at 100% over Kraft (2.93 against the ground, a visible
 *   band), Papier (`--color-paper`) on it 5.65: Druckschwarz on Mennige is 3.24.
 */
export const TITLE_HIGHLIGHT: Readonly<
  Record<
    PlakatKey,
    {
      readonly colorVar: `--color-${string}`;
      readonly opacity: number;
      /** The words on the band; the scene ink when left out. */
      readonly textColorVar?: `--color-${string}`;
    }
  >
> = {
  lemons: { colorVar: "--color-scene-mid", opacity: 100 },
  idea: { colorVar: "--color-scene-mid", opacity: 85, textColorVar: "--color-lab-ink" },
  bloom: { colorVar: "--color-scene-mid", opacity: 80 },
  autumn: { colorVar: "--color-scene-mid", opacity: 100, textColorVar: "--color-lab-ink" },
  sage: { colorVar: "--color-scene-mid", opacity: 100 },
  kraft: { colorVar: "--color-scene-mid", opacity: 100, textColorVar: "--color-paper" },
};

/** Longest two-word tail that still reads as a short marked phrase. */
const HIGHLIGHT_PAIR_MAX = 12;

/**
 * A workshop whose H1 marks one chosen word instead of its tail, per locale;
 * the words after it follow the band unmarked. No workshop needs one today.
 */
const HEADLINE_MARK: Readonly<
  Record<string, Readonly<Partial<Record<Locale, string>>>>
> = {};

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

/** A band lede longer than this, with a second sentence, shows only its first sentence. */
const BAND_LEDE_MAX = 110;

/**
 * The band's one lede. A summary of one short sentence is shown whole; a
 * longer one with a second sentence is cut after the first, so the band
 * stays two or three lines on a phone and the actions stay on the first
 * screen. The full summary stays in the registry, the hub row and the meta
 * description.
 */
export function bandLede(summary: string): string {
  if (summary.length <= BAND_LEDE_MAX) return summary;
  const first = summary.split(/(?<=[.!?])\s+(?=\p{Lu})/u)[0] ?? summary;
  return first.length >= 40 ? first : summary;
}

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].detail;
  const { caseStudy, realWorldCase, provenance } = workshop;

  // The "all in English" note is derived from the data, so it disappears as
  // soon as one material is published in another language.
  // The practice demo is a page in the reader's language, not a material
  // file, so it never decides this note.
  const allMaterialsEnglish = workshop.materials
    .filter((material) => material.role !== "demo")
    .every((material) => material.language === "en");
  const title = splitTitle(workshop.title);
  const heading = titleHighlight(title.head, HEADLINE_MARK[workshop.slug]?.[locale]);
  const scene = workshopPlakat(workshop.slug) ?? FALLBACK_SCENE;

  // The slim provenance line is the one place for the honest notes: who and
  // when, that the case data is invented (or the real source with publisher
  // and dates), the workshop's own note, and the English-materials hint.
  const noteSaysInvented = /erfunden|invented/i.test(provenance.note);
  const provenanceFacts: (ReactNode | null)[] = [
    provenance.author,
    `${copy.provenanceLabels.reviewedAt} ${formatDate(provenance.reviewedAt, locale)}`,
    provenance.aiOutputsRecordedAt
      ? `${copy.provenanceLabels.aiOutputsRecordedAt} ${formatDate(provenance.aiOutputsRecordedAt, locale)}`
      : null,
    caseStudy.isFictional
      ? noteSaysInvented
        ? null
        : copy.inventedNote
      : copy.realCompanyData,
    provenance.note,
    realWorldCase ? (
      <span key="source">
        {copy.source}:{" "}
        <a
          href={realWorldCase.sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="anti-link inline-flex min-h-11 items-center gap-1 font-semibold text-foreground"
        >
          {realWorldCase.source}
          <ArrowGlyph direction="external" className="size-3.5" />
          <span className="sr-only">
            {locale === "de" ? " (öffnet neues Fenster)" : " (opens in a new window)"}
          </span>
        </a>
        , {copy.published}{" "}
        <time dateTime={realWorldCase.sourcePublishedAt}>
          {formatDate(realWorldCase.sourcePublishedAt, locale)}
        </time>
      </span>
    ) : null,
    allMaterialsEnglish && locale === "de" ? copy.coverFacts.materialsInEnglish : null,
  ].filter((fact) => Boolean(fact));

  return (
    <article
      data-plakat-page={scene.plakat}
      className="bg-background pb-10 sm:pb-16"
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
            className="inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-mennige hover:decoration-2 active:decoration-mennige active:decoration-2 focus-visible:outline-offset-[-3px]"
          >
            <BackGlyph />
            {copy.allWorkshops}
          </Link>
        </div>
      </nav>

      <PlakatBand
        plakat={scene.plakat}
        labelledBy="workshop-title"
        // Below lg the poster is a strip after the lede: the numeral flush
        // left on the text column's edge, the motif's window against the
        // bottom-right corner, bleeding off the band's right and bottom
        // edges. 96px on a phone, 112px from sm, so the cards and the top of
        // the scene share the first phone screen. From lg the poster is the
        // right art column and the band is at least 19rem high, so the stage
        // starts at the same y on every workshop.
        artPhoneLayout="strip"
        className="[&>[data-plakat-art-phone]]:mt-4 max-sm:[&>[data-plakat-art-phone]]:mt-1.5 max-sm:[&>[data-plakat-art-phone]]:h-[4.75rem] sm:[&>[data-plakat-art-phone]]:h-28 lg:min-h-[19rem]"
        // The IDEA poster's registration dots belong to the hub and the demos
        // band; on a workshop page they read as stray marks beside the back
        // link, so no workshop band carries them and every band starts at the
        // same 8px on a phone.
        cornerDots={false}
        contentClassName="max-sm:pt-2 lg:py-8"
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
            format="strip"
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
          className="-my-2.5 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-scene-ink underline decoration-transparent decoration-2 underline-offset-4 [-webkit-tap-highlight-color:transparent] active:decoration-[var(--color-scene-anti-a)] sm:hidden"
        >
          <BackGlyph />
          {copy.allWorkshops}
        </Link>
        {/* CapsLine keeps each " · " part whole with its separator, so a
            narrow phone never opens a line with a dot. */}
        {/* From 340px the eyebrow stays one line: 12px and +0.1em below 380px. */}
        <CapsLine className="mt-2 max-[379px]:text-[0.75rem]! max-[379px]:tracking-[0.1em]! sm:mt-0">
          {workshop.eyebrow}
        </CapsLine>
        <h1
          id="workshop-title"
          // Below 360px the poster step scales with the width (42px, as 50px
          // at 390), so the start button stays above the tab bar at 320x568.
          className="poster-title mt-2 max-w-[16ch] text-scene-ink min-[380px]:max-sm:[--text-poster:2.5rem] max-[379px]:[--text-poster:min(2.5rem,10vw)] sm:mt-4 sm:max-w-[24ch] sm:[--text-poster:3.5rem] lg:max-w-none lg:[--text-poster:4.5rem]"
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
                {...(TITLE_HIGHLIGHT[scene.plakat].textColorVar
                  ? { textColorVar: TITLE_HIGHLIGHT[scene.plakat].textColorVar }
                  : {})}
                // The band keeps its padding on the first and the last line
                // only (slice), inside the text column: it never hangs out
                // past the left edge or the screen edge, and a gap of the
                // padding plus one space separates it from the word before.
                className="title-mark box-decoration-slice px-[0.12em]"
              >
                {heading.highlight}
                {/* The colon belongs to the marked words, so it never sits
                    alone on paper after the band. */}
                {title.subtitle && !heading.tail ? ":" : null}
              </HighlightedText>
              {heading.tail ? ` ${heading.tail}` : null}
            </>
          ) : null}
          {title.subtitle ? (
            <>
              {/* The colon stays visible (inside the band when the band
                  ends the head), so the text, the accessible name and the
                  search snippet all read as the full title. The subtitle
                  drops to the band's body size. */}
              {heading.highlight && !heading.tail ? " " : ": "}
              <span
                data-title-subtitle=""
                className="mt-3 block text-[1.0625rem] font-semibold leading-snug tracking-normal max-[359px]:mt-2"
              >
                {title.subtitle}
              </span>
            </>
          ) : null}
        </h1>
        <p className="mt-2.5 max-w-[40ch] text-body text-scene-ink text-balance max-sm:leading-[1.4] sm:mt-4 lg:mt-5 lg:max-w-[52ch] lg:text-[1.1875rem]">
          {keepAmountsTogether(bandLede(workshop.lede ?? workshop.summary))}
        </p>
      </PlakatBand>

      <WorkshopStage workshop={workshop} locale={locale} plakat={scene.plakat} />

      <StageExplainer workshop={workshop} />

      {/* Lernziel: the sentence the workshop teaches and its three-line card. */}
      <WorkshopObjective slug={workshop.slug} locale={locale} />

      {/* The slim provenance line: who, when, what kind of data, and the one
          real source where there is one. Pad for the phone tab bar. */}
      <footer
        aria-label={copy.provenanceHeading}
        data-workshop-provenance=""
        className={cx(CONTAINER, "pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-8")}
      >
        <div className="border-t border-hairline pt-4">
          <FactList
            className="text-[0.9375rem]/[1.5] text-foreground"
            items={provenanceFacts}
          />
        </div>
      </footer>
    </article>
  );
}

/**
 * Facts as separate items that wrap as whole units, each behind a small
 * square (the page's one bullet), so no line ever starts or ends with a
 * stranded dot and a fact never breaks in the middle on a phone. The list
 * semantics tell a screen reader how many facts there are.
 */
function FactList({
  items,
  className,
  ...rest
}: {
  readonly items: readonly ReactNode[];
  readonly className?: string;
  readonly "data-workshop-facts"?: string;
}) {
  return (
    <ul
      {...rest}
      className={cx(
        "flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 tabular-nums",
        className,
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="inline-flex items-baseline gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 -translate-y-px bg-foreground/70"
          />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
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
