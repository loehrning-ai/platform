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
    title: "Everyday AI Literacy",
    eyebrow: "Step 01 · AI literacy",
    tagline: "Classify data, brief checkably, catch errors.",
    description:
      "Eight short hands-on lessons: classify and redact data, write checkable briefs, check AI drafts against sources and build a one-page team policy. The course briefly places Article 4 of the AI Act in the version in force since 27 July 2026; at the end you create a certificate of participation locally.",
    duration: "about 45 min",
    unitLabel: "modules",
    audience: "People who use AI in their day-to-day work",
    coverImageAlt:
      "Editorial collage of an AI review passport with learning cards, data protection, and verification steps",
  },
  "ki-und-gesellschaft": {
    title: "AI and Society",
    eyebrow: "Step 02 · Society",
    tagline: "Examine deepfakes, bias, and effects on work through examples.",
    description:
      "Three units on the job market, deepfakes and bias. For every claim you see its source, who benefits from it and how certain the finding is.",
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
      "You sort a use case into its class: prohibited, transparency-bound, general-purpose, high-risk, or none. Every statement with a deadline names its legal date and primary source. The course does not replace legal advice.",
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
      "Four modules on repeatable workflows for research, documentation and automation. Every exercise names its tool, input, review step and stopping condition.",
    duration: "about 5 hrs of lessons, 12 hrs with exercises",
    unitLabel: "modules",
    audience: "Employees, independent professionals, students",
    coverImageAlt:
      "Editorial illustration of a modular AI-native studio with context, tools, and a review loop",
  },
  "data-infrastructure": {
    title: "Data Infrastructure",
    eyebrow: "Visual learning · System design",
    tagline: "Compare storage, streaming, and consistency decisions.",
    description:
      "Twelve lessons on CAP and PACELC, data models, file formats, lakehouse tables, streaming, CDC, idempotency and data SLAs. Simulations show at which load or failure a design stops holding.",
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
      "Route, progress and completion ship in this source tree; deployment needs separate live verification. Originally an imported open-source course.",
  },
  "data-engineering-fundamentals": {
    title: "Data Engineering Fundamentals",
    eyebrow: "Visual learning · Data engineering",
    tagline: "Design and safeguard a data pipeline from source to consumption.",
    description:
      "Twelve chapters on ingestion, streaming, storage, compute, orchestration, quality, discovery, serving and governance. In 17 simulations and a final case you see how an error causes damage further down.",
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
      "Route, progress and completion ship in this source tree; deployment needs separate live verification. Originally an imported open-source course.",
  },
  "data-science": {
    title: "Data Science Fundamentals",
    eyebrow: "Visual learning · Data science",
    tagline: "Evaluate models, spot misreadings, monitor production behavior.",
    description:
      "Twelve chapters on sampling, data cleaning, features, evaluation, interpretability, experiments, causality and drift. Thirty-seven simulations show where a good-looking metric misleads.",
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
      "Route, progress and completion ship in this source tree; deployment needs separate live verification. Originally an imported open-source course.",
  },
  "ai-native-operator": {
    title: "The AI-Native Operator",
    eyebrow: "Visual learning · Operating model",
    tagline:
      "Organize AI-supported work with ownership, controls, and measurement.",
    description:
      "Nine modules with 39 lessons on engineering, product work, operations, roles, organization design, data, governance and measurement. In 30 exercises you set who decides and reviews AI-supported work.",
    duration: "about 4 hrs",
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
      "Route, progress and completion ship in this source tree; deployment needs separate live verification. Originally an imported open-source course.",
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
