import type { Locale } from "@/lib/i18n/locale";
import type { CatalogCourse, ImportedCourse } from "./catalog";

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
      "This introduction explains how generative AI works, common failure modes, data protection, and safe use. It also places the version of Article 4 in force since 27 July 2026 in context. Includes a participation record issued by loehrning.ai.",
    duration: "about 1 hr 40 min",
    unitLabel: "units",
    audience: "People who use AI in their day-to-day work",
    coverImageAlt:
      "Abstract illustration of a compass and modular learning units",
  },
  "ki-und-gesellschaft": {
    title: "AI and Society",
    eyebrow: "Step 02 · Society",
    tagline: "Examine deepfakes, bias, and effects on work through examples.",
    description:
      "Three units examine changes to work, manipulated media, and discriminatory systems. Sources, interests, and uncertainty are identified separately.",
    duration: "about 46 min",
    unitLabel: "units",
    audience: "No technical background required",
    coverImageAlt:
      "Abstract illustration of people in a connected public space",
  },
  "eu-ai-act-kurs": {
    title: "EU AI Act Course",
    eyebrow: "Step 03 · Regulation",
    tagline: "Classify a use case, determine roles, and map obligations.",
    description:
      "The course distinguishes prohibited practices, transparency duties, general-purpose AI, and high-risk systems. Time-dependent statements include their legal date and primary source. This is not legal advice.",
    duration: "about 1 hr 50 min",
    unitLabel: "units",
    audience: "Compliance, IT leadership, and management",
    coverImageAlt:
      "Abstract illustration of scales, a regulatory grid, and transparent layers",
  },
  "ai-native": {
    title: "AI-Native Work Course",
    eyebrow: "Step 04 · Working method",
    tagline: "Clarify intent, provide context, and check execution and output.",
    description:
      "Four modules present a repeatable workflow for research, documentation, and automation. Each exercise identifies the tool, input, review step, and stopping condition.",
    duration: "about 12 hrs",
    unitLabel: "modules",
    audience: "Employees, independent professionals, and students",
    coverImageAlt:
      "Abstract illustration of a reviewable workflow made of tools and decisions",
  },
  claude: {
    title: "Claude Course",
    eyebrow: "Technical course · Prompting",
    tagline: "Use Claude with explicit context, tools, and verification steps.",
    description:
      "Twelve lessons cover prompt structure, context files, tool use, grounding, reviews, evaluation, and collaboration. Each lesson connects one model to a bounded exercise.",
    duration: "about 2 hrs",
    unitLabel: "tracks",
    audience: "Knowledge workers, developers, and teams using Claude Code",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
  },
  codex: {
    title: "Codex Course",
    eyebrow: "Technical course · Coding agents",
    tagline:
      "Delegate coding tasks to Codex using specifications, tests, and review.",
    description:
      "Twelve lessons cover sandbox boundaries, AGENTS.md, task specifications, acceptance criteria, tool use, parallel work, and code review. The final case combines the complete workflow.",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
  },
  "data-infrastructure": {
    title: "Data Infrastructure",
    eyebrow: "Technical course · System design",
    tagline:
      "Compare storage, streaming, and consistency decisions systematically.",
    description:
      "Twelve lessons cover CAP and PACELC, data models, file formats, lakehouse tables, streaming, CDC, idempotency, and data SLAs. Simulations expose failure and scaling limits.",
    duration: "about 3 hrs",
    unitLabel: "tracks",
    audience:
      "Senior and staff data engineers, IC5+ candidates, and data platform teams",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
  },
  "data-engineering-fundamentals": {
    title: "Data Engineering Fundamentals",
    eyebrow: "Technical course · Data engineering",
    tagline: "Design a reliable data pipeline from source to consumption.",
    description:
      "Twelve chapters cover ingestion, streaming, storage, compute, orchestration, quality, discovery, serving, and governance. Seventeen simulations and a final case demonstrate common failure chains.",
    duration: "about 90 min",
    unitLabel: "chapters",
    audience: "Data engineers, analytics engineers, and platform teams",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
  },
  "data-science": {
    title: "Data Science Fundamentals",
    eyebrow: "Technical course · Data science",
    tagline:
      "Evaluate models, detect misinterpretation, and monitor production behavior.",
    description:
      "Twelve chapters connect sampling, data cleaning, features, evaluation, interpretability, experiments, causality, and drift. Thirty-seven simulations show how metrics can mislead.",
    duration: "about 2 hrs",
    unitLabel: "chapters",
    audience: "Data scientists, ML engineers, and analysts",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
  },
  "ai-native-operator": {
    title: "The AI-Native Operator",
    eyebrow: "Technical course · Operating model",
    tagline:
      "Organize AI-supported work with ownership, controls, and measurement.",
    description:
      "Nine modules with 39 lessons cover engineering, product work, operations, roles, organization design, data, governance, and measurement. Thirty exercises test concrete decisions instead of terminology recall.",
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
      "The native route plus progress and completion logic are integrated in this source tree; deployment requires separate live verification. Originally imported from an open-source course.",
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
