import { books } from "@/lib/books";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import type { CourseSlug } from "@/lib/course/types";
import { demos } from "@/lib/demos";
import type { LearningEdge, LearningNode } from "./types";

const templateNodes: readonly LearningNode[] = [
  {
    id: "template:ki-inventarliste",
    type: "template",
    title: "KI-Inventarliste",
    route: "/vorlagen/ki-inventarliste",
    access: "public",
    language: "de",
    audience: ["verantwortliche"],
    level: "intermediate",
    stage: "dokumentieren",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "eu-ai-act-kurs",
  },
  {
    id: "template:ki-nutzungsrichtlinie",
    type: "template",
    title: "KI-Nutzungsrichtlinie",
    route: "/vorlagen/ki-nutzungsrichtlinie",
    access: "public",
    language: "de",
    audience: ["mitarbeitende", "verantwortliche"],
    level: "entry",
    stage: "dokumentieren",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "ki-fuehrerschein",
  },
  {
    id: "template:schulungsrahmen-art4",
    type: "template",
    title: "Schulungsrahmen Artikel 4",
    route: "/vorlagen/schulungsrahmen-art4",
    access: "public",
    language: "de",
    audience: ["verantwortliche"],
    level: "intermediate",
    stage: "dokumentieren",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "ki-fuehrerschein",
  },
  {
    id: "template:risikoklassifizierung",
    type: "template",
    title: "Risikoklassifizierung",
    route: "/vorlagen/risikoklassifizierung",
    access: "public",
    language: "de",
    audience: ["verantwortliche"],
    level: "intermediate",
    stage: "regeln",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "eu-ai-act-kurs",
  },
  {
    id: "template:ki-anbieter-due-diligence",
    type: "template",
    title: "KI-Anbieter-Due-Diligence",
    route: "/vorlagen/ki-anbieter-due-diligence",
    access: "public",
    language: "de",
    audience: ["verantwortliche"],
    level: "advanced",
    stage: "dokumentieren",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "eu-ai-act-kurs",
  },
  {
    id: "template:dsfa-fuer-ki-systeme",
    type: "template",
    title: "DSFA für KI-Systeme",
    route: "/vorlagen/dsfa-fuer-ki-systeme",
    access: "public",
    language: "de",
    audience: ["verantwortliche"],
    level: "advanced",
    stage: "dokumentieren",
    evidenceMode: "source_backed",
    sourceOwner: "editorial:governance",
    courseSlug: "eu-ai-act-kurs",
  },
  {
    id: "template:pilot-charter",
    type: "template",
    title: "Pilot-Charter",
    route: "/vorlagen/pilot-charter",
    access: "public",
    language: "de",
    audience: ["praktiker", "verantwortliche"],
    level: "intermediate",
    stage: "anwenden",
    evidenceMode: "self_attested",
    sourceOwner: "editorial:governance",
    courseSlug: "ai-native",
  },
  {
    id: "template:use-case-bewertungsmatrix",
    type: "template",
    title: "Use-Case-Bewertungsmatrix",
    route: "/vorlagen/use-case-bewertungsmatrix",
    access: "public",
    language: "de",
    audience: ["praktiker", "verantwortliche"],
    level: "intermediate",
    stage: "pruefen",
    evidenceMode: "self_attested",
    sourceOwner: "editorial:governance",
    courseSlug: "ai-native",
  },
];

type CourseNodeMeta = Pick<
  LearningNode,
  "audience" | "level" | "stage" | "evidenceMode"
>;

const COURSE_NODE_META: Record<CourseSlug, CourseNodeMeta> = {
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
};

