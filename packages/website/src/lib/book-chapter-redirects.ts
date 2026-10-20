/**
 * Chapter slugs that a link may still point at, and where they live now.
 *
 * "Von außen gesehen" changed its chapter list twice: the edition on main used
 * ten chapters (01_eisberg ... 10_anhang), the first rewrite (PR #142) used
 * eight (01_eisberg ... 08_methodik), and the insight spine of 2026-10-19 uses
 * eight chapters plus a source page. A link written against any of them must
 * keep working, so each old slug maps to the chapter that now holds its
 * subject. The map is plain data on purpose: next.config.ts loads this file
 * with Node's type stripping (no path aliases, no imports).
 *
 * A redirect is emitted only when it is safe: the old slug must be gone from
 * the manifest of that locale and its target must exist there. Until the new
 * chapters land, nothing redirects and the old pages keep serving; afterwards
 * the old URLs answer 308. The rule lives in `legacyChapterRedirects`, so the
 * config and the test cannot disagree.
 */

export const BOOK_ID = "ki-landschaft";

/** Old chapter slug to the slug of the insight spine that now answers the same question. */
export const LEGACY_CHAPTER_TARGETS: Readonly<Record<string, string>> = {
  // Edition on main (ten chapters)
  "01_eisberg": "01_zweimal_gemessen",
  "02_methodik": "09_quellen",
  "03_reifegrad_ueberblick": "03_schaufenster",
  "04_bundesland": "05_land",
  "05_branchen": "03_schaufenster",
  "06_eu_ki_verordnung": "08_dein_zug",
  "07_schnellstart": "08_dein_zug",
  "08_fahrplan": "08_dein_zug",
  "09_ausblick": "08_dein_zug",
  "10_anhang": "09_quellen",
  // First rewrite (PR #142, eight chapters; 01_eisberg and 06_eu_ki_verordnung are listed above)
  "02_sagen_zeigen": "03_schaufenster",
  "03_zweimal_gemessen": "01_zweimal_gemessen",
  "04_branche_land": "05_land",
  "05_reden_einstellen": "04_stellen_namen",
  "07_pilot": "08_dein_zug",
  "08_methodik": "09_quellen",
};

export interface ChapterRedirect {
  readonly source: string;
  readonly destination: string;
  readonly permanent: true;
}

/**
 * Redirects for one locale. `manifestSlugs` is the chapter list of that
 * locale's manifest. Returns nothing for a slug that is still a chapter, or
 * whose target is not a chapter yet.
 */
export function legacyChapterRedirects(manifestSlugs: readonly string[], localePrefix: "" | "/en"): ChapterRedirect[] {
  const present = new Set(manifestSlugs);
  const out: ChapterRedirect[] = [];
  for (const [from, to] of Object.entries(LEGACY_CHAPTER_TARGETS)) {
    if (present.has(from) || !present.has(to)) continue;
    out.push({
      source: `${localePrefix}/buecher/${BOOK_ID}/${from}`,
      destination: `${localePrefix}/buecher/${BOOK_ID}/${to}`,
      permanent: true,
    });
  }
  return out;
}
