import type { Locale } from "@/lib/i18n/locale";

/**
 * Course-track taxonomy (CI v3.1). Kept separate from catalog.ts so the catalog
 * stays plain data (no React/icon imports leak into build scripts). The UI joins
 * a course slug to its facts to render the icon tile, accent and badge that
 * make the three course types legible at a glance.
 *
 * Three tracks, folded into `CourseFacts.accent`/`.badge` below (
 * stage 3 — the former standalone `TRACK_META` table is gone):
 *   lernpfad    — the 4 ordered foundation courses with a self-issued record (Kupfer)
 *   github-lab  — the 6 source-pinned MIT technical courses (Sand)
 *   brainster   — applied client workshops turned courses (Amber)
 */

/** Applied ("Brainster") course track. Business reports is live; forecasting is in preparation. */
export interface BrainsterCourse {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly href: string;
  readonly duration: string;
  readonly language: "Deutsch" | "Englisch";
  readonly audience: string;
  readonly status: "live" | "prep";
  readonly iconName: string;
}

export const BRAINSTER_COURSE_CATALOG: readonly BrainsterCourse[] = [
  {
    slug: "geschaeftsberichte-mit-ki-lesen",
    title: "Geschäftsberichte mit KI lesen",
    tagline: "Baue live einen KI-Analysten für monatliche Geschäftsberichte.",
    description:
      "Du baust in der Claude-App Schritt für Schritt einen Analysten, der Monatsberichte einliest, Kennzahlen exakt berechnet und Auffälligkeiten erklärt. Mit Übungs-Kit zum Nachbauen.",
    href: "/workshops/geschaeftsberichte-mit-ki-lesen",
    duration: "ca. 75 Min.",
    language: "Deutsch",
    audience: "Controlling, Finance, Reporting",
    status: "live",
    iconName: "Presentation",
  },
  {
    slug: "ai-forecasting",
    title: "AI-Forecasting",
    tagline: "Nachfrage und Kennzahlen mit KI vorhersagen und prüfen.",
    description:
      "Von der Datenaufbereitung bis zur belastbaren Prognose: Wie KI bei Forecasting hilft, wo ihre Grenzen liegen und wie du Ergebnisse kritisch prüfst.",
    href: "/kurse",
    duration: "in Vorbereitung",
    language: "Deutsch",
    audience: "Planung, Supply Chain, Analytik",
    status: "prep",
    iconName: "TrendingUp",
  },
];

// ─── Learner-first course model (CI v3.2) ─────────────────────────────────
//
// This is the model the redesigned surfaces (homepage, /kurse) consume. It
// replaces the three colour "tracks" above with what a person actually needs
// to see:
//   1. ONE ordered starting path — "der Lernpfad" — the foundation
//      courses that share the progress + record engine.
//   2. A "Tiefer gehen" shelf — source-pinned GitHub courses + applied
//      workshop courses.
// Instead of a colour code, each course carries honest badges derived from
// real facts: its language, whether it issues a record (and which kind), and
// whether it is hosted externally.

/** The two learner-facing groups. */
export type CourseGroup = "spine" | "deeper";

/** Warm accent hue keyed to a course's track (kupfer/sand/amber, CI v3.1). */
export type CourseAccent = "kupfer" | "sand" | "amber";

/**
 * What kind of record a course issues, if any. Source of truth for the native
 * courses is `lib/course/config.ts` (`certificateTitle`); the guard test in
 * `tracks.test.ts` fails loudly if this drifts from it.
 *
 * "certificate" is the English-locale record kind for the
 * imported courses. Pinned here, final: no course flips to it in this plan —
 * each imported course's own plan flips its single `COURSE_FACTS` entry once
 * it ships real native routes + certificate wiring.
 */
export type RecordKind =
  "teilnahmebestaetigung" | "lernnachweis" | "certificate" | "none";

/** Semantic tone of a badge chip; the UI maps each tone to a warm colour. */
export type BadgeTone = "record" | "language" | "external";

/** A single honest badge chip on a course card. */
export interface CourseBadge {
  readonly label: string;
  readonly tone: BadgeTone;
}

