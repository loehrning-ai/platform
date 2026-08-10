import type { CourseConfig } from "@/lib/course/types";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import {
  TECHNICAL_CERTIFICATE_IDENTITY,
  TECHNICAL_COURSE_CANONICAL_IDS,
  assertTechnicalCourseConfigParity,
  assertTechnicalCourseConfigRouteIdentity,
  type LocalizedTechnicalCourseConfig,
  type TechnicalCourseSlug,
} from "./routes";

export interface TechnicalQuizOptionIdentity {
  readonly id: string;
  readonly isCorrect: boolean;
}

export interface TechnicalQuizQuestionIdentity {
  readonly id: string;
  readonly answerOptions: readonly TechnicalQuizOptionIdentity[];
}

export interface TechnicalCourseContentIdentity<
  S extends TechnicalCourseSlug = TechnicalCourseSlug,
> {
  readonly courseSlug: S;
  readonly unitIds: readonly string[];
  /** Every authored lesson/chapter, including a non-progress overview. */
  readonly contentItemIds: readonly string[];
  /** Exact keys written into `UnifiedProgress.courses[slug].lessons`. */
  readonly progressKeys: readonly string[];
  readonly sectionIdsByProgressKey: Readonly<
    Record<string, readonly string[]>
  >;
  readonly workshopQuestions: readonly TechnicalQuizQuestionIdentity[];
  /** Globally scoped `${lessonId}::${cpId}` checkpoint-ledger identities. */
  readonly checkpointKeys: readonly string[];
  readonly certificate: {
    readonly courseSlug: S;
    readonly qrVersion: number;
    readonly verificationPath: string;
  };
}

export type TechnicalCourseContentIdentityInput<
  S extends TechnicalCourseSlug,
> = Omit<TechnicalCourseContentIdentity<S>, "courseSlug" | "certificate">;

