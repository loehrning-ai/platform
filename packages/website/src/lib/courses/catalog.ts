// ─── Unified course catalog (shared course architecture) ─────────────────
//
// One source of truth for the `/kurse` hub. Courses enter COURSE_CATALOG once
// they use the platform progress/certificate engine. Pending external imports
// stay in IMPORTED_COURSE_CATALOG until their native route and progress wiring
// ship. Ported courses retain their source, license, and screenshot metadata
// after that transition.

import type { CourseSlug } from "@/lib/course/types";

/**
 * Learner level. Independent declaration mirroring demos.ts's DemoLevel
 * vocabulary (same three values, same meaning) rather than importing across
 * the courses/demos domain boundary — courses do not depend on the demos
 * module elsewhere, and Demo.courseSlug already points the other way.
 */
export type CourseLevel = "einstieg" | "mittel" | "fortg";

export interface CatalogCourse {
  /** Slug shared with the unified progress store + course engine. */
  readonly slug: CourseSlug;
  /** 1-based position in the recommended learning path. */
  readonly step: number;
  /** Short label on the card (e.g. "KI-Führerschein"). */
  readonly title: string;
  /** Section eyebrow (mono, uppercase). */
  readonly eyebrow: string;
  /** One-sentence learning outcome. */
  readonly tagline: string;
  /** Two-sentence card body. */
  readonly description: string;
  /** Landing-page path. */
  readonly href: string;
  /** Where "Kurs starten" goes (course reader entry). */
  readonly startHref: string;
  /**
   * Static course-level fallback retained for catalog/discovery consumers.
   * Interactive "Weiterlernen" links use the canonical first-incomplete
   * resolver in `lib/courses/resume.ts`.
   */
  readonly continueHref: string;
  /** Human duration label (e.g. "ca. 2 Std."). */
  readonly duration: string;
  /**
   * Numeric duration in minutes. Locale-independent, so it lives on the base
   * record rather than the locale copy layer — sorting/filtering companion
   * to the human `duration` string, which is locale-specific display copy
   * and parses ambiguously (English "hr"/"min" abbreviations differ from
   * German "Std."/"Min.").
   */
  readonly durationMinutes: number;
  /** Total lessons used for the progress dots + percentage. */
  readonly totalLessons: number;
  /**
   * Learner level. Locale-independent value; its display label is looked up
   * per locale via `COURSE_LEVEL_LABELS_BY_LOCALE` in `catalog-copy.ts`,
   * mirroring how demos.ts separates DemoLevel from its locale labels.
   */
  readonly level: CourseLevel;
  /** Structural unit label ("Blöcke" / "Module"). */
  readonly unitLabel: string;
  /** Count of structural units shown on the card. */
  readonly unitCount: number;
  /** Audience line. */
  readonly audience: string;
  /**
   * Card banner image. German core courses use owned editorial illustrations;
   * the four ported courses retain provenance-pinned source screenshots.
   */
  readonly coverImage?: string;
  readonly coverImageAlt?: string;
  /**
   * Every entry in COURSE_CATALOG is "live" by construction (a course only
   * ever enters this array once it is fully native). The single field the
   * gallery + generateStaticParams branch on instead of array membership
   *; this plan does not flip any of the 6 imported
   * courses to "live".
   */
  readonly nativeStatus: "live";
  // The optional fields below mirror ImportedCourse's provenance fields so a
  // course that later flips from imported to native (its own plan, not this
  // one) can retain open-source attribution (source repo, license, commit)
  // on its CatalogCourse entry instead of losing that history at the flip.
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly launchHref?: string;
  readonly sourceHref?: string;
  readonly sourceCommitHref?: string;
  readonly licenseHref?: string;
  readonly sourceImagePath?: string;
  readonly sourceLicensePath?: string;
  readonly imageSha256?: string;
  readonly licenseSha256?: string;
  readonly licenseSizeBytes?: number;
  readonly sourceCommit?: string;
  readonly lessonCountLabel?: string;
  readonly language?: string;
  readonly topics?: readonly string[];
  readonly sourceFacts?: readonly string[];
  readonly integrationNote?: string;
}

