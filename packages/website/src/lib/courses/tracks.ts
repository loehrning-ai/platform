/**
 * Course-track taxonomy (CI v3.1). Kept separate from catalog.ts so the catalog
 * stays plain data (no React/icon imports leak into build scripts). The UI joins
 * a course slug to its facts to render the icon tile, accent and badge that
 * make the three course types legible at a glance.
 *
 * Three tracks, folded into `CourseFacts.accent`/`.badge` below (plan 007
 * stage 3 — the former standalone `TRACK_META` table is gone):
 *   zertifikat  — the 4 native German certified courses (Kupfer)
 *   github-lab  — the 6 English MIT technical courses, external (Sand)
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
//   1. ONE ordered starting path — "der Lernpfad" — the certified German
//      courses that share the progress + record engine.
//   2. A "Tiefer gehen" shelf — external GitHub labs (English) + applied
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
 * "certificate" (plan 007 stage 4) is the English-track record kind for the
 * imported courses. Pinned here, final: no course flips to it in this plan —
 * each imported course's own plan flips its single `COURSE_FACTS` entry once
 * it ships real native routes + certificate wiring.
 */
export type RecordKind = "zertifikat" | "lernnachweis" | "certificate" | "none";

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
  readonly language: "Deutsch" | "Englisch";
  readonly record: RecordKind;
  /** True when the course is hosted outside loehrning.ai (GitHub labs). */
  readonly external: boolean;
  /** Warm accent hue for the card/icon-tile pairing (plan 007 stage 3, folded in from the former TRACK_META). */
  readonly accent: CourseAccent;
  /** Short type badge shown on the card (plan 007 stage 3, folded in from the former TRACK_META). */
  readonly badge: string;
}

/**
 * The single source of truth joining every catalog slug to its group + honest
 * facts. The guard test asserts every catalog course appears here exactly once,
 * so adding a course without classifying it fails CI.
 */
export const COURSE_FACTS: Record<string, CourseFacts> = {
  // Spine — the 4 native, certified German courses (shown in step order).
  // group is independent of nativeStatus/catalog membership: a course can be
  // native (COURSE_CATALOG, nativeStatus "live") and still belong to the
  // "deeper" shelf, as every English-track ported course below does. Only
  // these 4 slugs are ever "spine" — do not add a course here just because
  // it joined COURSE_CATALOG.
  "ki-fuehrerschein": { group: "spine", iconName: "GraduationCap", language: "Deutsch", record: "zertifikat", external: false, accent: "kupfer", badge: "Zertifikat · Deutsch" },
  "ki-und-gesellschaft": { group: "spine", iconName: "Users", language: "Deutsch", record: "lernnachweis", external: false, accent: "kupfer", badge: "Zertifikat · Deutsch" },
  "eu-ai-act-kurs": { group: "spine", iconName: "Scale", language: "Deutsch", record: "zertifikat", external: false, accent: "kupfer", badge: "Zertifikat · Deutsch" },
  "ai-native": { group: "spine", iconName: "Bot", language: "Deutsch", record: "zertifikat", external: false, accent: "kupfer", badge: "Zertifikat · Deutsch" },

  // Deeper — the 6 ported/imported English-track courses. "claude" (plan
  // 008), "codex" (plan 009), "data-infrastructure" (plan 010), and
  // "data-engineering-fundamentals" (plan 011) flipped nativeStatus to
  // "live" (real routes, real progress, certificate), but stay in the
  // "deeper" shelf per the confirmed /discuss decision: only the 4 German
  // certified courses form the ordered spine. nativeStatus and group are
  // independent axes — joining COURSE_CATALOG does not mean joining the
  // spine.
  "claude": { group: "deeper", iconName: "Sparkles", language: "Englisch", record: "certificate", external: false, accent: "sand", badge: "Certificate · Englisch" },
  "codex": { group: "deeper", iconName: "TerminalSquare", language: "Englisch", record: "certificate", external: false, accent: "sand", badge: "Certificate · Englisch" },
  "data-engineering-fundamentals": { group: "deeper", iconName: "Database", language: "Englisch", record: "certificate", external: false, accent: "sand", badge: "Certificate · Englisch" },
  "data-science": { group: "deeper", iconName: "LineChart", language: "Englisch", record: "none", external: true, accent: "sand", badge: "GitHub · MIT · Englisch" },
  "data-infrastructure": { group: "deeper", iconName: "Server", language: "Englisch", record: "certificate", external: false, accent: "sand", badge: "Certificate · Englisch" },
  "ai-native-operator": { group: "deeper", iconName: "Workflow", language: "Englisch", record: "none", external: true, accent: "sand", badge: "GitHub · MIT · Englisch" },

  // Deeper — applied courses from real workshops (German).
  "geschaeftsberichte-mit-ki-lesen": { group: "deeper", iconName: "Presentation", language: "Deutsch", record: "none", external: false, accent: "amber", badge: "Workshop · Deutsch" },
  "ai-forecasting": { group: "deeper", iconName: "TrendingUp", language: "Deutsch", record: "none", external: false, accent: "amber", badge: "Workshop · Deutsch" },
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
  zertifikat: "mit Zertifikat",
  lernnachweis: "mit Lernnachweis",
  certificate: "mit Certificate",
};

/**
 * Honest badge chips for a course card: language, record kind (if any), and an
 * "extern" marker for GitHub-hosted labs. Returns [] for an unknown slug.
 */
export function courseBadges(slug: string): readonly CourseBadge[] {
  const facts = COURSE_FACTS[slug];
  if (!facts) return [];
  const badges: CourseBadge[] = [{ label: facts.language, tone: "language" }];
  if (facts.record !== "none") {
    badges.push({ label: RECORD_LABEL[facts.record], tone: "record" });
  }
  if (facts.external) {
    badges.push({ label: "extern · GitHub", tone: "external" });
  }
  return badges;
}

/** Section headers for the two-group /kurse + homepage layout. */
export const COURSE_SECTIONS: Readonly<
  Record<CourseGroup, { readonly title: string; readonly eyebrow: string; readonly blurb: string }>
> = {
  spine: {
    title: "Der Lernpfad",
    eyebrow: "Deutsch · Schritt für Schritt · mit Nachweis",
    blurb:
      "Vier aufeinander aufbauende Kurse auf Deutsch. Dein Fortschritt wird gespeichert, am Ende steht eine Teilnahmebestätigung. Fang oben an und arbeite dich vor.",
  },
  deeper: {
    title: "Tiefer gehen",
    eyebrow: "Praxis · Labs · extern",
    blurb:
      "Technische Open-Source-Labs auf Englisch und angewandte Kurse aus echten Workshops. Ohne Konto, direkt im Browser oder auf GitHub.",
  },
};