function assertUniqueStrings(
  values: readonly string[],
  field: string,
  courseSlug: TechnicalCourseSlug,
): void {
  if (
    values.some((value) => value.length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(
      `Course "${courseSlug}" has empty or duplicate ${field} identities.`,
    );
  }
}

function sameStrings(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function normalizeSections(
  courseSlug: TechnicalCourseSlug,
  progressKeys: readonly string[],
  sectionsByProgressKey: Readonly<Record<string, readonly string[]>>,
): Readonly<Record<string, readonly string[]>> {
  const suppliedKeys = Object.keys(sectionsByProgressKey);
  if (!sameStrings(suppliedKeys, progressKeys)) {
    throw new Error(
      `Course "${courseSlug}" section registry must contain every progress key in canonical order.`,
    );
  }

  return Object.fromEntries(
    progressKeys.map((progressKey) => {
      const sectionIds = sectionsByProgressKey[progressKey];
      if (!sectionIds) {
        throw new Error(
          `Course "${courseSlug}" has no section registry for "${progressKey}".`,
        );
      }
      assertUniqueStrings(sectionIds, `section IDs for "${progressKey}"`, courseSlug);
      return [progressKey, Object.freeze([...sectionIds])];
    }),
  );
}

function normalizeQuestionIdentity(
  courseSlug: TechnicalCourseSlug,
  questions: readonly TechnicalQuizQuestionIdentity[],
): readonly TechnicalQuizQuestionIdentity[] {
  assertUniqueStrings(
    questions.map(({ id }) => id),
    "workshop-question IDs",
    courseSlug,
  );
  return questions.map((question) => {
    assertUniqueStrings(
      question.answerOptions.map(({ id }) => id),
      `answer-option IDs for question "${question.id}"`,
      courseSlug,
    );
    return Object.freeze({
      id: question.id,
      answerOptions: Object.freeze(
        question.answerOptions.map((option) =>
          Object.freeze({ id: option.id, isCorrect: option.isCorrect }),
        ),
      ),
    });
  });
}

/**
 * Build the machine identity extracted from one locale's real content. Any
 * renamed or reordered course/unit/progress identifier fails immediately.
 */
export function defineTechnicalCourseContentIdentity<
  S extends TechnicalCourseSlug,
>(
  courseSlug: S,
  input: TechnicalCourseContentIdentityInput<S>,
): TechnicalCourseContentIdentity<S> {
  const canonical = TECHNICAL_COURSE_CANONICAL_IDS[courseSlug];
  if (!sameStrings(input.unitIds, canonical.unitIds)) {
    throw new Error(`Course "${courseSlug}" changed canonical unit IDs.`);
  }
  if (!sameStrings(input.contentItemIds, canonical.contentItemIds)) {
    throw new Error(`Course "${courseSlug}" changed canonical content IDs.`);
  }
  if (!sameStrings(input.progressKeys, canonical.progressKeys)) {
    throw new Error(`Course "${courseSlug}" changed canonical progress keys.`);
  }

  assertUniqueStrings(input.unitIds, "unit IDs", courseSlug);
  assertUniqueStrings(input.contentItemIds, "content IDs", courseSlug);
  assertUniqueStrings(input.progressKeys, "progress keys", courseSlug);
  assertUniqueStrings(input.checkpointKeys, "checkpoint keys", courseSlug);

  return Object.freeze({
    courseSlug,
    unitIds: Object.freeze([...input.unitIds]),
    contentItemIds: Object.freeze([...input.contentItemIds]),
    progressKeys: Object.freeze([...input.progressKeys]),
    sectionIdsByProgressKey: Object.freeze(
      normalizeSections(
        courseSlug,
        input.progressKeys,
        input.sectionIdsByProgressKey,
      ),
    ),
    workshopQuestions: Object.freeze(
      normalizeQuestionIdentity(courseSlug, input.workshopQuestions),
    ),
    checkpointKeys: Object.freeze([...input.checkpointKeys]),
    certificate: TECHNICAL_CERTIFICATE_IDENTITY[courseSlug] as {
      readonly courseSlug: S;
      readonly qrVersion: number;
      readonly verificationPath: string;
    },
  });
}

export function assertTechnicalCourseContentIdentityParity<
  S extends TechnicalCourseSlug,
>(
  canonical: TechnicalCourseContentIdentity<S>,
  localized: TechnicalCourseContentIdentity<S>,
): void {
  if (JSON.stringify(canonical) !== JSON.stringify(localized)) {
    throw new Error(
      `Localized content for "${canonical.courseSlug}" changed machine identity.`,
    );
  }
}

export interface TechnicalCourseLocaleBundle<
  S extends TechnicalCourseSlug,
  L extends Locale,
  Content,
> {
  readonly courseSlug: S;
  readonly locale: L;
  readonly config: LocalizedTechnicalCourseConfig<S, L>;
  readonly identity: TechnicalCourseContentIdentity<S>;
  /** Course-specific typed content/loaders. The architecture never inspects prose. */
  readonly content: Content;
}

export function defineTechnicalCourseLocaleBundle<
  S extends TechnicalCourseSlug,
  L extends Locale,
  Content,
>(
  bundle: TechnicalCourseLocaleBundle<S, L, Content>,
): TechnicalCourseLocaleBundle<S, L, Content> {
  if (bundle.config.slug !== bundle.courseSlug) {
    throw new Error(
      `Locale bundle slug "${bundle.courseSlug}" does not match its config.`,
    );
  }
  if (bundle.config.language !== bundle.locale) {
    throw new Error(
      `Locale bundle "${bundle.courseSlug}" registered config language "${bundle.config.language}" under "${bundle.locale}".`,
    );
  }
  if (bundle.identity.courseSlug !== bundle.courseSlug) {
    throw new Error(
      `Locale bundle "${bundle.courseSlug}" carries another course's identity.`,
    );
  }
  assertTechnicalCourseConfigRouteIdentity(bundle.config);
  return Object.freeze(bundle);
}

export type TechnicalCourseLocaleBundleMap<
  S extends TechnicalCourseSlug,
  Content,
> = {
  readonly [L in Locale]?: TechnicalCourseLocaleBundle<S, L, Content>;
};

export interface TechnicalCourseLocaleRegistry<
  S extends TechnicalCourseSlug,
  Content,
> {
  readonly courseSlug: S;
  readonly sourceLocale: Locale;
  readonly availableLocales: readonly Locale[];
  readonly has: (locale: Locale) => boolean;
  readonly get: <L extends Locale>(
    locale: L,
  ) => TechnicalCourseLocaleBundle<S, L, Content>;
}

/**
 * Create one course registry. Missing locales throw; no source-language or
 * default-locale fallback exists. Every registered locale is compared against
 * the source bundle's complete structural identity.
 */
export function createTechnicalCourseLocaleRegistry<
  S extends TechnicalCourseSlug,
  Content,
>({
  courseSlug,
  sourceLocale,
  bundles,
}: {
  readonly courseSlug: S;
  readonly sourceLocale: Locale;
  readonly bundles: TechnicalCourseLocaleBundleMap<S, Content>;
}): TechnicalCourseLocaleRegistry<S, Content> {
  const source = bundles[sourceLocale];
  if (!source) {
    throw new Error(
      `Course "${courseSlug}" has no canonical "${sourceLocale}" source bundle.`,
    );
  }

  const availableLocales = SUPPORTED_LOCALES.filter((locale) => {
    const bundle = bundles[locale];
    if (!bundle) return false;
    if (bundle.courseSlug !== courseSlug || bundle.locale !== locale) {
      throw new Error(
        `Course "${courseSlug}" has a bundle registered under the wrong locale or slug.`,
      );
    }
    assertTechnicalCourseConfigParity(source.config, bundle.config);
    assertTechnicalCourseContentIdentityParity(source.identity, bundle.identity);
    return true;
  });

  const get = <L extends Locale>(
    locale: L,
  ): TechnicalCourseLocaleBundle<S, L, Content> => {
    const bundle = bundles[locale];
    if (!bundle) {
      throw new Error(
        `Course "${courseSlug}" has no audited "${locale}" locale bundle.`,
      );
    }
    return bundle as TechnicalCourseLocaleBundle<S, L, Content>;
  };

  return Object.freeze({
    courseSlug,
    sourceLocale,
    availableLocales: Object.freeze(availableLocales),
    has: (locale: Locale) => bundles[locale] !== undefined,
    get,
  });
}

/** Narrow helper for config objects whose literal slug type was widened. */
export function technicalCourseConfigForBundle<
  S extends TechnicalCourseSlug,
  L extends Locale,
>(
  courseSlug: S,
  locale: L,
  config: CourseConfig,
): LocalizedTechnicalCourseConfig<S, L> {
  assertTechnicalCourseConfigRouteIdentity(config);
  if (config.slug !== courseSlug) {
    throw new Error(
      `Expected config for "${courseSlug}", received "${config.slug}".`,
    );
  }
  if (config.language !== locale) {
    throw new Error(
      `Expected "${locale}" config for "${courseSlug}", received "${config.language}".`,
    );
  }
  return config as LocalizedTechnicalCourseConfig<S, L>;
}
