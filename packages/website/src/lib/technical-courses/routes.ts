import type { Metadata } from "next";
import { CERTIFICATE_QR_VERSION } from "@/lib/course/certificate-constants";
import type { CourseConfig, CourseSlug } from "@/lib/course/types";
import {
  CLAUDE_LESSON_IDS,
  CLAUDE_TRACK_IDS,
  type ClaudeLessonId,
} from "@/lib/claude-course/types";
import {
  CODEX_LESSON_IDS,
  CODEX_TRACK_IDS,
  type LessonId as CodexLessonId,
} from "@/lib/codex/types";
import {
  DATA_INFRA_LESSON_IDS,
  DATA_INFRA_TRACK_IDS,
  type DataInfraLessonId,
} from "@/lib/data-infrastructure/types";
import {
  DEF_CHAPTER_IDS,
  type DefChapterId,
} from "@/lib/data-engineering-fundamentals/types";
import {
  DS_CHAPTER_IDS,
  DS_NUMBERED_CHAPTER_IDS,
  type DsChapterId,
} from "@/lib/data-science/types";
import {
  MODULE_IDS as OPERATOR_MODULE_IDS,
  MODULE_LESSON_COUNTS as OPERATOR_MODULE_LESSON_COUNTS,
  lessonProgressKey as operatorLessonProgressKey,
  type ModuleId as OperatorModuleId,
} from "@/lib/ai-native-operator/types";
import {
  buildLocaleAlternates,
  localizeHref,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/locale";
import { ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

export const TECHNICAL_COURSE_SLUGS = [
  "claude",
  "codex",
  "data-infrastructure",
  "data-engineering-fundamentals",
  "data-science",
  "ai-native-operator",
] as const satisfies readonly CourseSlug[];

export type TechnicalCourseSlug = (typeof TECHNICAL_COURSE_SLUGS)[number];

export function isTechnicalCourseSlug(
  value: unknown,
): value is TechnicalCourseSlug {
  return (
    typeof value === "string" &&
    (TECHNICAL_COURSE_SLUGS as readonly string[]).includes(value)
  );
}

export type TechnicalCourseRouteModel =
  | "flat-reader"
  | "direct-chapters"
  | "overview-and-chapters"
  | "module-lessons";

export type TechnicalCourseAssessment = "quiz" | "completion";

export interface TechnicalCourseRouteContract<
  S extends TechnicalCourseSlug = TechnicalCourseSlug,
> {
  readonly courseSlug: S;
  /** Existing German canonical path. Never contains a locale prefix. */
  readonly basePath: `/kurse/open-source/${S}`;
  /** Existing reader root. May equal basePath for direct chapter courses. */
  readonly readerPath: string;
  readonly routeModel: TechnicalCourseRouteModel;
  readonly assessment: TechnicalCourseAssessment;
  readonly quizPath: string | null;
  readonly certificatePath: string;
  readonly verificationPath: string;
}

const BASE_PATHS = {
  claude: "/kurse/open-source/claude",
  codex: "/kurse/open-source/codex",
  "data-infrastructure": "/kurse/open-source/data-infrastructure",
  "data-engineering-fundamentals":
    "/kurse/open-source/data-engineering-fundamentals",
  "data-science": "/kurse/open-source/data-science",
  "ai-native-operator": "/kurse/open-source/ai-native-operator",
} as const satisfies Record<
  TechnicalCourseSlug,
  `/kurse/open-source/${TechnicalCourseSlug}`
>;

export const TECHNICAL_COURSE_ROUTES = {
  claude: {
    courseSlug: "claude",
    basePath: BASE_PATHS.claude,
    readerPath: `${BASE_PATHS.claude}/kurs`,
    routeModel: "flat-reader",
    assessment: "quiz",
    quizPath: `${BASE_PATHS.claude}/kurs/quiz`,
    certificatePath: `${BASE_PATHS.claude}/kurs/zertifikat`,
    verificationPath: `${BASE_PATHS.claude}/verifizierung`,
  },
  codex: {
    courseSlug: "codex",
    basePath: BASE_PATHS.codex,
    readerPath: `${BASE_PATHS.codex}/kurs`,
    routeModel: "flat-reader",
    assessment: "completion",
    quizPath: null,
    certificatePath: `${BASE_PATHS.codex}/kurs/zertifikat`,
    verificationPath: `${BASE_PATHS.codex}/verifizierung`,
  },
  "data-infrastructure": {
    courseSlug: "data-infrastructure",
    basePath: BASE_PATHS["data-infrastructure"],
    readerPath: `${BASE_PATHS["data-infrastructure"]}/kurs`,
    routeModel: "flat-reader",
    assessment: "completion",
    quizPath: null,
    certificatePath: `${BASE_PATHS["data-infrastructure"]}/kurs/zertifikat`,
    verificationPath: `${BASE_PATHS["data-infrastructure"]}/verifizierung`,
  },
  "data-engineering-fundamentals": {
    courseSlug: "data-engineering-fundamentals",
    basePath: BASE_PATHS["data-engineering-fundamentals"],
    readerPath: BASE_PATHS["data-engineering-fundamentals"],
    routeModel: "direct-chapters",
    assessment: "completion",
    quizPath: null,
    certificatePath: `${BASE_PATHS["data-engineering-fundamentals"]}/zertifikat`,
    verificationPath: `${BASE_PATHS["data-engineering-fundamentals"]}/verifizierung`,
  },
  "data-science": {
    courseSlug: "data-science",
    basePath: BASE_PATHS["data-science"],
    readerPath: BASE_PATHS["data-science"],
    routeModel: "overview-and-chapters",
    assessment: "completion",
    quizPath: null,
    certificatePath: `${BASE_PATHS["data-science"]}/zertifikat`,
    verificationPath: `${BASE_PATHS["data-science"]}/verifizierung`,
  },
  "ai-native-operator": {
    courseSlug: "ai-native-operator",
    basePath: BASE_PATHS["ai-native-operator"],
    readerPath: BASE_PATHS["ai-native-operator"],
    routeModel: "module-lessons",
    assessment: "quiz",
    quizPath: `${BASE_PATHS["ai-native-operator"]}/quiz`,
    certificatePath: `${BASE_PATHS["ai-native-operator"]}/zertifikat`,
    verificationPath: `${BASE_PATHS["ai-native-operator"]}/verifizierung`,
  },
} as const satisfies {
  readonly [S in TechnicalCourseSlug]: TechnicalCourseRouteContract<S>;
};

const OPERATOR_PROGRESS_KEYS = OPERATOR_MODULE_IDS.flatMap((moduleId) =>
  Array.from(
    { length: OPERATOR_MODULE_LESSON_COUNTS[moduleId] },
    (_, index) => operatorLessonProgressKey(moduleId, index + 1),
  ),
);

/**
 * Locale-independent machine identity. Visible titles, descriptions, and
 * labels never belong here.
 */
export const TECHNICAL_COURSE_CANONICAL_IDS = {
  claude: {
    unitIds: CLAUDE_TRACK_IDS,
    contentItemIds: CLAUDE_LESSON_IDS,
    progressKeys: CLAUDE_LESSON_IDS,
  },
  codex: {
    unitIds: CODEX_TRACK_IDS,
    contentItemIds: CODEX_LESSON_IDS,
    progressKeys: CODEX_LESSON_IDS,
  },
  "data-infrastructure": {
    unitIds: DATA_INFRA_TRACK_IDS,
    contentItemIds: DATA_INFRA_LESSON_IDS,
    progressKeys: DATA_INFRA_LESSON_IDS,
  },
  "data-engineering-fundamentals": {
    unitIds: [] as const,
    contentItemIds: DEF_CHAPTER_IDS,
    progressKeys: DEF_CHAPTER_IDS,
  },
  "data-science": {
    unitIds: [] as const,
    contentItemIds: DS_CHAPTER_IDS,
    // The overview is routed at the course root and is not a completion key.
    progressKeys: DS_NUMBERED_CHAPTER_IDS,
  },
  "ai-native-operator": {
    unitIds: OPERATOR_MODULE_IDS,
    contentItemIds: OPERATOR_PROGRESS_KEYS,
    progressKeys: OPERATOR_PROGRESS_KEYS,
  },
} as const satisfies Readonly<
  Record<
    TechnicalCourseSlug,
    {
      readonly unitIds: readonly string[];
      readonly contentItemIds: readonly string[];
      readonly progressKeys: readonly string[];
    }
  >
>;

type CertificateHash = `#${string}`;

type SharedRouteTarget =
  | { readonly kind: "landing" }
  | { readonly kind: "reader" }
  | { readonly kind: "certificate" }
  | { readonly kind: "verification"; readonly hash?: CertificateHash };

export interface TechnicalCourseRouteTargetMap {
  readonly claude:
    | SharedRouteTarget
    | { readonly kind: "lesson"; readonly lessonId: ClaudeLessonId }
    | { readonly kind: "quiz" };
  readonly codex:
    | SharedRouteTarget
    | { readonly kind: "lesson"; readonly lessonId: CodexLessonId };
  readonly "data-infrastructure":
    | SharedRouteTarget
    | { readonly kind: "lesson"; readonly lessonId: DataInfraLessonId };
  readonly "data-engineering-fundamentals":
    | SharedRouteTarget
    | { readonly kind: "chapter"; readonly chapterId: DefChapterId };
  readonly "data-science":
    | SharedRouteTarget
    | { readonly kind: "chapter"; readonly chapterId: DsChapterId };
  readonly "ai-native-operator":
    | SharedRouteTarget
    | { readonly kind: "module"; readonly moduleId: OperatorModuleId }
    | {
        readonly kind: "lesson";
        readonly moduleId: OperatorModuleId;
        readonly lessonNumber: number;
      }
    | { readonly kind: "quiz" };
}

export type TechnicalCourseRouteTarget<S extends TechnicalCourseSlug> =
  TechnicalCourseRouteTargetMap[S];

interface RuntimeRouteTarget {
  readonly kind: string;
  readonly lessonId?: string;
  readonly chapterId?: string;
  readonly moduleId?: string;
  readonly lessonNumber?: number;
  readonly hash?: string;
}

function validatedCertificateHash(hash: string | undefined): string {
  if (hash === undefined) return "";
  if (!/^#[A-Za-z0-9_-]{1,4096}$/.test(hash)) {
    throw new Error(
      "Certificate verification hash must be a bounded base64url fragment.",
    );
  }
  return hash;
}

function includesIdentity(
  identities: readonly string[],
  value: string,
): boolean {
  return identities.includes(value);
}

/**
 * Return an existing route without a locale prefix. Invalid route identities
 * throw instead of degrading to a different lesson or course root.
 */
export function technicalCourseCanonicalHref<
  S extends TechnicalCourseSlug,
>(
  courseSlug: S,
  target: TechnicalCourseRouteTarget<S>,
): string {
  const contract = TECHNICAL_COURSE_ROUTES[courseSlug];
  const routeTarget = target as RuntimeRouteTarget;

  switch (routeTarget.kind) {
    case "landing":
      return contract.basePath;
    case "reader":
      return contract.readerPath;
    case "certificate":
      return contract.certificatePath;
    case "verification":
      return `${contract.verificationPath}${validatedCertificateHash(routeTarget.hash)}`;
    case "quiz":
      if (contract.quizPath === null) {
        throw new Error(`Course "${courseSlug}" has no final quiz route.`);
      }
      return contract.quizPath;
    case "lesson": {
      if (contract.routeModel === "module-lessons") {
        if (
          !routeTarget.moduleId ||
          !Number.isSafeInteger(routeTarget.lessonNumber) ||
          (routeTarget.lessonNumber ?? 0) < 1
        ) {
          throw new Error(`Invalid lesson identity for course "${courseSlug}".`);
        }
        const progressKey = `${routeTarget.moduleId}/${routeTarget.lessonNumber}`;
        if (!includesIdentity(
          TECHNICAL_COURSE_CANONICAL_IDS[courseSlug].contentItemIds,
          progressKey,
        )) {
          throw new Error(`Unknown lesson identity for course "${courseSlug}".`);
        }
        return `${contract.basePath}/${routeTarget.moduleId}/${routeTarget.lessonNumber}`;
      }
      if (contract.routeModel !== "flat-reader" || !routeTarget.lessonId) {
        throw new Error(`Invalid lesson target for course "${courseSlug}".`);
      }
      if (!includesIdentity(
        TECHNICAL_COURSE_CANONICAL_IDS[courseSlug].contentItemIds,
        routeTarget.lessonId,
      )) {
        throw new Error(`Unknown lesson identity for course "${courseSlug}".`);
      }
      return `${contract.readerPath}/${routeTarget.lessonId}`;
    }
    case "chapter":
      if (!routeTarget.chapterId) {
        throw new Error(`Invalid chapter identity for course "${courseSlug}".`);
      }
      if (
        contract.routeModel === "overview-and-chapters" &&
        routeTarget.chapterId === "home"
      ) {
        return contract.basePath;
      }
      if (
        contract.routeModel !== "overview-and-chapters" &&
        contract.routeModel !== "direct-chapters"
      ) {
        throw new Error(`Invalid chapter target for course "${courseSlug}".`);
      }
      if (!includesIdentity(
        TECHNICAL_COURSE_CANONICAL_IDS[courseSlug].contentItemIds,
        routeTarget.chapterId,
      )) {
        throw new Error(`Unknown chapter identity for course "${courseSlug}".`);
      }
      return `${contract.basePath}/${routeTarget.chapterId}`;
    case "module":
      if (contract.routeModel !== "module-lessons" || !routeTarget.moduleId) {
        throw new Error(`Invalid module target for course "${courseSlug}".`);
      }
      if (!includesIdentity(
        TECHNICAL_COURSE_CANONICAL_IDS[courseSlug].unitIds,
        routeTarget.moduleId,
      )) {
        throw new Error(`Unknown module identity for course "${courseSlug}".`);
      }
      return `${contract.basePath}/${routeTarget.moduleId}`;
    default:
      throw new Error(`Unknown route target for course "${courseSlug}".`);
  }
}

/** German stays unprefixed; English is the same stable route under `/en`. */
export function technicalCourseHref<S extends TechnicalCourseSlug>(
  courseSlug: S,
  locale: Locale,
  target: TechnicalCourseRouteTarget<S>,
): string {
  return localizeHref(technicalCourseCanonicalHref(courseSlug, target), locale);
}

export function technicalCourseBaseHref(
  courseSlug: TechnicalCourseSlug,
  locale: Locale,
): string {
  return technicalCourseHref(courseSlug, locale, { kind: "landing" });
}

export interface TechnicalCourseStaticParamsMap {
  readonly claude: readonly { readonly lessonId: ClaudeLessonId }[];
  readonly codex: readonly { readonly lessonId: CodexLessonId }[];
  readonly "data-infrastructure": readonly {
    readonly lessonId: DataInfraLessonId;
  }[];
  readonly "data-engineering-fundamentals": readonly {
    readonly chapterId: DefChapterId;
  }[];
  readonly "data-science": readonly {
    readonly chapterSlug: Exclude<DsChapterId, "home">;
  }[];
  readonly "ai-native-operator": readonly {
    readonly moduleId: OperatorModuleId;
    readonly lessonNum: string;
  }[];
}

/** Static params are derived from canonical IDs, never translated content. */
export function getTechnicalCourseStaticParams<S extends TechnicalCourseSlug>(
  courseSlug: S,
): TechnicalCourseStaticParamsMap[S] {
  let params: readonly Readonly<Record<string, string>>[];
  switch (courseSlug) {
    case "claude":
      params = CLAUDE_LESSON_IDS.map((lessonId) => ({ lessonId }));
      break;
    case "codex":
      params = CODEX_LESSON_IDS.map((lessonId) => ({ lessonId }));
      break;
    case "data-infrastructure":
      params = DATA_INFRA_LESSON_IDS.map((lessonId) => ({ lessonId }));
      break;
    case "data-engineering-fundamentals":
      params = DEF_CHAPTER_IDS.map((chapterId) => ({ chapterId }));
      break;
    case "data-science":
      params = DS_NUMBERED_CHAPTER_IDS.map((chapterSlug) => ({ chapterSlug }));
      break;
    case "ai-native-operator":
      params = OPERATOR_MODULE_IDS.flatMap((moduleId) =>
        Array.from(
          { length: OPERATOR_MODULE_LESSON_COUNTS[moduleId] },
          (_, index) => ({ moduleId, lessonNum: String(index + 1) }),
        ),
      );
      break;
  }
  return params as TechnicalCourseStaticParamsMap[S];
}

export type TechnicalCourseConfigCopy = Pick<
  CourseConfig,
  | "title"
  | "certificateTitle"
  | "certificateSubtitle"
  | "certificateModules"
  | "certificateReferenceLabel"
  | "quizPassMessage"
  | "certificateFileStem"
  | "recordNoun"
>;

export type LocalizedTechnicalCourseConfig<
  S extends TechnicalCourseSlug,
  L extends Locale,
> = CourseConfig & { readonly slug: S; readonly language: L };

/**
 * Translate visible config copy while inheriting every route, assessment, and
 * certificate-payload field from the canonical English config.
 */
export function createLocalizedTechnicalCourseConfig<
  S extends TechnicalCourseSlug,
  L extends Locale,
>(
  canonical: CourseConfig & { readonly slug: S },
  locale: L,
  copy: TechnicalCourseConfigCopy,
): LocalizedTechnicalCourseConfig<S, L> {
  assertTechnicalCourseConfigRouteIdentity(canonical);
  return {
    ...canonical,
    title: copy.title,
    certificateTitle: copy.certificateTitle,
    certificateSubtitle: copy.certificateSubtitle,
    certificateModules: copy.certificateModules,
    certificateReferenceLabel: copy.certificateReferenceLabel,
    quizPassMessage: copy.quizPassMessage,
    certificateFileStem: copy.certificateFileStem,
    recordNoun: copy.recordNoun,
    language: locale,
  };
}

export function assertTechnicalCourseConfigRouteIdentity(
  config: CourseConfig,
): asserts config is CourseConfig & { readonly slug: TechnicalCourseSlug } {
  if (!isTechnicalCourseSlug(config.slug)) {
    throw new Error(`Course "${config.slug}" is not a technical course.`);
  }
  const contract = TECHNICAL_COURSE_ROUTES[config.slug];
  if (
    config.basePath !== contract.basePath ||
    config.coursePath !== contract.readerPath
  ) {
    throw new Error(
      `Course "${config.slug}" changed its stable basePath or coursePath.`,
    );
  }
}

export function assertTechnicalCourseConfigParity(
  canonical: CourseConfig,
  localized: CourseConfig,
): void {
  assertTechnicalCourseConfigRouteIdentity(canonical);
  assertTechnicalCourseConfigRouteIdentity(localized);
  const canonicalIdentity = {
    slug: canonical.slug,
    basePath: canonical.basePath,
    coursePath: canonical.coursePath,
    blockIds: canonical.blockIds,
    questionCount: canonical.workshopQuizQuestionCount,
    timeLimit: canonical.workshopQuizTimeLimitMinutes,
    passThreshold: canonical.workshopQuizPassThreshold,
  };
  const localizedIdentity = {
    slug: localized.slug,
    basePath: localized.basePath,
    coursePath: localized.coursePath,
    blockIds: localized.blockIds,
    questionCount: localized.workshopQuizQuestionCount,
    timeLimit: localized.workshopQuizTimeLimitMinutes,
    passThreshold: localized.workshopQuizPassThreshold,
  };
  if (JSON.stringify(canonicalIdentity) !== JSON.stringify(localizedIdentity)) {
    throw new Error(
      `Localized config for "${canonical.slug}" changed route or assessment identity.`,
    );
  }
}

function withoutHash(pathname: string): string {
  return pathname.split("#", 1)[0] ?? pathname;
}

export interface TechnicalCourseMetadataInput<S extends TechnicalCourseSlug> {
  readonly courseSlug: S;
  readonly locale: Locale;
  readonly target: TechnicalCourseRouteTarget<S>;
  readonly title: string;
  readonly description: string;
  /** Pass the central, separately reviewed SEO parity result for this path. */
  readonly availableContentLocales: readonly Locale[];
}

/**
 * Metadata stays fail closed: readers and records are always noindex; an
 * English landing is noindex until the caller supplies reviewed English
 * route parity. This helper does not mutate the central parity registry.
 */
export function buildTechnicalCourseMetadata<S extends TechnicalCourseSlug>({
  courseSlug,
  locale,
  target,
  title,
  description,
  availableContentLocales,
}: TechnicalCourseMetadataInput<S>): Metadata {
  if (!availableContentLocales.includes("de")) {
    throw new Error(
      `Course "${courseSlug}" metadata cannot claim a locale set without German canonical content.`,
    );
  }
  const canonicalPath = withoutHash(
    technicalCourseCanonicalHref(courseSlug, target),
  );
  const localizedPath = localizeHref(canonicalPath, locale);
  const publicLanding = (target as RuntimeRouteTarget).kind === "landing";
  const localeIsReviewed = availableContentLocales.includes(locale);
  const shouldIndex = publicLanding && localeIsReviewed;
  const alternates = buildLocaleAlternates(
    canonicalPath,
    availableContentLocales,
  );

  return {
    title,
    description,
    robots: { index: shouldIndex, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${localizedPath}`,
      type: publicLanding ? "website" : "article",
      locale: locale === "de" ? "de_DE" : "en_GB",
    },
  };
}

export interface TechnicalCourseJsonLdInput<S extends TechnicalCourseSlug> {
  readonly courseSlug: S;
  readonly locale: Locale;
  readonly name: string;
  readonly description: string;
  readonly teaches: readonly string[];
  readonly timeRequired?: string;
}

/** Stable entity identity with a locale-specific public URL and language. */
export function buildTechnicalCourseJsonLd<S extends TechnicalCourseSlug>({
  courseSlug,
  locale,
  name,
  description,
  teaches,
  timeRequired,
}: TechnicalCourseJsonLdInput<S>) {
  const canonicalBasePath = TECHNICAL_COURSE_ROUTES[courseSlug].basePath;
  return {
    "@context": "https://schema.org" as const,
    "@type": "Course" as const,
    "@id": `${SITE_URL}${canonicalBasePath}#course`,
    identifier: courseSlug,
    name,
    description,
    url: `${SITE_URL}${localizeHref(canonicalBasePath, locale)}`,
    inLanguage: locale === "de" ? "de-DE" : "en-GB",
    isAccessibleForFree: true,
    provider: { "@id": ORG_ID },
    teaches,
    ...(timeRequired ? { timeRequired } : {}),
  };
}

export const TECHNICAL_CERTIFICATE_IDENTITY = Object.fromEntries(
  TECHNICAL_COURSE_SLUGS.map((courseSlug) => [
    courseSlug,
    Object.freeze({
      courseSlug,
      qrVersion: CERTIFICATE_QR_VERSION,
      verificationPath: TECHNICAL_COURSE_ROUTES[courseSlug].verificationPath,
    }),
  ]),
) as Readonly<
  Record<
    TechnicalCourseSlug,
    {
      readonly courseSlug: TechnicalCourseSlug;
      readonly qrVersion: typeof CERTIFICATE_QR_VERSION;
      readonly verificationPath: string;
    }
  >
>;

export function hasCompleteTechnicalLocaleSet(
  locales: readonly Locale[],
): boolean {
  return SUPPORTED_LOCALES.every((locale) => locales.includes(locale));
}
