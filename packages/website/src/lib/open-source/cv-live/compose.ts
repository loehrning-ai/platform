import { CV_LIVE_STATIONS, type CvLiveLanguage } from "./stations";

export const CV_LIVE_TEMPLATES = [
  "classic",
  "sidebar",
  "executive",
  "ats-compact",
] as const;
export type CvLiveTemplate = (typeof CV_LIVE_TEMPLATES)[number];

export const CV_LIVE_DENSITIES = ["tight", "normal", "airy"] as const;
export type CvLiveDensity = (typeof CV_LIVE_DENSITIES)[number];

export const CV_LIVE_LANGUAGES = ["de", "en"] as const satisfies readonly CvLiveLanguage[];

export interface CvLiveChoice {
  readonly lang: CvLiveLanguage;
  readonly template: CvLiveTemplate;
  readonly density: CvLiveDensity;
  /** How many of CV_LIVE_STATIONS[lang] are appended, from the first. */
  readonly stations: number;
}

function replaceLineOnce(text: string, line: string, next: string): string {
  const needle = `\n${line}\n`;
  const at = text.indexOf(needle);
  if (at < 0 || text.indexOf(needle, at + 1) >= 0) {
    throw new Error(`cv.yaml must contain the line "${line}" exactly once`);
  }
  return `${text.slice(0, at)}\n${next}\n${text.slice(at + needle.length)}`;
}

/**
 * Drops a `- network: github` contact and its indented lines. The persona at
 * the pin names a GitHub handle nobody has registered; a link from this site
 * to it would point at whoever claims the name first. No-op once the
 * persona upstream no longer carries one.
 */
function withoutGithubContact(text: string): string {
  const lines = text.split("\n");
  const at = lines.indexOf("  - network: github");
  if (at < 0) return text;
  let end = at + 1;
  while (end < lines.length && lines[end].startsWith("    ")) end++;
  return [...lines.slice(0, at), ...lines.slice(end)].join("\n");
}

/**
 * The exact cv.yaml the engine rendered for one choice: the persona file at
 * the pin without its GitHub contact, with its `template:` and `density:`
 * lines set and the first `stations` earlier jobs appended to `experience:`.
 * Pure text edits, so the pre-render script and the download button produce
 * identical bytes.
 */
export function composeCvYaml(base: string, choice: CvLiveChoice): string {
  const blocks = CV_LIVE_STATIONS[choice.lang];
  if (
    !Number.isInteger(choice.stations) ||
    choice.stations < 0 ||
    choice.stations > blocks.length
  ) {
    throw new Error(`stations must be 0..${blocks.length}`);
  }
  let text = replaceLineOnce(withoutGithubContact(base), "template: classic", `template: ${choice.template}`);
  text = replaceLineOnce(text, "density: normal", `density: ${choice.density}`);
  const marker = "\neducation:\n";
  const at = text.indexOf(marker);
  if (at < 0 || text.indexOf(marker, at + 1) >= 0) {
    throw new Error('cv.yaml must contain "education:" exactly once');
  }
  const inserted = blocks.slice(0, choice.stations).join("");
  return `${text.slice(0, at + 1)}${inserted}${text.slice(at + 1)}`;
}

/** Stable id of one rendered state, also its file stem. */
export function cvLiveStateKey(choice: CvLiveChoice): string {
  return `${choice.lang}-${choice.template}-${choice.density}-${choice.stations}`;
}
