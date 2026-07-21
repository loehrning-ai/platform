// ─── Unified course catalog (shared course architecture) ─────────────────
//
// One source of truth for the `/kurse` hub. Native platform courses stay in
// COURSE_CATALOG because they share the progress/certificate engine. Imported
// open-source courses stay in IMPORTED_COURSE_CATALOG because they are linked
// as standalone browser courses and must not receive fake local progress.

import type { CourseSlug } from "@/lib/course/types";

export interface CatalogCourse {
  /** Slug shared with the unified progress store + course engine. */
  readonly slug: CourseSlug;
  /** 1-based position in the recommended learning path. */
  readonly step: number;
  /** Short label on the card (e.g. "KI-Führerschein"). */
  readonly title: string;
  /** Section eyebrow (mono, uppercase). */
  readonly eyebrow: string;
  /** One-line promise. */
  readonly tagline: string;
  /** Two-sentence card body. */
  readonly description: string;
  /** Landing-page path. */
  readonly href: string;
  /** Where "Kurs starten" goes (course reader entry). */
  readonly startHref: string;
  /** Deep-link used when a learner has progress (continue where they were). */
  readonly continueHref: string;
  /** Human duration label (e.g. "ca. 2 Std."). */
  readonly duration: string;
  /** Total lessons used for the progress dots + percentage. */
  readonly totalLessons: number;
  /** Structural unit label ("Blöcke" / "Module"). */
  readonly unitLabel: string;
  /** Count of structural units shown on the card. */
  readonly unitCount: number;
  /** Audience line. */
  readonly audience: string;
  /** Course landing-page screenshot shown on the Lernpfad card banner. */
  readonly coverImage: string;
  readonly coverImageAlt: string;
  /**
   * Every entry in COURSE_CATALOG is "live" by construction (a course only
   * ever enters this array once it is fully native). The single field the
   * gallery + generateStaticParams branch on instead of array membership
   * (plan 007 stage 6/7); this plan does not flip any of the 6 imported
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
  readonly totalLessons: number;
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
   * array membership (plan 007 stage 6/7).
   */
  readonly nativeStatus: "pending";
}