export interface ImportedCourse {
  /** Stable platform slug for imported open-source courses. */
  readonly slug: string;
  /** Position inside the imported/open-source section. */
  readonly step: number;
  readonly title: string;
  readonly eyebrow: string;
  readonly tagline: string;
  readonly description: string;
  readonly href: string;
  /** Public static screenshot copied from the source repository. */
  readonly imageSrc: string;
  readonly imageAlt: string;
  /** External live course URL. Kept off the native progress engine. */
  readonly launchHref: string;
  readonly sourceHref: string;
  readonly sourceCommitHref: string;
  readonly licenseHref: string;
  readonly sourceImagePath: string;
  readonly sourceLicensePath: string;
  readonly imageSha256: string;
  readonly licenseSha256: string;
  readonly licenseSizeBytes: number;
  readonly sourceCommit: string;
  readonly duration: string;
  readonly durationMinutes: number;
  readonly totalLessons: number;
  readonly level: CourseLevel;
  readonly unitLabel: string;
  readonly unitCount: number;
  readonly lessonCountLabel: string;
  readonly audience: string;
  readonly language: string;
  readonly topics: readonly string[];
  readonly sourceFacts: readonly string[];
  readonly integrationNote: string;
  /**
   * Every entry in IMPORTED_COURSE_CATALOG is "pending" by construction — the
   * single field the gallery + generateStaticParams branch on instead of
   * array membership.
   */
  readonly nativeStatus: "pending";
}