/** Per-course honest facts, keyed by slug across ALL three catalogs. */
export interface CourseFacts {
  readonly group: CourseGroup;
  /** lucide-react export name; resolved to a component in the UI layer. */
  readonly iconName: string;
  /** Original editorial/source language. This is provenance, not availability. */
  readonly language: "Deutsch" | "Englisch";
  /** Reviewed interface and reader languages currently available on loehrning.ai. */
  readonly availableLanguages: readonly Locale[];
  readonly record: RecordKind;
  /** True when the course is hosted outside loehrning.ai (GitHub labs). */
  readonly external: boolean;
  /** Warm accent hue for the card/icon-tile pairing. */
  readonly accent: CourseAccent;
  /** Short type badge shown on the card. */
  readonly badge: string;
}

/**
 * The single source of truth joining every catalog slug to its group + honest
 * facts. The guard test asserts every catalog course appears here exactly once,
 * so adding a course without classifying it fails CI.
 */
export const COURSE_FACTS: Record<string, CourseFacts> = {
  // Spine — the 4 ordered foundation courses with a self-issued record.
  // group is independent of nativeStatus/catalog membership: a course can be
  // native (COURSE_CATALOG, nativeStatus "live") and still belong to the
  // "deeper" shelf, as every ported technical course below does. Only
  // these 4 slugs are ever "spine" — do not add a course here just because
  // it joined COURSE_CATALOG.
  "ki-fuehrerschein": {
    group: "spine",
    iconName: "GraduationCap",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "kupfer",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "ki-und-gesellschaft": {
    group: "spine",
    iconName: "Users",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "lernnachweis",
    external: false,
    accent: "kupfer",
    badge: "Lernnachweis · DE + EN",
  },
  "eu-ai-act-kurs": {
    group: "spine",
    iconName: "Scale",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "kupfer",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "ai-native": {
    group: "spine",
    iconName: "Bot",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "kupfer",
    badge: "Teilnahmebestätigung · DE + EN",
  },

  // Deeper — six ported/imported technical courses. All expose reviewed
  // German content on the unprefixed route and English content under /en.
  // "claude" (plan
  // 008), "codex", "data-infrastructure",
  // "data-engineering-fundamentals", "data-science",
  // and "ai-native-operator" all flipped nativeStatus to "live"
  // (real routes, real progress, certificate), but stay in the "deeper"
  // shelf per the confirmed /discuss decision: only the 4 ordered foundation
  // courses form the ordered spine. nativeStatus and group are independent
  // axes — joining COURSE_CATALOG does not mean joining the spine. Every
  // one of the 6 ported courses is "deeper" — never "spine" — this is the
  // single most important invariant in this migration (
  // post-implementation correction note has the full story of the one
  // time this was gotten wrong).
  claude: {
    group: "deeper",
    iconName: "Sparkles",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  codex: {
    group: "deeper",
    iconName: "TerminalSquare",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "data-engineering-fundamentals": {
    group: "deeper",
    iconName: "Database",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "data-science": {
    group: "deeper",
    iconName: "LineChart",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "data-infrastructure": {
    group: "deeper",
    iconName: "Server",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },
  "ai-native-operator": {
    group: "deeper",
    iconName: "Workflow",
    language: "Englisch",
    availableLanguages: ["de", "en"],
    record: "teilnahmebestaetigung",
    external: false,
    accent: "sand",
    badge: "Teilnahmebestätigung · DE + EN",
  },

  // Deeper — applied courses from real workshops (German).
  "geschaeftsberichte-mit-ki-lesen": {
    group: "deeper",
    iconName: "Presentation",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "none",
    external: false,
    accent: "amber",
    badge: "Workshop · DE + EN",
  },
  "ai-forecasting": {
    group: "deeper",
    iconName: "TrendingUp",
    language: "Deutsch",
    availableLanguages: ["de", "en"],
    record: "none",
    external: false,
    accent: "amber",
    badge: "Workshop · DE + EN",
  },
};

/** Facts for a slug, or undefined if it is not a known course. */
export function courseFactsFor(slug: string): CourseFacts | undefined {
  return COURSE_FACTS[slug];
}

/**
 * Facts for a slug, throwing if unknown. For call sites over a slug already
 * guaranteed to be classified (the native catalog, the KI-Check dimension
 * map) — mirrors `lib/course/config.ts`'s `config()` throw convention.
 */
export function courseFacts(slug: string): CourseFacts {
  const facts = COURSE_FACTS[slug];
  if (!facts) {
    throw new Error(`Course "${slug}" has no entry in COURSE_FACTS.`);
  }
  return facts;
}

/** Which group a course belongs to, or undefined for an unknown slug. */
export function courseGroupFor(slug: string): CourseGroup | undefined {
  return COURSE_FACTS[slug]?.group;
}

/** lucide icon name for a slug, falling back to a neutral book icon. */
export function courseIconName(slug: string): string {
  return COURSE_FACTS[slug]?.iconName ?? "BookOpen";
}

export const RECORD_LABEL: Record<Exclude<RecordKind, "none">, string> = {
  teilnahmebestaetigung: "mit Teilnahmebestätigung",
  lernnachweis: "mit Lernnachweis",
  certificate: "mit Certificate",
};

const RECORD_LABEL_EN: typeof RECORD_LABEL = {
  teilnahmebestaetigung: "participation record",
  lernnachweis: "learning record",
  certificate: "completion certificate",
};

const ENGLISH_FACT_OVERRIDES: Readonly<
  Partial<Record<string, Pick<CourseFacts, "record" | "badge">>>
> = {
  claude: {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
  codex: {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
  "data-engineering-fundamentals": {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
  "data-science": {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
  "data-infrastructure": {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
  "ai-native-operator": {
    record: "certificate",
    badge: "Certificate · DE + EN",
  },
};

/**
 * Honest badge chips for a course card: available languages, record kind (if any), and an
 * "extern" marker for GitHub-hosted labs. Returns [] for an unknown slug.
 */
export function courseBadges(
  slug: string,
  locale: Locale = "de",
): readonly CourseBadge[] {
  const baseFacts = COURSE_FACTS[slug];
  if (!baseFacts) return [];
  const facts =
    locale === "en" && ENGLISH_FACT_OVERRIDES[slug]
      ? { ...baseFacts, ...ENGLISH_FACT_OVERRIDES[slug] }
      : baseFacts;
  const badges: CourseBadge[] = [
    {
      label:
        facts.availableLanguages.length === 2
          ? "DE + EN"
          : facts.availableLanguages[0] === "en"
            ? "English"
            : "Deutsch",
      tone: "language",
    },
  ];
  if (facts.record !== "none") {
    badges.push({
      label:
        locale === "en"
          ? RECORD_LABEL_EN[facts.record]
          : RECORD_LABEL[facts.record],
      tone: "record",
    });
  }
  if (facts.external) {
    badges.push({
      label: locale === "en" ? "external · GitHub" : "extern · GitHub",
      tone: "external",
    });
  }
  return badges;
}

/** Section headers for the two-group /kurse + homepage layout. */
export const COURSE_SECTIONS: Readonly<
  Record<
    CourseGroup,
    { readonly title: string; readonly eyebrow: string; readonly blurb: string }
  >
> = {
  spine: {
    title: "Grundlagenpfad",
    eyebrow: "4 Kurse · DE + EN · fester Ablauf",
    blurb:
      "Vier Kurse bauen in fester Reihenfolge aufeinander auf. Alle Inhalte sind auf Deutsch und Englisch verfügbar. Fortschritt, Umfang und Abschlussbedingung werden je Kurs ausgewiesen. Teilnahmebestätigungen und Lernnachweise werden von loehrning.ai selbst ausgestellt.",
  },
  deeper: {
    title: "Technikkurse",
    eyebrow: "6 Kurse · DE + EN · offener Quellstand",
    blurb:
      "Sechs Kurse behandeln Prompting, Coding Agents, Datenarbeit und technische Betriebsmodelle. Alle Inhalte sind auf Deutsch und Englisch verfügbar. Umfang, Voraussetzungen, Lizenz und übernommener Quellstand bleiben sichtbar. Das Abschlussdokument wird von loehrning.ai selbst ausgestellt.",
  },
};

const COURSE_SECTIONS_EN: typeof COURSE_SECTIONS = {
  spine: {
    title: "Foundation path",
    eyebrow: "4 courses · DE + EN · fixed sequence",
    blurb:
      "Four courses build on one another in a fixed sequence. Every course is available in English and German. Each course states its progress model, scope, and completion conditions. Participation and learning records are issued by loehrning.ai.",
  },
  deeper: {
    title: "Technical courses",
    eyebrow: "6 courses · DE + EN · traceable source revision",
    blurb:
      "Six courses cover prompting, coding agents, data work, and technical operating models. Every course is available in English and German. Each course states its scope, prerequisites, licence, and imported source revision. Completion documents are issued by loehrning.ai.",
  },
};

export function courseSections(locale: Locale): typeof COURSE_SECTIONS {
  return locale === "en" ? COURSE_SECTIONS_EN : COURSE_SECTIONS;
}