// Step 1 → 2 → 3 → 4. Lesson counts mirror the live course content:
//  - KI-Führerschein: 5 blocks, 18 lessons (see lib/course/data.ts)
//  - KI und Gesellschaft: 3 blocks, 9 lessons
//  - EU-AI-Act-Kurs: 6 blocks, 24 lessons
//  - AI-Native: 4 modules, 27 lessons
export const COURSE_CATALOG: readonly CatalogCourse[] = [
  {
    slug: "ki-fuehrerschein",
    step: 1,
    title: "KI-Führerschein",
    eyebrow: "Schritt 01 · KI-Kompetenz",
    tagline: "Artikel-4-Grundlagen für Personen, die im Auftrag mit KI arbeiten.",
    description:
      "Der kostenlose Einstieg: Was KI ist, wo ihre Grenzen liegen und wie Artikel 4 seit 2. Februar 2025 angemessene KI-Kompetenzmaßnahmen verlangt. Mit lokaler Teilnahmebestätigung.",
    href: "/ki-fuehrerschein",
    startHref: "/ki-fuehrerschein/kurs",
    continueHref: "/ki-fuehrerschein/kurs",
    duration: "ca. 1 Std. 40 Min.",
    totalLessons: 18,
    unitLabel: "Blöcke",
    unitCount: 5,
    audience: "Alle Mitarbeiter, die KI nutzen",
    coverImage: "/course-covers/ki-fuehrerschein.png",
    coverImageAlt: "Startseite des KI-Führerschein-Kurses",
    nativeStatus: "live",
  },
  {
    slug: "ki-und-gesellschaft",
    step: 2,
    title: "KI und Gesellschaft",
    eyebrow: "Schritt 02 · Gesellschaft",
    tagline: "Arbeit, Deepfakes und Ethik verständlich einordnen.",
    description:
      "Wie KI den Arbeitsmarkt verändert, wie du Deepfakes erkennst und warum algorithmischer Bias entsteht. Ein kostenloser Gesellschaftskurs ohne technische Vorkenntnisse.",
    href: "/ki-und-gesellschaft",
    startHref: "/ki-und-gesellschaft/kurs",
    continueHref: "/ki-und-gesellschaft/kurs",
    duration: "ca. 46 Min.",
    totalLessons: 9,
    unitLabel: "Blöcke",
    unitCount: 3,
    audience: "Alle ohne Vorkenntnisse",
    coverImage: "/course-covers/ki-und-gesellschaft.png",
    coverImageAlt: "Startseite des Kurses KI und Gesellschaft",
    nativeStatus: "live",
  },
  {
    slug: "eu-ai-act-kurs",
    step: 3,
    title: "EU AI Act Kurs",
    eyebrow: "Schritt 03 · Vertiefung",
    tagline: "Hochrisiko, GPAI, Transparenz und Roadmap 2026-2028.",
    description:
      "Risikoklassifizierung nach Annex III, Pflichten für Hochrisiko-KI und eine Schritt-für-Schritt-Roadmap. Aufbauend auf dem KI-Führerschein; Fortschritt wird lokal im Browser gespeichert.",
    href: "/eu-ai-act-kurs",
    startHref: "/eu-ai-act-kurs/kurs",
    continueHref: "/eu-ai-act-kurs/kurs",
    duration: "ca. 1 Std. 50 Min.",
    totalLessons: 24,
    unitLabel: "Blöcke",
    unitCount: 6,
    audience: "Compliance, IT-Leitung, Geschäftsführung",
    coverImage: "/course-covers/eu-ai-act-kurs.png",
    coverImageAlt: "Startseite des EU AI Act Kurses",
    nativeStatus: "live",
  },
  {
    slug: "ai-native",
    step: 4,
    title: "AI-Native Arbeitskurs",
    eyebrow: "Schritt 04 · Arbeitsweise",
    tagline: "Intent formulieren, Kontext geben, Output prüfen.",
    description:
      "Vom Compliance-Wissen zur täglichen Praxis mit Claude, Obsidian und n8n. Mit Demos, Übungen, Zertifikat und synchronisiertem Lernstand.",
    href: "/ai-native",
    startHref: "/ai-native/kurs/modul_1",
    continueHref: "/ai-native/kurs/modul_1/modul_1_lesson_1",
    duration: "ca. 12 Std.",
    totalLessons: 27,
    unitLabel: "Module",
    unitCount: 4,
    audience: "Mitarbeiter, Selbstständige und Studierende",
    coverImage: "/course-covers/ai-native.png",
    coverImageAlt: "Startseite des AI-Native Arbeitskurses",
    nativeStatus: "live",
  },
  // Claude Course (plan 008 stage 10): first imported course flipped from
  // "pending" to "live" now that it has real native routes, per-lesson
  // content, and certificate/verification wiring. Its URL structure stays
  // under /kurse/open-source/claude (not top-level like the 4 German
  // courses) to keep the public URL stable across the imported-to-native
  // flip; startHref/continueHref both still start with `href` per the
  // catalog's own invariant. Provenance fields are retained (not deleted)
  // so open-source attribution survives the flip, per catalog.ts's own
  // documented convention for ImportedCourse-only fields on CatalogCourse.
  {
    slug: "claude",
    step: 5,
    title: "Claude Course",
    eyebrow: "Schritt 05 · Prompting",
    tagline: "Prompting, Kontext, Claude Code, Agents, Grounding und Evals.",
    description:
      "Prompt like you mean it: Zwölf hands-on Lektionen zu Prompt-Anatomie, Context Engineering, CLAUDE.md, Iteration, Google Docs, Agents & Tool Use, Reviews, Grounding, Prompt Debugging & Evals, Team Workflows und Safety. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und Zertifikat.",
    href: "/kurse/open-source/claude",
    startHref: "/kurse/open-source/claude/kurs/mental-model",
    continueHref: "/kurse/open-source/claude/kurs",
    duration: "ca. 2 Std.",
    totalLessons: 12,
    unitLabel: "Tracks",
    unitCount: 4,
    audience: "Wissensarbeiter, Entwickler, Teams mit Claude Code",
    coverImage: "/imported-courses/screenshots/claude.jpg",
    coverImageAlt: "Startseite des Claude Course",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/claude.jpg",
    imageAlt: "Screenshot des Claude Course",
    launchHref: "https://www.timloehr.me/interactive-courses/claude/",
    // IMPORTED_COURSE_SOURCE_COMMIT/BASE are declared further down this file
    // (used by IMPORTED_COURSE_CATALOG below), so this entry inlines the same
    // pinned commit literally rather than forward-referencing them.
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/claude",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/claude",
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/claude.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "4d0c51a947792c1e8203e962eede06854c3ee946ab220a68fb844d0971fbdf0b",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Lektionen",
    language: "Englisch",
    topics: ["Claude", "Claude Code", "MCP", "Prompting", "Evals"],
    sourceFacts: ["4 Tracks", "12 Lektionen", "Hands-on Widgets", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Zertifikatsmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
  },
  // Codex Course (plan 009 stage 7): second imported course flipped from
  // "pending" to "live" now that it has real native routes, per-lesson
  // content, and certificate/verification wiring. Its URL structure stays
  // under /kurse/open-source/codex (not top-level like the 4 German
  // courses) to keep the public URL stable across the imported-to-native
  // flip; startHref/continueHref both still start with `href` per the
  // catalog's own invariant. Provenance fields are retained (not deleted)
  // so open-source attribution survives the flip, per catalog.ts's own
  // documented convention for ImportedCourse-only fields on CatalogCourse.
  {
    slug: "codex",
    step: 6,
    title: "Codex Course",
    eyebrow: "Schritt 06 · Coding Agents",
    tagline: "Terminal-first Playbook für Codex, Tasks, Tools und Parallelisierung.",
    description:
      "Zwölf Lektionen mit Capstone zu Mental Model, Sandbox, AGENTS.md, Task Specs, Scoping, Acceptance Criteria, Code Review, Iteration, Tool Use, Parallelisierung und Patterns. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und Zertifikat.",
    href: "/kurse/open-source/codex",
    startHref: "/kurse/open-source/codex/kurs/L01",
    continueHref: "/kurse/open-source/codex/kurs",
    duration: "ca. 2 Std.",
    totalLessons: 12,
    unitLabel: "Lektionen",
    unitCount: 12,
    audience: "Entwickler, die mit AI-Coding-Tools arbeiten",
    coverImage: "/imported-courses/screenshots/codex.jpg",
    coverImageAlt: "Startseite des Codex Course",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/codex.jpg",
    imageAlt: "Screenshot des Codex Course",
    launchHref: "https://www.timloehr.me/interactive-courses/codex/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/codex",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/codex",
    licenseHref: "/imported-courses/licenses/codex-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/codex.jpg",
    sourceLicensePath: "codex/LICENSE.txt",
    imageSha256: "6e67076e584ca88b8b497bacebc1f2b5373fe8c6a1547108f65f66b856ee5c46",
    licenseSha256: "7b42b5981763ae5341a686ac738900f07ca2b837ff0ffe3efaafef45ade801f6",
    licenseSizeBytes: 1068,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Lektionen + Capstone",
    language: "Englisch",
    topics: ["Codex", "OpenAI", "AGENTS.md", "Sandboxing", "Pull Requests"],
    sourceFacts: ["12 Lektionen", "Capstone", "Parallel Workflows", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Zertifikatsmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
  },
] as const;

export const IMPORTED_COURSE_SOURCE_COMMIT =
  "0e5dfd327ce44663696b52eb6643bab147947101";

const IMPORTED_COURSE_SOURCE_BASE = `https://github.com/Mavengence/interactive-courses/tree/${IMPORTED_COURSE_SOURCE_COMMIT}`;

export const IMPORTED_COURSE_CATALOG: readonly ImportedCourse[] = [
  {
    slug: "data-engineering-fundamentals",
    step: 1,
    title: "Data Engineering Fundamentals",
    eyebrow: "Technisches Lab · Data Engineering",
    tagline: "Produktionsreife Datenpipelines von Grund auf.",
    description:
      "Optionaler englischer Browserkurs zu ETL-Patterns, Batch und Streaming, Partitionierung, Orchestrierung und Datenqualität. 10 Kapitel, 15 Live-Simulatoren, extern gehostet.",
    href: "/kurse/open-source/data-engineering-fundamentals",
    imageSrc: "/imported-courses/screenshots/data-engineering-fundamentals.jpg",
    imageAlt: "Screenshot des Kurses Data Engineering Fundamentals",
    launchHref: "https://www.timloehr.me/interactive-courses/data-engineering-fundamentals/",
    sourceHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-engineering-fundamentals`,
    sourceCommitHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-engineering-fundamentals`,
    licenseHref: "/imported-courses/licenses/data-engineering-fundamentals-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-engineering-fundamentals.jpg",
    sourceLicensePath: "data-engineering-fundamentals/LICENSE",
    imageSha256: "fa3df8661bdc942b1bb712480e85767e30ff43e5612e73b2f12ccc85d9db8f60",
    licenseSha256: "7cd9f643d6d743ff0600dda3da55383162723a0d5e874c5b73a3501c5e5b75e0",
    licenseSizeBytes: 1079,
    sourceCommit: IMPORTED_COURSE_SOURCE_COMMIT,
    duration: "ca. 90 Min.",
    totalLessons: 10,
    unitLabel: "Kapitel",
    unitCount: 10,
    lessonCountLabel: "10 Kapitel",
    audience: "Data Engineers, Analytics Engineers, Plattform-Teams",
    language: "Englisch",
    topics: ["Python", "SQL", "Airflow", "dbt", "Spark", "Kafka"],
    sourceFacts: ["10 Kapitel", "15 Live-Simulatoren", "No signup", "Runs in your browser"],
    integrationNote:
      "Als Open-Source-Interaktivkurs angebunden; native Fortschritts- und Zertifikatslogik bleibt den deutschen Plattformkursen vorbehalten.",
    nativeStatus: "pending",
  },
  {
    slug: "data-science",
    step: 2,
    title: "Data Science Fundamentals",
    eyebrow: "Technisches Lab · Data Science",
    tagline: "Von Verteilungen bis Deployment, mit einer Live-Simulation pro Kapitel.",
    description:
      "Zwölf interaktive Kapitel durch den Data-Science-Loop: EDA, Feature Engineering, statistisches Denken, CLT, Bias/Variance, ROC/PR, SHAP, A/B-Test-Power, Causal DAGs, Drift, Production Deployment und Capstone.",
    href: "/kurse/open-source/data-science",
    imageSrc: "/imported-courses/screenshots/data-science.jpg",
    imageAlt: "Screenshot des Kurses Data Science Fundamentals",
    launchHref: "https://www.timloehr.me/interactive-courses/data-science/",
    sourceHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-science`,
    sourceCommitHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-science`,
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-science.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "3b687b55058b216e4a2a91b1f202327460d5302295aee48c4b9d0c9e06d1b3ce",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: IMPORTED_COURSE_SOURCE_COMMIT,
    duration: "ca. 2 Std.",
    totalLessons: 12,
    unitLabel: "Kapitel",
    unitCount: 12,
    lessonCountLabel: "12 Kapitel",
    audience: "Data Scientists, ML Engineers, Analysten",
    language: "Englisch",
    topics: ["Python", "pandas", "scikit-learn", "PyTorch", "MLflow"],
    sourceFacts: ["12 Kapitel", "Live-Simulationen", "CLT", "ROC/PR"],
    integrationNote:
      "Als externer Open-Source-Kurs gerahmt, damit die interaktiven Simulationen erhalten bleiben, ohne globale CSP-Regeln zu lockern.",
    nativeStatus: "pending",
  },
  {
    slug: "data-infrastructure",
    step: 3,
    title: "Data Infrastructure",
    eyebrow: "Technisches Lab · System Design",
    tagline: "Der Data Stack auf Staff-Engineer-System-Design-Tiefe.",
    description:
      "12 Lektionen zu Storage-Internals, CAP/PACELC, Modeling, Parquet/ORC/Avro, Lakehouse-Formaten, Streaming/Watermarks, CDC/Lambda/Kappa, Idempotenz und Daten-SLAs. Mit interaktiven Diagrammen, 40+ Live-Simulationen und IC5-Interview-Replay.",
    href: "/kurse/open-source/data-infrastructure",
    imageSrc: "/imported-courses/screenshots/data-infrastructure.jpg",
    imageAlt: "Screenshot des Kurses Data Infrastructure - IC5 System Design Field Guide",
    launchHref: "https://www.timloehr.me/interactive-courses/data-infrastructure/",
    sourceHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-infrastructure`,
    sourceCommitHref: `${IMPORTED_COURSE_SOURCE_BASE}/data-infrastructure`,
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-infrastructure.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "17bf2d0b0c371df8a1deedee4230c94aa058a7efda828400e96999ffaca42258",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: IMPORTED_COURSE_SOURCE_COMMIT,
    duration: "ca. 3 Std.",
    totalLessons: 12,
    unitLabel: "Tracks",
    unitCount: 4,
    lessonCountLabel: "12 Lektionen",
    audience: "Senior/Staff Data Engineers, IC5+-Kandidaten, Datenplattform-Teams",
    language: "Englisch",
    topics: ["Snowflake", "BigQuery", "Kafka", "Iceberg", "Spark"],
    sourceFacts: ["4 Tracks", "12 Lektionen", "40+ Live-Simulationen", "IC5 Interview"],
    integrationNote:
      "Als Open-Source-Browserkurs verlinkt; Fortschritt bleibt extern, damit die interaktiven Simulatoren und das Interview-Replay ohne globale Sicherheitslockerung lauffähig bleiben.",
    nativeStatus: "pending",
  },
  // "claude"/"codex" moved to COURSE_CATALOG above (plan 008 stage 10 /
  // plan 009 stage 7: flipped to nativeStatus "live" now that they have
  // real native routes).
  {
    slug: "ai-native-operator",
    step: 4,
    title: "The AI-Native Operator",
    eyebrow: "Technisches Lab · AI Operating Model",
    tagline: "Arbeitsweise, Engineering-Praxis und Organisationsdesign für AI-natives Arbeiten.",
    description:
      "Neununddreißig praktische Lektionen in neun Modulen zu Mindset, Engineering-Praxis und Organisationsdesign für das Arbeiten mit KI-Agenten. Eine hash-geroutete Journey mit interaktiven Übungen und Quizzes.",
    href: "/kurse/open-source/ai-native-operator",
    imageSrc: "/imported-courses/screenshots/ai-native-operator.jpg",
    imageAlt: "Preview of The AI-Native Operator course",
    launchHref: "https://www.timloehr.me/interactive-courses/ai-native/",
    sourceHref: `${IMPORTED_COURSE_SOURCE_BASE}/ai-native`,
    sourceCommitHref: `${IMPORTED_COURSE_SOURCE_BASE}/ai-native`,
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/ai-native.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "316f9b6a2a1aa2ea25ed27da113ed30028597fe0fb15416c52bad8fadbbdedf5",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: IMPORTED_COURSE_SOURCE_COMMIT,
    duration: "ca. 14 Std. Lektüre + 30 Übungen",
    totalLessons: 39,
    unitLabel: "Module",
    unitCount: 9,
    lessonCountLabel: "39 Lektionen",
    audience: "Fach- und Führungskräfte",
    language: "Englisch",
    topics: ["Agents", "Workflows", "Orchestration", "Evals", "Org Design"],
    sourceFacts: ["9 Module", "39 Lektionen", "30 Übungen", "Quizzes"],
    integrationNote:
      "Divergent vom deutschen AI-Native Arbeitskurs; als fortgeschrittenes Open-Source-Modul separat eingebunden.",
    nativeStatus: "pending",
  },
] as const;

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
