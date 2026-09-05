import type { Locale } from "@/lib/i18n/locale";
import type { CatalogCourse, CourseLevel, ImportedCourse } from "./catalog";

/**
 * Level labels by locale, mirroring demos-localization.ts's
 * DEMO_LEVEL_LABELS_BY_LOCALE shape: the level VALUE on a course is
 * locale-independent, only its display label varies per locale.
 */
export const COURSE_LEVEL_LABELS_BY_LOCALE: Readonly<
  Record<Locale, Readonly<Record<CourseLevel, string>>>
> = {
  de: {
    einstieg: "Einstieg",
    mittel: "Mittel",
    fortg: "Fortgeschritten",
  },
  en: {
    einstieg: "Entry",
    mittel: "Intermediate",
    fortg: "Advanced",
  },
};

type CourseCopy = Pick<
  CatalogCourse,
  | "title"
  | "eyebrow"
  | "tagline"
  | "description"
  | "duration"
  | "unitLabel"
  | "audience"
  | "coverImageAlt"
  | "imageAlt"
  | "lessonCountLabel"
  | "language"
  | "sourceFacts"
  | "integrationNote"
>;

type LocalizedCatalogCourse<T extends CatalogCourse | ImportedCourse> = T &
  Partial<CourseCopy>;

const ENGLISH_COURSE_COPY: Readonly<Record<string, CourseCopy>> = {
  "ki-fuehrerschein": {
    title: "AI Fundamentals",
    eyebrow: "Step 01 · AI literacy",
    tagline: "Define tasks, protect data, and check model output.",
    description:
      "How generative AI answers, where it fails, which data stays out, and how you use it safely anyway. The Article 4 version in force since 27 July 2026, in context. It ends with a locally created certificate of participation.",
    duration: "about 1 hr 40 min",
    unitLabel: "units",
    audience: "People who use AI in their day-to-day work",
    coverImageAlt:
      "Editorial collage of an AI review passport with learning cards, data protection, and verification steps",
  },
  "ki-und-gesellschaft": {
    title: "AI and Society",
    eyebrow: "Step 02 · Society",
    tagline: "Examine deepfakes, bias, and effects on work through examples.",
    description:
      "Work changes, media get manipulated, systems discriminate. Three units separate findings from claims. Source, interest, and uncertainty stay separate.",
    duration: "about 46 min",
    unitLabel: "units",
    audience: "No technical background required",
    coverImageAlt:
      "Editorial collage of a Berlin public space with people, media images, and verification marks",
  },
  "eu-ai-act-kurs": {
    title: "EU AI Act Course",
    eyebrow: "Step 03 · Regulation",
    tagline: "Classify a use case, determine roles, and map obligations.",
    description:
      "Prohibited, transparency-bound, general-purpose, high-risk, or none of these: the course sorts a use case into the class it belongs to. Every time-dependent statement names its legal date and primary source. Not legal advice.",
    duration: "about 1 hr 50 min",
    unitLabel: "units",
    audience: "Compliance, IT leadership, management",
    coverImageAlt:
      "Editorial illustration of an EU AI Act dossier with risk cards, roles, and a review path",
  },
  "ai-native": {
    title: "AI-Native Work Course",
    eyebrow: "Step 04 · Working method",
    tagline: "Clarify intent, provide context, and check execution and output.",
    description:
      "One workflow you can repeat: research, documentation, automation. Four modules, and every exercise names its tool, input, review step, and stopping condition.",
    duration: "about 12 hrs",
    unitLabel: "modules",
    audience: "Employees, independent professionals, students",
    coverImageAlt:
      "Editorial illustration of a modular AI-native studio with context, tools, and a review loop",
  },
  claude: {
    title: "Claude Course",
    eyebrow: "Technical course · Prompting",
    tagline: "Use Claude with explicit context, tools, and verification steps.",
    description:
      "Twelve lessons, always the same pattern. One model, one bounded exercise. Prompt structure, context files, tool use, grounding, reviews, evaluation, collaboration.",
    duration: "about 2 hrs",
    unitLabel: "tracks",
    audience: "Knowledge workers, developers, teams using Claude Code",
    coverImageAlt: "Claude Course start page",
    imageAlt: "Screenshot of the Claude Course",
    lessonCountLabel: "12 lessons",
    language: "English + German",
    sourceFacts: [
      "4 tracks",
      "12 lessons",
      "Interactive exercises",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
  codex: {
    title: "Codex Course",
    eyebrow: "Technical course · Coding agents",
    tagline:
      "Delegate coding tasks to Codex using specifications, tests, and review.",
    description:
      "Codex writes the code. You write the specification, acceptance criteria, and review. Twelve lessons on sandbox boundaries, AGENTS.md, tool choice, and parallel work; the capstone pulls it together.",
    duration: "about 2 hrs",
    unitLabel: "lessons",
    audience: "Developers working with AI coding tools",
    coverImageAlt: "Codex Course start page",
    imageAlt: "Screenshot of the Codex Course",
    lessonCountLabel: "12 lessons and a capstone",
    language: "English + German",
    sourceFacts: [
      "12 lessons",
      "Capstone",
      "Parallel workflows",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
  "data-infrastructure": {
    title: "Data Infrastructure",
    eyebrow: "Technical course · System design",
    tagline: "Compare storage, streaming, and consistency decisions.",
    description:
      "Where does a data system break? Twelve lessons on CAP and PACELC, data models, file formats, lakehouse tables, streaming, CDC, idempotency, and data SLAs. Simulations find the limit first.",
    duration: "about 3 hrs",
    unitLabel: "tracks",
    audience: "Senior and staff data engineers, IC5+ candidates, platform teams",
    coverImageAlt: "Data Infrastructure start page",
    imageAlt:
      "Screenshot of Data Infrastructure: IC5 System Design Field Guide",
    lessonCountLabel: "12 lessons",
    language: "English + German",
    sourceFacts: [
      "4 tracks",
      "12 lessons",
      "Interactive simulations",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
  "data-engineering-fundamentals": {
    title: "Data Engineering Fundamentals",
    eyebrow: "Technical course · Data engineering",
    tagline: "Design a reliable data pipeline from source to consumption.",
    description:
      "A pipeline rarely fails in one place. Twelve chapters follow the data through ingestion, streaming, storage, compute, orchestration, quality, discovery, serving, and governance. Seventeen simulations and a final case run the failure chains.",
    duration: "about 90 min",
    unitLabel: "chapters",
    audience: "Data engineers, analytics engineers, platform teams",
    coverImageAlt: "Data Engineering Fundamentals start page",
    imageAlt: "Screenshot of the Data Engineering Fundamentals course",
    lessonCountLabel: "12 chapters",
    language: "English + German",
    sourceFacts: [
      "12 chapters",
      "17 interactive simulations",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
  "data-science": {
    title: "Data Science Fundamentals",
    eyebrow: "Technical course · Data science",
    tagline: "Evaluate models, spot misreadings, monitor production behavior.",
    description:
      "A metric can look fine and still mislead. Twelve chapters connect sampling, data cleaning, features, evaluation, interpretability, experiments, causality, and drift. Thirty-seven simulations show where that happens.",
    duration: "about 2 hrs",
    unitLabel: "chapters",
    audience: "Data scientists, ML engineers, analysts",
    coverImageAlt: "Data Science Fundamentals start page",
    imageAlt: "Screenshot of the Data Science Fundamentals course",
    lessonCountLabel: "12 chapters",
    language: "English + German",
    sourceFacts: [
      "12 chapters",
      "37 interactive simulations",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
  "ai-native-operator": {
    title: "The AI-Native Operator",
    eyebrow: "Technical course · Operating model",
    tagline:
      "Organize AI-supported work with ownership, controls, and measurement.",
    description:
      "Who is accountable when AI works alongside you? Nine modules with 39 lessons on engineering, product work, operations, roles, organization design, data, governance, and measurement. Thirty exercises ask for decisions, not definitions.",
    duration: "about 14 hrs",
    unitLabel: "modules",
    audience: "Specialists and managers",
    coverImageAlt: "The AI-Native Operator start page",
    imageAlt: "Screenshot of The AI-Native Operator course",
    lessonCountLabel: "39 lessons",
    language: "English + German",
    sourceFacts: [
      "9 modules",
      "39 lessons",
      "30 exercises",
      "Native route in this source tree",
    ],
    integrationNote:
      "Native route, progress, and completion logic ship in this source tree; deployment requires separate live verification. Originally an imported open-source course.",
  },
};

export function localizeCatalogCourse<T extends CatalogCourse | ImportedCourse>(
  course: T,
  locale: Locale,
): LocalizedCatalogCourse<T> {
  if (locale === "de") return course;
  return { ...course, ...ENGLISH_COURSE_COPY[course.slug] };
}

export function localizeCatalog<T extends CatalogCourse | ImportedCourse>(
  courses: readonly T[],
  locale: Locale,
): readonly LocalizedCatalogCourse<T>[] {
  return courses.map((course) => localizeCatalogCourse(course, locale));
}