// Step 1 → 2 → 3 → 4. Lesson counts mirror the live course content:
//  - KI-Führerschein: 4 modules, 8 lesson-engine lessons (see lib/course/data.ts)
//  - KI und Gesellschaft: 3 modules, 8 lesson-engine lessons
//  - EU-AI-Act-Kurs: 5 modules, 10 lesson-engine lessons
//  - AI-Native (Mit KI arbeiten): 4 modules, 9 lessons
export const COURSE_CATALOG: readonly CatalogCourse[] = [
  {
    slug: "ki-fuehrerschein",
    step: 1,
    title: "KI-Führerschein",
    eyebrow: "Schritt 01 · KI-Kompetenz",
    tagline: "Daten einstufen, prüfbar briefen, Fehler finden.",
    description:
      "Acht kurze Lektionen mit Übung: Daten einstufen und schwärzen, prüfbare Aufträge schreiben, KI-Entwürfe gegen Quellen prüfen und eine einseitige Team-Richtlinie erstellen. Artikel 4 des AI Act in der seit 27. Juli 2026 geltenden Fassung ordnet der Kurs knapp ein; am Ende erstellst du lokal eine Teilnahmebestätigung.",
    href: "/ki-fuehrerschein",
    startHref: "/ki-fuehrerschein/kurs",
    continueHref: "/ki-fuehrerschein/kurs",
    duration: "ca. 45 Min.",
    durationMinutes: 45,
    totalLessons: 8,
    level: "einstieg",
    unitLabel: "Module",
    unitCount: 4,
    audience: "Beschäftigte, die KI im Arbeitsalltag einsetzen",
    coverImage: "/course-covers/ki-fuehrerschein-cover-v4.webp",
    coverImageAlt:
      "Editoriale Collage eines KI-Prüfpasses mit Lernkarten, Datenschutz und Prüfschritten",
    nativeStatus: "live",
  },
  {
    slug: "ki-und-gesellschaft",
    step: 2,
    title: "KI und Gesellschaft",
    eyebrow: "Schritt 02 · Gesellschaft",
    tagline: "Jobzahlen lesen, Fakes prüfen, Fairness messen.",
    description:
      "Acht kurze Lektionen mit Übung: Jobschlagzeilen entschlüsseln, ein virales Video auf Herkunft prüfen, einen Detektoralarm nachrechnen, den Meldeweg finden und im Schwellenwert-Labor erleben, warum zwei Fairness-Maße nicht zugleich gelten können.",
    href: "/ki-und-gesellschaft",
    startHref: "/ki-und-gesellschaft/kurs",
    continueHref: "/ki-und-gesellschaft/kurs",
    duration: "ca. 40 Min.",
    durationMinutes: 40,
    totalLessons: 8,
    level: "einstieg",
    unitLabel: "Module",
    unitCount: 3,
    audience: "Ohne technische Vorkenntnisse",
    coverImage: "/course-covers/ki-und-gesellschaft-cover-v4.webp",
    coverImageAlt:
      "Editoriale Collage eines Berliner öffentlichen Raums mit Menschen, Medienbildern und Prüfzeichen",
    nativeStatus: "live",
  },
  {
    slug: "eu-ai-act-kurs",
    step: 3,
    title: "EU AI Act Kurs",
    eyebrow: "Schritt 03 · Vertiefung",
    tagline:
      "Anwendungsfall klassifizieren, Rolle bestimmen, Pflichten zuordnen.",
    description:
      "Zehn kurze Lektionen mit Übung: Rolle bestimmen, Stichtage gegen heute prüfen, Anwendungsfälle einer Risikoklasse zuordnen, Pflichtenliste erzeugen, Bußgeldrahmen rechnen und ein KI-Memo gegen die Quellen prüfen. Jede Aussage mit Frist nennt Rechtsstand und Primärquelle. Der Kurs ersetzt keine Rechtsberatung.",
    href: "/eu-ai-act-kurs",
    startHref: "/eu-ai-act-kurs/kurs",
    continueHref: "/eu-ai-act-kurs/kurs",
    duration: "ca. 1 Std.",
    durationMinutes: 60,
    totalLessons: 10,
    level: "mittel",
    unitLabel: "Module",
    unitCount: 5,
    audience: "Compliance, IT-Leitung, Geschäftsführung",
    coverImage: "/course-covers/eu-ai-act-kurs-cover-v4.webp",
    coverImageAlt:
      "Editoriale Illustration eines EU-AI-Act-Dossiers mit Risikokarten, Rollen und Prüfpfad",
    nativeStatus: "live",
  },
  {
    slug: "ai-native",
    step: 4,
    title: "Mit KI arbeiten",
    eyebrow: "Schritt 04 · Eigene Arbeit",
    tagline:
      "Netto-Zeit messen, Rechte begrenzen, Quellen prüfen, Abläufe absichern.",
    description:
      "Neun kurze Lektionen mit Übung, unabhängig vom Werkzeug: messen, ob sich KI für eine Aufgabe lohnt, Kontext und Werkzeugrechte gegen Prompt-Injection begrenzen, zitierte Antworten prüfen und einen Ablauf mit Freigabe testen. Am Ende steht ein Pilotplan für deine eigene Arbeit.",
    href: "/ai-native",
    startHref: "/ai-native/kurs",
    continueHref: "/ai-native/kurs",
    duration: "ca. 70 Min.",
    durationMinutes: 68,
    totalLessons: 9,
    level: "mittel",
    unitLabel: "Module",
    unitCount: 4,
    audience: "Beschäftigte, Selbstständige und Studierende",
    coverImage: "/course-covers/ai-native-cover-v4.webp",
    coverImageAlt:
      "Editoriale Illustration eines modularen AI-Native-Arbeitsstudios mit Kontext, Werkzeugen und Prüfschleife",
    nativeStatus: "live",
  },
  // Data Infrastructure: third imported course flipped
  // from "pending" to "live" now that it has real native routes, per-lesson
  // content, and certificate/verification wiring. Its URL structure stays
  // under /kurse/open-source/data-infrastructure (not top-level like the 4
  // German courses) to keep the public URL stable across the
  // imported-to-native flip; startHref/continueHref both still start with
  // `href` per the catalog's own invariant. Provenance fields are retained
  // (not deleted) so open-source attribution survives the flip, per
  // catalog.ts's own documented convention for ImportedCourse-only fields
  // on CatalogCourse. sourceHref/sourceCommitHref inline the pinned commit
  // literally (IMPORTED_COURSE_SOURCE_BASE/_COMMIT are declared further
  // down, used by IMPORTED_COURSE_CATALOG).
  {
    slug: "data-infrastructure",
    step: 5,
    title: "Data Infrastructure",
    eyebrow: "Schritt 05 · System Design",
    tagline:
      "Speicher-, Streaming- und Konsistenzentscheidungen systematisch vergleichen.",
    description:
      "Zwölf Lektionen zu CAP und PACELC, Datenmodellen, Dateiformaten, Lakehouse-Tabellen, Streaming, CDC, Idempotenz und Daten-SLAs. Simulationen zeigen, ab welcher Last oder welchem Ausfall ein Entwurf nicht mehr trägt.",
    href: "/kurse/open-source/data-infrastructure",
    startHref: "/kurse/open-source/data-infrastructure/kurs/mental-model",
    continueHref: "/kurse/open-source/data-infrastructure/kurs",
    duration: "ca. 3 Std.",
    durationMinutes: 180,
    totalLessons: 12,
    level: "fortg",
    unitLabel: "Tracks",
    unitCount: 4,
    audience:
      "Senior/Staff Data Engineers, IC5+-Kandidaten, Datenplattform-Teams",
    coverImage: "/imported-courses/screenshots/data-infrastructure.jpg",
    coverImageAlt: "Startseite von Data Infrastructure",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/data-infrastructure.jpg",
    imageAlt:
      "Screenshot des Kurses Data Infrastructure - IC5 System Design Field Guide",
    launchHref:
      "https://www.timloehr.me/interactive-courses/data-infrastructure/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-infrastructure",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-infrastructure",
    licenseHref:
      "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-infrastructure.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256:
      "17bf2d0b0c371df8a1deedee4230c94aa058a7efda828400e96999ffaca42258",
    licenseSha256:
      "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Lektionen",
    language: "Deutsch + Englisch",
    topics: ["Snowflake", "BigQuery", "Kafka", "Iceberg", "Spark"],
    sourceFacts: [
      "4 Tracks",
      "12 Lektionen",
      "Interaktive Simulationen",
      "Native Route in diesem Quellstand",
    ],
    integrationNote:
      "Route, Fortschritt und Abschluss sind in diesem Quellstand integriert; die Bereitstellung braucht eine getrennte Live-Prüfung. Ursprünglich ein importierter Open-Source-Kurs.",
  },
  // Data Engineering Fundamentals: fourth imported
  // course flipped from "pending" to "live". totalLessons/unitCount
  // reconciled from the catalog's stale 10 to the real 12 (App.js's
  // CHAPTERS array: home/fund/ingest/stream/store/comp/orch/qual/disc/
  // serve/gov/cap) — the pre-flip ImportedCourse entry undercounted this
  // by 2. URL structure has no "/kurs" segment (unlike every other
  // course): startHref/continueHref both point directly under
  // /kurse/open-source/data-engineering-fundamentals, matching this
  // course's own flat [chapterId] route tree.
  {
    slug: "data-engineering-fundamentals",
    step: 6,
    title: "Data Engineering Fundamentals",
    eyebrow: "Schritt 06 · Data Engineering",
    tagline:
      "Eine Datenpipeline von der Quelle bis zur Nutzung entwerfen und absichern.",
    description:
      "Zwölf Kapitel zu Ingest, Streaming, Speicherung, Compute, Orchestrierung, Qualität, Discovery, Serving und Governance. In 17 Simulationen und einem Abschlussfall siehst du, wie ein Fehler weiter hinten Schaden anrichtet.",
    href: "/kurse/open-source/data-engineering-fundamentals",
    startHref: "/kurse/open-source/data-engineering-fundamentals/home",
    continueHref: "/kurse/open-source/data-engineering-fundamentals",
    duration: "ca. 90 Min.",
    durationMinutes: 90,
    totalLessons: 12,
    level: "mittel",
    unitLabel: "Kapitel",
    unitCount: 12,
    audience: "Data Engineers, Analytics Engineers, Plattform-Teams",
    coverImage:
      "/imported-courses/screenshots/data-engineering-fundamentals.jpg",
    coverImageAlt: "Startseite von Data Engineering Fundamentals",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/data-engineering-fundamentals.jpg",
    imageAlt: "Screenshot des Kurses Data Engineering Fundamentals",
    launchHref:
      "https://www.timloehr.me/interactive-courses/data-engineering-fundamentals/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-engineering-fundamentals",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-engineering-fundamentals",
    licenseHref:
      "/imported-courses/licenses/data-engineering-fundamentals-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-engineering-fundamentals.jpg",
    sourceLicensePath: "data-engineering-fundamentals/LICENSE",
    imageSha256:
      "fa3df8661bdc942b1bb712480e85767e30ff43e5612e73b2f12ccc85d9db8f60",
    licenseSha256:
      "7cd9f643d6d743ff0600dda3da55383162723a0d5e874c5b73a3501c5e5b75e0",
    licenseSizeBytes: 1079,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Kapitel",
    language: "Deutsch + Englisch",
    topics: ["Python", "SQL", "Airflow", "dbt", "Spark", "Kafka"],
    sourceFacts: [
      "12 Kapitel",
      "17 interaktive Simulationen",
      "Native Route in diesem Quellstand",
    ],
    integrationNote:
      "Route, Fortschritt und Abschluss sind in diesem Quellstand integriert; die Bereitstellung braucht eine getrennte Live-Prüfung. Ursprünglich ein importierter Open-Source-Kurs.",
  },
  // Data Science: fifth imported course flipped from
  // "pending" to "live". Like data-engineering-fundamentals, chapters live
  // directly under data-science/[chapterSlug] with no "/kurs" segment —
  // but unlike it, the Overview renders at the bare course root itself
  // ('s route split: "home" is not a [chapterSlug] entry),
  // so startHref/continueHref both point at the course root directly
  // rather than at a "/home" sub-path.
  {
    slug: "data-science",
    step: 7,
    title: "Data Science Fundamentals",
    eyebrow: "Schritt 07 · Data Science",
    tagline:
      "Modelle bewerten, Fehlinterpretationen erkennen und Betrieb überwachen.",
    description:
      "Zwölf Kapitel zu Stichproben, Datenbereinigung, Features, Evaluation, Interpretierbarkeit, Experimenten, Kausalität und Drift. 37 Simulationen zeigen, wo eine gut aussehende Kennzahl täuscht.",
    href: "/kurse/open-source/data-science",
    startHref: "/kurse/open-source/data-science",
    continueHref: "/kurse/open-source/data-science",
    duration: "ca. 2 Std.",
    durationMinutes: 120,
    totalLessons: 12,
    level: "mittel",
    unitLabel: "Kapitel",
    unitCount: 12,
    audience: "Data Scientists, ML Engineers, Analysten",
    coverImage: "/imported-courses/screenshots/data-science.jpg",
    coverImageAlt: "Startseite von Data Science Fundamentals",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/data-science.jpg",
    imageAlt: "Screenshot des Kurses Data Science Fundamentals",
    launchHref: "https://www.timloehr.me/interactive-courses/data-science/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-science",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-science",
    licenseHref:
      "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-science.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256:
      "3b687b55058b216e4a2a91b1f202327460d5302295aee48c4b9d0c9e06d1b3ce",
    licenseSha256:
      "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Kapitel",
    language: "Deutsch + Englisch",
    topics: ["Python", "pandas", "scikit-learn", "PyTorch", "MLflow"],
    sourceFacts: [
      "12 Kapitel",
      "37 interaktive Simulationen",
      "Native Route in diesem Quellstand",
    ],
    integrationNote:
      "Route, Fortschritt und Abschluss sind in diesem Quellstand integriert; die Bereitstellung braucht eine getrennte Live-Prüfung. Ursprünglich ein importierter Open-Source-Kurs.",
  },
  // AI-Native Operator: sixth and last imported course
  // flipped from "pending" to "live". Its URL structure stays under
  // /kurse/open-source/ai-native-operator (not top-level like the 4 foundation
  // courses, and never the bare /ai-native slug already owned by the
  // native German course); startHref/continueHref both still start with
  // `href` per the catalog's own invariant. No "/kurs" segment (matches
  // data-engineering-fundamentals/data-science): modules and lessons live
  // directly under the course root. sourceHref/sourceCommitHref inline the
  // pinned commit literally (IMPORTED_COURSE_SOURCE_BASE/_COMMIT are
  // declared further down this file, used by IMPORTED_COURSE_CATALOG,
  // which this entry left) — same as data-infrastructure/
  // data-engineering-fundamentals/data-science above.
  {
    slug: "ai-native-operator",
    step: 8,
    title: "The AI-Native Operator",
    eyebrow: "Schritt 08 · AI Operating Model",
    tagline:
      "KI-gestützte Arbeit mit Zuständigkeit, Kontrolle und Messung organisieren.",
    description:
      "Neun Module mit 39 Lektionen zu Engineering, Produktarbeit, Betrieb, Rollen, Organisation, Daten, Governance und Messung. In 30 Übungen legst du fest, wer bei KI-gestützter Arbeit entscheidet und prüft.",
    href: "/kurse/open-source/ai-native-operator",
    startHref: "/kurse/open-source/ai-native-operator/mindset/1",
    continueHref: "/kurse/open-source/ai-native-operator",
    duration: "ca. 4 Std.",
    durationMinutes: 240,
    totalLessons: 39,
    level: "fortg",
    unitLabel: "Module",
    unitCount: 9,
    audience: "Fach- und Führungskräfte",
    coverImage: "/imported-courses/screenshots/ai-native-operator.jpg",
    coverImageAlt: "Startseite von The AI-Native Operator",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/ai-native-operator.jpg",
    imageAlt: "Screenshot of The AI-Native Operator course",
    launchHref: "https://www.timloehr.me/interactive-courses/ai-native/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/ai-native",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/ai-native",
    licenseHref:
      "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/ai-native.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256:
      "316f9b6a2a1aa2ea25ed27da113ed30028597fe0fb15416c52bad8fadbbdedf5",
    licenseSha256:
      "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "39 Lektionen",
    language: "Deutsch + Englisch",
    topics: ["Agents", "Workflows", "Orchestration", "Evals", "Org Design"],
    sourceFacts: [
      "9 Module",
      "39 Lektionen",
      "30 Übungen",
      "Native Route in diesem Quellstand",
    ],
    integrationNote:
      "Route, Fortschritt und Abschluss sind in diesem Quellstand integriert; die Bereitstellung braucht eine getrennte Live-Prüfung. Ursprünglich ein importierter Open-Source-Kurs.",
  },
] as const;

