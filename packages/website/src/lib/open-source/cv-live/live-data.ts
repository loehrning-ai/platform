// The attribute lets Playwright's Node loader read it too (the e2e spec imports this).
import raw from "./live-data.json" with { type: "json" };
import {
  CV_LIVE_DENSITIES,
  CV_LIVE_LANGUAGES,
  CV_LIVE_TEMPLATES,
  cvLiveStateKey,
  type CvLiveChoice,
  type CvLiveDensity,
  type CvLiveTemplate,
} from "./compose";
import type { CvLiveLanguage } from "./stations";

export interface CvLiveFile {
  readonly href: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface CvLiveFont extends CvLiveFile {
  readonly family: string;
  readonly weight: number;
  readonly style: string;
}

/** One real `engine/build.py` run, written by scripts/build-cv-engine-live.ts. */
export interface CvLiveState extends CvLiveChoice {
  readonly key: string;
  readonly exitCode: 0 | 1;
  readonly pages: number;
  /**
   * What the engine's overflow gate compares, in CSS px: WeasyPrint's deepest
   * box on an unclipped sheet (for sidebar, its full-height rail).
   */
  readonly naturalPx: number;
  /** Where the text ends: the bottom of `<main>` on the same sheet. */
  readonly mainPx: number;
  /** Which gate stopped the build: none, the page count, or the clip probe. */
  readonly gate: "fits" | "pages" | "clipped";
  /** First heading on page 2, as the CLI printed it; null when it named none. */
  readonly overflowSection: string | null;
  readonly body: string;
  readonly yamlSha256: string;
  readonly pdf: CvLiveFile | null;
}

export interface CvLiveData {
  readonly generatedBy: string;
  readonly renderedWith: string;
  readonly pagePx: number;
  readonly slackPx: number;
  readonly base: Record<CvLiveLanguage, string>;
  readonly css: CvLiveFile;
  readonly fonts: readonly CvLiveFont[];
  readonly bodies: Record<string, CvLiveFile>;
  readonly states: readonly CvLiveState[];
}

export const CV_LIVE_DATA = raw as CvLiveData;

const STATES = new Map(CV_LIVE_DATA.states.map((state) => [state.key, state]));

export function cvLiveState(choice: CvLiveChoice): CvLiveState {
  const state = STATES.get(cvLiveStateKey(choice));
  if (!state) throw new Error(`No rendered state for ${cvLiveStateKey(choice)}`);
  return state;
}

export const CV_LIVE_MAX_STATIONS = Math.max(
  ...CV_LIVE_DATA.states.map((state) => state.stations),
);

/** The page opens on Mira's real file: classic, normal, no extra stations. */
export function cvLiveDefaultChoice(lang: CvLiveLanguage): CvLiveChoice {
  return { lang, template: "classic", density: "normal", stations: 0 };
}

const isOneOf = <T extends string>(list: readonly T[], value: string | null): value is T =>
  value !== null && (list as readonly string[]).includes(value);

/**
 * A deep link such as `?vorlage=sidebar&dichte=tight&sprache=en&stationen=4`.
 * Unknown or missing values fall back to the default, never to an error.
 */
export function cvLiveChoiceFromSearch(
  search: string,
  fallback: CvLiveChoice,
): CvLiveChoice {
  const params = new URLSearchParams(search);
  const template = params.get("vorlage");
  const density = params.get("dichte");
  const lang = params.get("sprache");
  const stations = Number(params.get("stationen"));
  return {
    lang: isOneOf<CvLiveLanguage>(CV_LIVE_LANGUAGES, lang) ? lang : fallback.lang,
    template: isOneOf<CvLiveTemplate>(CV_LIVE_TEMPLATES, template) ? template : fallback.template,
    density: isOneOf<CvLiveDensity>(CV_LIVE_DENSITIES, density) ? density : fallback.density,
    stations:
      Number.isInteger(stations) && stations >= 0 && stations <= CV_LIVE_MAX_STATIONS
        ? stations
        : fallback.stations,
  };
}

/** The wrapper the engine put around every body (the script asserts it). */
export function cvLiveWrapper(choice: Pick<CvLiveChoice, "template" | "density">) {
  return {
    bodyClass: `template-${choice.template} paper-white`,
    mainAttributes: {
      class: `page density-${choice.density}`,
      "data-template": choice.template,
      "data-renderer": choice.template === "sidebar" ? "rail" : "standard",
      "data-paper": "white",
    },
  } as const;
}

/** `@font-face` rules for the document; Chromium ignores them in a shadow root. */
export function cvLiveFontFaceCss(): string {
  return CV_LIVE_DATA.fonts
    .map(
      (font) =>
        `@font-face{font-family:"${font.family}";src:url("${font.href}") format("woff2");font-weight:${font.weight};font-style:${font.style};font-display:block}`,
    )
    .join("\n");
}
