// ─── Unified course catalog (shared course architecture) ─────────────────
//
// One source of truth for the `/kurse` hub. Courses enter COURSE_CATALOG once
// they use the platform progress/certificate engine. Pending external imports
// stay in IMPORTED_COURSE_CATALOG until their native route and progress wiring
// ship. Ported courses retain their source, license, and screenshot metadata
// after that transition.

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
  /**
   * Static course-level fallback retained for catalog/discovery consumers.
   * Interactive "Weiterlernen" links use the canonical first-incomplete
   * resolver in `lib/courses/resume.ts`.
   */
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
  /**
   * Card banner image. The four German spine courses render a programmatic
   * Typenschild instead (src/app/kurse/course-plate.tsx) and carry no cover
   * asset; the six ported courses keep their provenance-pinned screenshots.
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
   * array membership.
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
    nativeStatus: "live",
  },
  {
    slug: "ai-native",
    step: 4,
    title: "AI-Native Arbeitskurs",
    eyebrow: "Schritt 04 · Arbeitsweise",
    tagline: "Intent formulieren, Kontext geben, Output prüfen.",
    description:
      "Vom Compliance-Wissen zur täglichen Praxis mit Claude, Obsidian und n8n. Mit Demos, Übungen, selbst ausgestellter Teilnahmebestätigung und synchronisiertem Lernstand.",
    href: "/ai-native",
    startHref: "/ai-native/kurs/modul_1",
    continueHref: "/ai-native/kurs/modul_1/modul_1_lesson_1",
    duration: "ca. 12 Std.",
    totalLessons: 27,
    unitLabel: "Module",
    unitCount: 4,
    audience: "Mitarbeiter, Selbstständige und Studierende",
    nativeStatus: "live",
  },
  // Claude Course: first imported course flipped from
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
      "Prompt like you mean it: Zwölf hands-on Lektionen zu Prompt-Anatomie, Context Engineering, CLAUDE.md, Iteration, Google Docs, Agents & Tool Use, Reviews, Grounding, Prompt Debugging & Evals, Team Workflows und Safety. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
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
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
  },
  // Codex Course: second imported course flipped from
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
      "Zwölf Lektionen mit Capstone zu Mental Model, Sandbox, AGENTS.md, Task Specs, Scoping, Acceptance Criteria, Code Review, Iteration, Tool Use, Parallelisierung und Patterns. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
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
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
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
  // down, used by IMPORTED_COURSE_CATALOG) — same as claude/codex above.
  {
    slug: "data-infrastructure",
    step: 7,
    title: "Data Infrastructure",
    eyebrow: "Schritt 07 · System Design",
    tagline: "Der Data Stack auf Staff-Engineer-System-Design-Tiefe.",
    description:
      "12 Lektionen zu Storage-Internals, CAP/PACELC, Modeling, Parquet/ORC/Avro, Lakehouse-Formaten, Streaming/Watermarks, CDC/Lambda/Kappa, Idempotenz und Daten-SLAs. Mit interaktiven Simulationen und IC5-Interview-Replay. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
    href: "/kurse/open-source/data-infrastructure",
    startHref: "/kurse/open-source/data-infrastructure/kurs/mental-model",
    continueHref: "/kurse/open-source/data-infrastructure/kurs",
    duration: "ca. 3 Std.",
    totalLessons: 12,
    unitLabel: "Tracks",
    unitCount: 4,
    audience: "Senior/Staff Data Engineers, IC5+-Kandidaten, Datenplattform-Teams",
    coverImage: "/imported-courses/screenshots/data-infrastructure.jpg",
    coverImageAlt: "Startseite von Data Infrastructure",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/data-infrastructure.jpg",
    imageAlt: "Screenshot des Kurses Data Infrastructure - IC5 System Design Field Guide",
    launchHref: "https://www.timloehr.me/interactive-courses/data-infrastructure/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-infrastructure",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-infrastructure",
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-infrastructure.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "17bf2d0b0c371df8a1deedee4230c94aa058a7efda828400e96999ffaca42258",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Lektionen",
    language: "Englisch",
    topics: ["Snowflake", "BigQuery", "Kafka", "Iceberg", "Spark"],
    sourceFacts: ["4 Tracks", "12 Lektionen", "Live-Simulationen", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
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
    step: 8,
    title: "Data Engineering Fundamentals",
    eyebrow: "Schritt 08 · Data Engineering",
    tagline: "Produktionsreife Datenpipelines, von der Quelle bis zum Serving.",
    description:
      "12 Kapitel zu Storage & Formaten, Ingest, Streaming, Storage-Mustern, Compute, Orchestrierung, Data Quality, Discovery, Serving und Governance. Mit 17 interaktiven Simulationen und einem sabotierbaren Capstone. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
    href: "/kurse/open-source/data-engineering-fundamentals",
    startHref: "/kurse/open-source/data-engineering-fundamentals/home",
    continueHref: "/kurse/open-source/data-engineering-fundamentals",
    duration: "ca. 90 Min.",
    totalLessons: 12,
    unitLabel: "Kapitel",
    unitCount: 12,
    audience: "Data Engineers, Analytics Engineers, Plattform-Teams",
    coverImage: "/imported-courses/screenshots/data-engineering-fundamentals.jpg",
    coverImageAlt: "Startseite von Data Engineering Fundamentals",
    nativeStatus: "live",
    imageSrc: "/imported-courses/screenshots/data-engineering-fundamentals.jpg",
    imageAlt: "Screenshot des Kurses Data Engineering Fundamentals",
    launchHref: "https://www.timloehr.me/interactive-courses/data-engineering-fundamentals/",
    sourceHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-engineering-fundamentals",
    sourceCommitHref:
      "https://github.com/Mavengence/interactive-courses/tree/0e5dfd327ce44663696b52eb6643bab147947101/data-engineering-fundamentals",
    licenseHref: "/imported-courses/licenses/data-engineering-fundamentals-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-engineering-fundamentals.jpg",
    sourceLicensePath: "data-engineering-fundamentals/LICENSE",
    imageSha256: "fa3df8661bdc942b1bb712480e85767e30ff43e5612e73b2f12ccc85d9db8f60",
    licenseSha256: "7cd9f643d6d743ff0600dda3da55383162723a0d5e874c5b73a3501c5e5b75e0",
    licenseSizeBytes: 1079,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Kapitel",
    language: "Englisch",
    topics: ["Python", "SQL", "Airflow", "dbt", "Spark", "Kafka"],
    sourceFacts: ["12 Kapitel", "17 Live-Simulationen", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
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
    step: 9,
    title: "Data Science Fundamentals",
    eyebrow: "Schritt 09 · Data Science",
    tagline: "Von Verteilungen bis Deployment, mit einer Live-Simulation pro Kapitel.",
    description:
      "12 Kapitel durch den kompletten Data-Science-Loop: Sampling & Zentraler Grenzwertsatz, explorative Datenanalyse, Feature Engineering, Bias/Variance, ROC/PR-Evaluation, SHAP/LIME-Interpretierbarkeit, A/B-Test-Power, Causal DAGs, Peeking-Fallstricke und Production-Drift-Monitoring. Mit 22 interaktiven Simulationen und einem Fraud-Detection-Capstone. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
    href: "/kurse/open-source/data-science",
    startHref: "/kurse/open-source/data-science",
    continueHref: "/kurse/open-source/data-science",
    duration: "ca. 2 Std.",
    totalLessons: 12,
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
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/data-science.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "3b687b55058b216e4a2a91b1f202327460d5302295aee48c4b9d0c9e06d1b3ce",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "12 Kapitel",
    language: "Englisch",
    topics: ["Python", "pandas", "scikit-learn", "PyTorch", "MLflow"],
    sourceFacts: ["12 Kapitel", "22 Live-Simulationen", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
  },
  // AI-Native Operator: sixth and last imported course
  // flipped from "pending" to "live". Its URL structure stays under
  // /kurse/open-source/ai-native-operator (not top-level like the 4 German
  // courses, and never the bare /ai-native slug already owned by the
  // native German course); startHref/continueHref both still start with
  // `href` per the catalog's own invariant. No "/kurs" segment (matches
  // data-engineering-fundamentals/data-science): modules and lessons live
  // directly under the course root. sourceHref/sourceCommitHref inline the
  // pinned commit literally (IMPORTED_COURSE_SOURCE_BASE/_COMMIT are
  // declared further down this file, used by IMPORTED_COURSE_CATALOG,
  // which this entry left) — same as claude/codex/data-infrastructure/
  // data-engineering-fundamentals/data-science above.
  {
    slug: "ai-native-operator",
    step: 10,
    title: "The AI-Native Operator",
    eyebrow: "Schritt 10 · AI Operating Model",
    tagline: "Arbeitsweise, Engineering-Praxis und Organisationsdesign für AI-natives Arbeiten.",
    description:
      "Neununddreißig praktische Lektionen in neun Modulen zu Mindset, Engineering-Praxis, Product Building, Operations, Talent, Org-Design, Data-Infrastruktur, Governance und Measurement für das Arbeiten mit KI-Agenten. Mit 30 interaktiven Übungen und einem 22-Fragen-Workshop-Quiz. Auf Englisch, jetzt nativ auf loehrning.ai mit Fortschritt und selbst ausgestelltem Certificate.",
    href: "/kurse/open-source/ai-native-operator",
    startHref: "/kurse/open-source/ai-native-operator/mindset/1",
    continueHref: "/kurse/open-source/ai-native-operator",
    duration: "ca. 14 Std.",
    totalLessons: 39,
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
    licenseHref: "/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt",
    sourceImagePath: "docs/screenshots/ai-native.jpg",
    sourceLicensePath: "LICENSE",
    imageSha256: "316f9b6a2a1aa2ea25ed27da113ed30028597fe0fb15416c52bad8fadbbdedf5",
    licenseSha256: "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    licenseSizeBytes: 1066,
    sourceCommit: "0e5dfd327ce44663696b52eb6643bab147947101",
    lessonCountLabel: "39 Lektionen",
    language: "Englisch",
    topics: ["Agents", "Workflows", "Orchestration", "Evals", "Org Design"],
    sourceFacts: ["9 Module", "39 Lektionen", "30 Übungen", "Jetzt nativ"],
    integrationNote:
      "Jetzt nativ auf loehrning.ai gehostet und in den Fortschritts- und Abschlussmotor eingebunden; ursprünglich als Open-Source-Kurs importiert.",
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
  Required<
    Pick<CatalogCourse, (typeof PORTED_COURSE_METADATA_KEYS)[number]>
  >;

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

// "claude"/"codex"/"data-infrastructure"/"data-engineering-fundamentals"/
// "data-science"/"ai-native-operator" all moved to COURSE_CATALOG above
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