const PORTED_COURSE_METADATA_KEYS = [
  "imageSrc",
  "imageAlt",
  "launchHref",
  "sourceHref",
  "sourceCommitHref",
  "licenseHref",
  "sourceImagePath",
  "sourceLicensePath",
  "imageSha256",
  "licenseSha256",
  "licenseSizeBytes",
  "sourceCommit",
  "lessonCountLabel",
  "language",
  "topics",
  "sourceFacts",
  "integrationNote",
] as const satisfies readonly (keyof CatalogCourse)[];

export type PortedCourse = CatalogCourse &
  Required<Pick<CatalogCourse, (typeof PORTED_COURSE_METADATA_KEYS)[number]>>;

function isPortedCourse(course: CatalogCourse): course is PortedCourse {
  return (
    course.href.startsWith("/kurse/open-source/") &&
    PORTED_COURSE_METADATA_KEYS.every((key) => course[key] !== undefined)
  );
}

/**
 * Native courses originally imported from the commit-pinned open-source
 * collection. This explicit, non-empty subset keeps provenance and browser
 * coverage from silently disappearing when the pending-import array is empty.
 */
export const PORTED_COURSE_CATALOG: readonly PortedCourse[] =
  COURSE_CATALOG.filter(isPortedCourse);

export const IMPORTED_COURSE_SOURCE_COMMIT =
  "0e5dfd327ce44663696b52eb6643bab147947101";

// "data-infrastructure"/"data-engineering-fundamentals"/"data-science"/
// "ai-native-operator" all moved to COURSE_CATALOG above
// ( / / /
// stage 12 / /: flipped to
// nativeStatus "live" now that they have real native routes). Every
// imported course has now shipped natively — this array is empty by
// construction until (if ever) a new course import starts its own pending
// window, matching the exact same "machinery now, flip later" shape the
// array always had.
export const IMPORTED_COURSE_CATALOG: readonly ImportedCourse[] = [] as const;

export const ALL_COURSE_CATALOG = [
  ...COURSE_CATALOG,
  ...IMPORTED_COURSE_CATALOG,
] as const;

export function getCatalogCourse(slug: CourseSlug): CatalogCourse | undefined {
  return COURSE_CATALOG.find((c) => c.slug === slug);
}

export function getImportedCourse(slug: string): ImportedCourse | undefined {
  return IMPORTED_COURSE_CATALOG.find((c) => c.slug === slug);
}