const courseNodes: readonly LearningNode[] = COURSE_CATALOG.map((course) => ({
  id: `course:${course.slug}`,
  type: "course",
  title: course.title,
  route: course.href,
  access: "public-preview",
  language: "de",
  ...COURSE_NODE_META[course.slug],
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

const labNodes: readonly LearningNode[] = IMPORTED_COURSE_CATALOG.map((course) => ({
  id: `open-source-lab:${course.slug}`,
  type: "open_source_lab",
  title: course.title,
  route: course.href,
  access: "public-preview",
  language: course.language === "Englisch" ? "en" : "de",
  audience: ["technische-vertiefung"],
  level: "technical",
  stage: "vertiefen",
  evidenceMode: "external",
  sourceOwner: "external:interactive-courses",
  summary: course.description,
}));

const ON_RAMP_NODE: LearningNode = {
  id: "on-ramp:einstieg",
  type: "self_test",
  title: "Einstieg: Was ist KI?",
  route: "/einstieg",
  access: "public",
  language: "de",
  audience: ["mitarbeitende", "verantwortliche", "praktiker", "technische-vertiefung"],
  level: "entry",
  stage: "pruefen",
  evidenceMode: "source_backed",
  sourceOwner: "editorial:onramp",
  summary: "Kurze Orientierungsseite für alle, die noch nie bewusst KI genutzt haben.",
};

const CONCEPTUAL_BLOCK_NODE: LearningNode = {
  id: "conceptual-block:wie-ki-funktioniert",
  type: "conceptual_block",
  title: "Wie KI wirklich funktioniert",
  route: "/wie-ki-funktioniert",
  access: "public",
  language: "de",
  audience: ["mitarbeitende", "verantwortliche", "praktiker", "technische-vertiefung"],
  level: "entry",
  stage: "pruefen",
  evidenceMode: "source_backed",
  sourceOwner: "editorial:conceptual-blocks",
  summary: "Vier Lektionen: Tokenvorhersage, Trainingsdaten und Bias, Halluzinationen, Grenzen.",
};

export const LEARNING_NODES: readonly LearningNode[] = [
  {
    id: "self-test:ki-check",
    type: "self_test",
    title: "KI-Check",
    route: "/ki-check",
    access: "public" as const,
    language: "de",
    audience: ["mitarbeitende", "verantwortliche", "praktiker"],
    level: "entry",
    stage: "pruefen",
    evidenceMode: "self_attested",
    sourceOwner: "editorial:self-tests",
    summary: "Fünf Fragen, kein Login, kein Backend. Zeigt dir, wo du auf dem KI-Kompetenzweg stehst.",
  },
  ON_RAMP_NODE,
  CONCEPTUAL_BLOCK_NODE,
  ...courseNodes,
  ...bookNodes,
  ...demoNodes,
  ...templateNodes,
  ...labNodes,
];

export const LEARNING_EDGES: readonly LearningEdge[] = [
  { from: "self-test:ki-check", to: "course:ki-fuehrerschein", type: "recommended_before" },
  { from: "on-ramp:einstieg", to: "course:ki-fuehrerschein", type: "next_step" },
  { from: "conceptual-block:wie-ki-funktioniert", to: "course:ki-fuehrerschein", type: "recommended_before" },
  { from: "course:ki-fuehrerschein", to: "course:ki-und-gesellschaft", type: "next_step" },
  { from: "course:ki-und-gesellschaft", to: "course:eu-ai-act-kurs", type: "next_step" },
  { from: "course:eu-ai-act-kurs", to: "course:ai-native", type: "next_step" },
  { from: "template:ki-nutzungsrichtlinie", to: "course:ki-fuehrerschein", type: "governance_artifact_for" },
  { from: "template:schulungsrahmen-art4", to: "course:ki-fuehrerschein", type: "governance_artifact_for" },
  { from: "template:ki-inventarliste", to: "course:eu-ai-act-kurs", type: "governance_artifact_for" },
  { from: "template:risikoklassifizierung", to: "course:eu-ai-act-kurs", type: "governance_artifact_for" },
  { from: "template:ki-anbieter-due-diligence", to: "course:eu-ai-act-kurs", type: "governance_artifact_for" },
  { from: "template:dsfa-fuer-ki-systeme", to: "course:eu-ai-act-kurs", type: "governance_artifact_for" },
  { from: "template:pilot-charter", to: "course:ai-native", type: "governance_artifact_for" },
  { from: "template:use-case-bewertungsmatrix", to: "course:ai-native", type: "governance_artifact_for" },
  { from: "book:ki-arbeitsalltag", to: "course:ki-fuehrerschein", type: "supports" },
  { from: "book:ki-landschaft", to: "course:eu-ai-act-kurs", type: "supports" },
  { from: "book:ki-tools-selbststaendige", to: "course:ai-native", type: "supports" },
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
  ...IMPORTED_COURSE_CATALOG.map((course) => ({
    from: `open-source-lab:${course.slug}`,
    to: "course:ai-native",
    type: "supports" as const,
  })),
];

export const PATHWAY_STAGES = [
  { id: "pruefen", title: "Prüfen", description: "KI-Check: Was ist KI, und wo stehst du?" },
  { id: "grundlagen", title: "Grundlagen", description: "KI-Kompetenz für sichere Alltagsnutzung aufbauen." },
  { id: "regeln", title: "Regeln", description: "AI-Act-Rollen, Risikoklassen und Pflichten einordnen." },
  { id: "anwenden", title: "Anwenden", description: "Workflows, Tools und Automatisierung mit Review-Grenzen üben." },
  { id: "dokumentieren", title: "Dokumentieren", description: "Vorlagen, Nachweise und Entscheidungen nachvollziehbar ablegen." },
  { id: "vertiefen", title: "Vertiefen", description: "Bücher, Demos und technische Labore gezielt nutzen." },
] as const;

export const PATHWAY_STAGE_DISPLAY = {
  pruefen: { displayLabel: "Prüfen", subtitle: "Wo stehe ich?", description: "Finde deinen Einstiegspunkt auf dem KI-Kompetenzweg.", icon: "MapPin" },
  grundlagen: { displayLabel: "Verstehen", subtitle: "KI im Alltag sicher nutzen", description: "KI-Grundlagen für die alltägliche sichere Nutzung.", icon: "Lightbulb" },
  regeln: { displayLabel: "Einordnen", subtitle: "Regeln kennen und anwenden", description: "Was die EU-KI-Verordnung für dich bedeutet.", icon: "Scale" },
  anwenden: { displayLabel: "Umsetzen", subtitle: "Mit KI arbeiten", description: "Praktische Arbeit mit KI-Tools im Berufsalltag.", icon: "Wrench" },
  dokumentieren: { displayLabel: "Belegen", subtitle: "Nachweise und Vorlagen", description: "Dokumentation, Vorlagen und Nachweise für dein Team.", icon: "FileCheck" },
  vertiefen: { displayLabel: "Vertiefen", subtitle: "Bücher, Demos, Labore", description: "Bücher, Praxisbeispiele und technische Labore für mehr Tiefe.", icon: "BookOpen" },
} as const satisfies Record<import("./types").LearningStage, { displayLabel: string; subtitle: string; description: string; icon: string }>;
