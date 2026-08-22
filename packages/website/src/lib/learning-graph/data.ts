import { books } from "@/lib/books";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { getCourseConfig } from "@/lib/course/config";
import type { CourseSlug } from "@/lib/course/types";
import { demos } from "@/lib/demos";
import type { Locale } from "@/lib/i18n/locale";
import { WORKSHOPS } from "@/lib/workshops";
import type { LearningEdge, LearningNode, LearningStage } from "./types";

type CourseNodeMeta = Pick<
  LearningNode,
  "audience" | "level" | "stage" | "evidenceMode"
>;

// Partial: CourseSlug also spans the 6 imported open-source courses, which
// surface as `open_source_lab` nodes (`labNodes` below) rather than `course`
// nodes, so they never index into this map.
const COURSE_NODE_META: Partial<Record<CourseSlug, CourseNodeMeta>> = {
  "ki-fuehrerschein": {
    audience: ["mitarbeitende", "verantwortliche"],
    level: "entry",
    stage: "grundlagen",
    evidenceMode: "source_backed",
  },
  "ki-und-gesellschaft": {
    audience: ["mitarbeitende"],
    level: "entry",
    stage: "grundlagen",
    evidenceMode: "source_backed",
  },
  "eu-ai-act-kurs": {
    audience: ["verantwortliche"],
    level: "intermediate",
    stage: "regeln",
    evidenceMode: "source_backed",
  },
  "ai-native": {
    audience: ["praktiker"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  // Claude Course / Codex Course /
  // Data Infrastructure / Data Engineering Fundamentals
  // / Data Science: imported
  // courses flipped to nativeStatus "live", so they now need course-node
  // metadata like the 4 German courses above (their still-imported
  // siblings surface as `open_source_lab` nodes via `labNodes` instead).
  claude: {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  codex: {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  "data-infrastructure": {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  "data-engineering-fundamentals": {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  "data-science": {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
  // AI-Native Operator: sixth and last imported course
  // to flip to nativeStatus "live" — every ported course now needs
  // course-node metadata like the 4 German courses above.
  "ai-native-operator": {
    audience: ["praktiker", "technische-vertiefung"],
    level: "advanced",
    stage: "anwenden",
    evidenceMode: "self_attested",
  },
};

function courseNodeMeta(slug: CourseSlug): CourseNodeMeta {
  const meta = COURSE_NODE_META[slug];
  if (!meta) {
    throw new Error(
      `Course "${slug}" has no learning-graph node metadata registered.`,
    );
  }
  return meta;
}

const courseNodes: readonly LearningNode[] = COURSE_CATALOG.map((course) => ({
  id: `course:${course.slug}`,
  type: "course",
  title: course.title,
  route: course.href,
  access: "public-preview",
  language: getCourseConfig(course.slug).language,
  sourceMaterialLanguages: [course.sourceHref ? "en" : "de"],
  ...courseNodeMeta(course.slug),
  sourceOwner: "editorial:courses",
  courseSlug: course.slug,
  summary: course.description,
}));

const bookNodes: readonly LearningNode[] = books.map((book) => ({
  id: `book:${book.id}`,
  type: "book",
  title: book.title,
  route: book.readerHref,
  access: "public",
  language: "de",
  sourceMaterialLanguages: [book.language],
  audience:
    book.id === "ki-arbeitsalltag"
      ? ["mitarbeitende"]
      : book.id === "ki-tools-selbststaendige"
        ? ["praktiker"]
        : ["verantwortliche"],
  level: book.id === "ki-tools-selbststaendige" ? "intermediate" : "entry",
  stage: "vertiefen",
  evidenceMode: "source_backed",
  sourceOwner: "editorial:books",
  courseSlug:
    book.id === "ki-arbeitsalltag"
      ? "ki-fuehrerschein"
      : book.id === "ki-tools-selbststaendige"
        ? "ai-native"
        : "eu-ai-act-kurs",
  summary: book.description,
}));

const demoNodes: readonly LearningNode[] = demos.map((demo) => ({
  id: `demo:${demo.slug}`,
  type: "demo",
  title: demo.title.replace(/\.$/, ""),
  route: `/demos/${demo.slug}`,
  access: "public",
  language: "de",
  sourceMaterialLanguages: ["de"],
  audience:
    demo.level === "fortg"
      ? ["praktiker", "technische-vertiefung"]
      : ["praktiker", "verantwortliche"],
  level:
    demo.level === "einstieg"
      ? "entry"
      : demo.level === "mittel"
        ? "intermediate"
        : "advanced",
  stage: demo.category === "Governance" ? "dokumentieren" : "anwenden",
  evidenceMode: demo.evidenceMode,
  sourceOwner: "editorial:demos",
  courseSlug: demo.courseSlug,
  summary: demo.description,
}));

const workshopNodes: readonly LearningNode[] = WORKSHOPS.map((workshop) => ({
  id: `workshop:${workshop.slug}`,
  type: "workshop",
  title: workshop.title,
  route: `/workshops/${workshop.slug}`,
  access: "public",
  language: "de",
  sourceMaterialLanguages: Array.from(
    new Set(workshop.materials.map((material) => material.language)),
  ),
  audience: ["praktiker", "verantwortliche"],
  level: "intermediate",
  stage: "anwenden",
  evidenceMode: "synthetic",
  sourceOwner: "editorial:workshops",
  summary: workshop.summary,
}));

const labNodes: readonly LearningNode[] = IMPORTED_COURSE_CATALOG.map(
  (course) => ({
    id: `open-source-lab:${course.slug}`,
    type: "open_source_lab",
    title: course.title,
    route: course.href,
    access: "public-preview",
    language: course.language === "Englisch" ? "en" : "de",
    sourceMaterialLanguages: [course.language === "Englisch" ? "en" : "de"],
    audience: ["technische-vertiefung"],
    level: "technical",
    stage: "vertiefen",
    evidenceMode: "external",
    sourceOwner: "external:interactive-courses",
    summary: course.description,
  }),
);

const ON_RAMP_NODE: LearningNode = {
  id: "on-ramp:einstieg",
  type: "self_test",
  title: "Einstieg: Was ist KI?",
  route: "/einstieg",
  access: "public",
  language: "de",
  sourceMaterialLanguages: ["de"],
  audience: [
    "mitarbeitende",
    "verantwortliche",
    "praktiker",
    "technische-vertiefung",
  ],
  level: "entry",
  stage: "pruefen",
  evidenceMode: "source_backed",
  sourceOwner: "editorial:onramp",
  summary:
    "Kurze Orientierungsseite für alle, die noch nie bewusst KI genutzt haben.",
};

const CONCEPTUAL_BLOCK_NODE: LearningNode = {
  id: "conceptual-block:wie-ki-funktioniert",
  type: "conceptual_block",
  title: "Wie Sprachmodelle arbeiten",
  route: "/wie-ki-funktioniert",
  access: "public",
  language: "de",
  sourceMaterialLanguages: ["de"],
  audience: [
    "mitarbeitende",
    "verantwortliche",
    "praktiker",
    "technische-vertiefung",
  ],
  level: "entry",
  stage: "pruefen",
  evidenceMode: "source_backed",
  sourceOwner: "editorial:conceptual-blocks",
  summary:
    "Vier Lektionen: Tokenvorhersage, Trainingsdaten und Bias, Halluzinationen, Grenzen.",
};

export const LEARNING_NODES: readonly LearningNode[] = [
  {
    id: "self-test:ki-check",
    type: "self_test",
    title: "KI-Check",
    route: "/ki-check",
    access: "public" as const,
    language: "de",
    sourceMaterialLanguages: ["de"],
    audience: ["mitarbeitende", "verantwortliche", "praktiker"],
    level: "entry",
    stage: "pruefen",
    evidenceMode: "self_attested",
    sourceOwner: "editorial:self-tests",
    summary:
      "Zehn Fragen, kein Login, kein Backend. Zeigt dir, wo du auf dem KI-Kompetenzweg stehst.",
  },
  ON_RAMP_NODE,
  CONCEPTUAL_BLOCK_NODE,
  ...courseNodes,
  ...bookNodes,
  ...demoNodes,
  ...workshopNodes,
  ...labNodes,
];

// Book slugs not in `books` (pending re-review, see @/lib/books) have no
// node above — drop any edge that would dangle on one of them.
const publishedBookNodeIds = new Set(bookNodes.map((node) => node.id));

const allEdges: readonly LearningEdge[] = [
  {
    from: "self-test:ki-check",
    to: "course:ki-fuehrerschein",
    type: "recommended_before",
  },
  {
    from: "on-ramp:einstieg",
    to: "course:ki-fuehrerschein",
    type: "next_step",
  },
  {
    from: "conceptual-block:wie-ki-funktioniert",
    to: "course:ki-fuehrerschein",
    type: "recommended_before",
  },
  {
    from: "course:ki-fuehrerschein",
    to: "course:ki-und-gesellschaft",
    type: "next_step",
  },
  {
    from: "course:ki-und-gesellschaft",
    to: "course:eu-ai-act-kurs",
    type: "next_step",
  },
  { from: "course:eu-ai-act-kurs", to: "course:ai-native", type: "next_step" },
  {
    from: "book:ki-arbeitsalltag",
    to: "course:ki-fuehrerschein",
    type: "supports",
  },
  { from: "book:ki-landschaft", to: "course:eu-ai-act-kurs", type: "supports" },
  {
    from: "book:ki-tools-selbststaendige",
    to: "course:ai-native",
    type: "supports",
  },
  ...demos.flatMap((demo) =>
    demo.bookSlugs.map((bookSlug) => ({
      from: `demo:${demo.slug}`,
      to: `book:${bookSlug}`,
      type: "supports" as const,
    })),
  ),
  ...demos.map((demo) => ({
    from: `demo:${demo.slug}`,
    to: `course:${demo.courseSlug}`,
    type: "practice_for" as const,
  })),
  ...WORKSHOPS.map((workshop) => ({
    from: `workshop:${workshop.slug}`,
    to:
      workshop.slug === "ki-prognosen-einschaetzen"
        ? "course:data-science"
        : "course:ai-native",
    type: "practice_for" as const,
  })),
  ...IMPORTED_COURSE_CATALOG.map((course) => ({
    from: `open-source-lab:${course.slug}`,
    to: "course:ai-native",
    type: "supports" as const,
  })),
];

export const LEARNING_EDGES: readonly LearningEdge[] = allEdges.filter(
  (edge) =>
    (!edge.from.startsWith("book:") || publishedBookNodeIds.has(edge.from)) &&
    (!edge.to.startsWith("book:") || publishedBookNodeIds.has(edge.to)),
);

export const PATHWAY_STAGES = [
  {
    id: "pruefen",
    title: "Prüfen",
    description: "KI-Check: Was ist KI, und wo stehst du?",
  },
  {
    id: "grundlagen",
    title: "Grundlagen",
    description: "KI-Kompetenz für sichere Alltagsnutzung aufbauen.",
  },
  {
    id: "regeln",
    title: "Regeln",
    description: "AI-Act-Rollen, Risikoklassen und Pflichten einordnen.",
  },
  {
    id: "anwenden",
    title: "Anwenden",
    description:
      "Workflows, Tools und Automatisierung mit Review-Grenzen üben.",
  },
  {
    id: "dokumentieren",
    title: "Dokumentieren",
    description:
      "Vorlagen, Nachweise und Entscheidungen nachvollziehbar ablegen.",
  },
  {
    id: "vertiefen",
    title: "Vertiefen",
    description: "Bücher, Demos und technische Labore gezielt nutzen.",
  },
] as const;

export interface PathwayStageCopy {
  readonly displayLabel: string;
  readonly subtitle: string;
  readonly description: string;
}

/**
 * Learner-facing wording for the six stages. German is the source text; the
 * English labels are the ones the KI-Check already ships
 * (@/lib/ki-check/localization), so every surface names a stage identically.
 */
export const PATHWAY_STAGE_COPY: Readonly<
  Record<Locale, Readonly<Record<LearningStage, PathwayStageCopy>>>
> = {
  de: {
    pruefen: {
      displayLabel: "Prüfen",
      subtitle: "Wo stehe ich?",
      description: "Finde deinen Einstiegspunkt auf dem KI-Kompetenzweg.",
    },
    grundlagen: {
      displayLabel: "Verstehen",
      subtitle: "KI im Alltag sicher nutzen",
      description: "KI-Grundlagen für die alltägliche sichere Nutzung.",
    },
    regeln: {
      displayLabel: "Einordnen",
      subtitle: "Regeln kennen und anwenden",
      description: "Was die EU-KI-Verordnung für dich bedeutet.",
    },
    anwenden: {
      displayLabel: "Umsetzen",
      subtitle: "Mit KI arbeiten",
      description: "Praktische Arbeit mit KI-Tools im Berufsalltag.",
    },
    dokumentieren: {
      displayLabel: "Belegen",
      subtitle: "Nachweise und Vorlagen",
      description: "Dokumentation, Vorlagen und Nachweise für dein Team.",
    },
    vertiefen: {
      displayLabel: "Vertiefen",
      subtitle: "Bücher, Demos, Labore",
      description:
        "Bücher, Praxisbeispiele und technische Labore für mehr Tiefe.",
    },
  },
  en: {
    pruefen: {
      displayLabel: "Assess",
      subtitle: "Where do I stand?",
      description: "Find your entry point on the AI competency path.",
    },
    grundlagen: {
      displayLabel: "Understand",
      subtitle: "Using AI safely day to day",
      description: "AI fundamentals for safe everyday use.",
    },
    regeln: {
      displayLabel: "Classify",
      subtitle: "Know the rules and apply them",
      description: "What the EU AI Act means for you.",
    },
    anwenden: {
      displayLabel: "Apply",
      subtitle: "Working with AI",
      description: "Practical work with AI tools on the job.",
    },
    dokumentieren: {
      displayLabel: "Document",
      subtitle: "Records and templates",
      description: "Documentation, templates and records for your team.",
    },
    vertiefen: {
      displayLabel: "Deepen",
      subtitle: "Books, demos, labs",
      description:
        "Books, practice examples and technical labs for more depth.",
    },
  },
};

/**
 * German copy plus the lucide icon name per stage. Icons are locale-invariant,
 * so localized surfaces read them here and take their text from
 * `PATHWAY_STAGE_COPY[locale]`.
 */
export const PATHWAY_STAGE_DISPLAY = {
  pruefen: { ...PATHWAY_STAGE_COPY.de.pruefen, icon: "MapPin" },
  grundlagen: { ...PATHWAY_STAGE_COPY.de.grundlagen, icon: "Lightbulb" },
  regeln: { ...PATHWAY_STAGE_COPY.de.regeln, icon: "Scale" },
  anwenden: { ...PATHWAY_STAGE_COPY.de.anwenden, icon: "Wrench" },
  dokumentieren: { ...PATHWAY_STAGE_COPY.de.dokumentieren, icon: "FileCheck" },
  vertiefen: { ...PATHWAY_STAGE_COPY.de.vertiefen, icon: "BookOpen" },
} satisfies Record<LearningStage, PathwayStageCopy & { icon: string }>;
