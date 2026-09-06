/**
 * Machine-readable course records.
 *
 * One derivation of the course catalog for every machine consumer: the
 * `/api/courses.json` surface and the agent tools that answer "which courses
 * exist" and "what is this course". Each field comes from a canonical
 * registry, never from a second catalog kept here:
 *
 *   - src/lib/courses/catalog.ts       structure, counts, hrefs, provenance
 *   - src/lib/courses/catalog-copy.ts  reviewed English copy, level labels
 *   - src/lib/auth/routes.ts           whether the reader needs a login
 *   - src/lib/i18n/content-parity.ts   which locales really have a page
 *   - src/lib/learning-graph           stage, level, evidence mode, access
 *
 * Adding or changing a course means editing the catalog. Nothing here.
 */

import { isProtectedPlatformPath } from "@/lib/auth/routes";
import {
  COURSE_CATALOG,
  PORTED_COURSE_CATALOG,
  type CatalogCourse,
  type CourseLevel,
} from "@/lib/courses/catalog";
import {
  COURSE_LEVEL_LABELS_BY_LOCALE,
  localizeCatalogCourse,
} from "@/lib/courses/catalog-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { absoluteUrl } from "@/lib/seo/entity";
import {
  absoluteLocalizedUrl,
  machineSurfaceEnvelope,
  type MachineSurfaceEnvelope,
} from "./envelope";
import { machineGraphFacet, type MachineGraphFacet } from "./graph";

const COURSES_SURFACE_NAME = "courses";
const COURSES_PAGE_PATH = "/api/courses.json";
const COURSE_HUB_PATH = "/kurse";

/** Provenance of a course ported from a pinned open-source commit. */
export interface MachineCourseSource {
  readonly repository_url: string;
  readonly commit: string;
  readonly commit_url: string;
  readonly license_url: string;
  readonly license_sha256: string;
  /** The upstream course as it still runs outside this platform. */
  readonly launch_url: string;
}

/** A course as one locale publishes it. Also the agent tools' return shape. */
export interface MachineCourse {
  readonly slug: string;
  readonly locale: Locale;
  /** Position in the recommended learning path, 1-based. */
  readonly step: number;
  readonly title: string;
  readonly eyebrow: string;
  readonly tagline: string;
  readonly description: string;
  readonly audience: string;
  readonly level: CourseLevel;
  readonly level_label: string;
  readonly duration: string;
  readonly duration_minutes: number;
  readonly lesson_count: number;
  readonly unit_label: string;
  readonly unit_count: number;
  readonly topics: readonly string[];
  /** Language label of the course material itself, when the catalog states one. */
  readonly material_language: string | null;
  readonly url: string;
  readonly start_url: string;
  readonly requires_login: boolean;
  readonly available_locales: readonly Locale[];
  readonly graph: MachineGraphFacet | null;
  readonly source: MachineCourseSource | null;
}

/** One course across every locale that has a reviewed page. */
export interface MachineCourseCatalogEntry {
  readonly slug: string;
  readonly step: number;
  readonly available_locales: readonly Locale[];
  readonly localized: Readonly<Partial<Record<Locale, MachineCourse>>>;
}

export interface MachineCourseCatalogPayload extends MachineSurfaceEnvelope {
  readonly catalog_url: string;
  readonly locales: readonly Locale[];
  readonly courses: readonly MachineCourseCatalogEntry[];
}

const PORTED_COURSES_BY_SLUG = new Map(
  PORTED_COURSE_CATALOG.map((course) => [course.slug as string, course]),
);

/**
 * Provenance for the courses that entered the catalog from a pinned
 * open-source commit. PORTED_COURSE_CATALOG is the catalog's own definition of
 * "has complete provenance", so no field is guessed at here.
 */
function courseSource(slug: string): MachineCourseSource | null {
  const ported = PORTED_COURSES_BY_SLUG.get(slug);
  if (!ported) return null;

  return {
    repository_url: ported.sourceHref,
    commit: ported.sourceCommit,
    commit_url: ported.sourceCommitHref,
    license_url: absoluteUrl(ported.licenseHref),
    license_sha256: ported.licenseSha256,
    launch_url: ported.launchHref,
  };
}

function machineCourse(course: CatalogCourse, locale: Locale): MachineCourse {
  const localized = localizeCatalogCourse(course, locale);

  return {
    slug: course.slug,
    locale,
    step: course.step,
    title: localized.title,
    eyebrow: localized.eyebrow,
    tagline: localized.tagline,
    description: localized.description,
    audience: localized.audience,
    level: course.level,
    level_label: COURSE_LEVEL_LABELS_BY_LOCALE[locale][course.level],
    duration: localized.duration,
    duration_minutes: course.durationMinutes,
    lesson_count: course.totalLessons,
    unit_label: localized.unitLabel,
    unit_count: course.unitCount,
    topics: localized.topics ?? [],
    material_language: localized.language ?? null,
    url: absoluteLocalizedUrl(course.href, locale),
    start_url: absoluteLocalizedUrl(course.startHref, locale),
    // The four certified courses gate their reader; every other course is
    // readable without an account. The crawl contract decides, not this file.
    requires_login: isProtectedPlatformPath(course.startHref),
    available_locales: contentLocalesForPath(course.href),
    graph: machineGraphFacet(`course:${course.slug}`),
    source: courseSource(course.slug),
  };
}

/** Every catalog course in one locale, in learning-path order. */
export function listMachineCourses(locale: Locale): readonly MachineCourse[] {
  return COURSE_CATALOG.map((course) => machineCourse(course, locale));
}

/** One course in one locale, or null when the slug is not in the catalog. */
export function getMachineCourse(
  slug: string,
  locale: Locale,
): MachineCourse | null {
  const course = COURSE_CATALOG.find((entry) => entry.slug === slug);
  return course ? machineCourse(course, locale) : null;
}

/** Slugs a machine consumer may address, in learning-path order. */
export function listMachineCourseSlugs(): readonly string[] {
  return COURSE_CATALOG.map((course) => course.slug);
}

function catalogEntry(course: CatalogCourse): MachineCourseCatalogEntry {
  const locales = contentLocalesForPath(course.href);

  return {
    slug: course.slug,
    step: course.step,
    available_locales: locales,
    localized: Object.fromEntries(
      locales.map((locale) => [locale, machineCourse(course, locale)]),
    ),
  };
}

/** The complete `/api/courses.json` payload. */
export function buildMachineCourseCatalog(): MachineCourseCatalogPayload {
  return {
    ...machineSurfaceEnvelope({
      name: COURSES_SURFACE_NAME,
      pagePath: COURSES_PAGE_PATH,
      count: COURSE_CATALOG.length,
    }),
    catalog_url: absoluteUrl(COURSE_HUB_PATH),
    locales: SUPPORTED_LOCALES,
    courses: COURSE_CATALOG.map(catalogEntry),
  };
}
