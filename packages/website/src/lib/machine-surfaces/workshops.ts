/**
 * Machine-readable workshop records, including the materials manifest.
 *
 * One derivation of the workshop catalog for every machine consumer: the
 * `/api/workshops.json` surface and the agent tools that answer "which
 * workshops exist" and "what does this workshop hand me". Each field comes
 * from a canonical registry, never from a second catalog kept here:
 *
 *   - src/lib/workshops.ts             both locales, steps, cases, materials
 *   - src/lib/auth/routes.ts           whether the page needs a login
 *   - src/lib/i18n/content-parity.ts   which locales really have a page
 *   - src/lib/learning-graph           stage, level, evidence mode, access
 *
 * The manifest lists every downloadable file a workshop ships with absolute
 * URLs, so an agent can fetch them without knowing the site layout. Which
 * files a workshop has is decided by its own materials array, never counted
 * anywhere else. The on-page decision lab stays on the page: it is an
 * exercise a learner works through, not material to hand out.
 */

import { isProtectedPlatformPath } from "@/lib/auth/routes";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { absoluteUrl } from "@/lib/seo/entity";
import {
  getWorkshopBySlug,
  WORKSHOPS,
  type Workshop,
  type WorkshopMaterial,
} from "@/lib/workshops";
import {
  absoluteLocalizedUrl,
  machineSurfaceEnvelope,
  type MachineSurfaceEnvelope,
} from "./envelope";
import { machineGraphFacet, type MachineGraphFacet } from "./graph";

const WORKSHOPS_SURFACE_NAME = "workshops";
const WORKSHOPS_PAGE_PATH = "/api/workshops.json";
const WORKSHOP_INDEX_PATH = "/workshops";

export interface MachineWorkshopMaterial {
  readonly label: string;
  readonly description: string;
  readonly kind: WorkshopMaterial["kind"];
  /** Language of the file itself, independent from the page locale. */
  readonly language: Locale;
  /** Site-root path of the static file. */
  readonly path: string;
  readonly url: string;
}

export interface MachineWorkshopStep {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly tool: string;
}

export interface MachineWorkshopMetric {
  readonly label: string;
  readonly value: string;
}

export interface MachineWorkshopCase {
  readonly company_name: string;
  /** True for invented teaching data, which is the norm for practice cases. */
  readonly is_fictional: boolean;
  readonly location: string;
  readonly sector: string;
  readonly period: string;
  readonly narrative: string;
  readonly metrics: readonly MachineWorkshopMetric[];
  readonly decision_question: string;
  /** What the underlying data structurally cannot answer. */
  readonly data_limitations: readonly string[];
}

export interface MachineWorkshopRealWorldCase {
  readonly company_name: string;
  readonly source: string;
  readonly source_url: string;
  readonly source_published_at: string;
  readonly source_reviewed_at: string;
  readonly source_limitation: string;
  readonly narrative: string;
  readonly metrics: readonly MachineWorkshopMetric[];
  readonly decision_question: string;
}

/** A workshop as one locale publishes it. Also the agent tools' return shape. */
export interface MachineWorkshop {
  readonly slug: string;
  readonly locale: Locale;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly description: string;
  readonly format: string;
  readonly duration: string;
  readonly access_note: string;
  readonly audience: readonly string[];
  readonly url: string;
  readonly requires_login: boolean;
  readonly steps: readonly MachineWorkshopStep[];
  readonly case_study: MachineWorkshopCase;
  readonly real_world_case: MachineWorkshopRealWorldCase | null;
  readonly materials: readonly MachineWorkshopMaterial[];
  readonly material_count: number;
  readonly material_languages: readonly Locale[];
  readonly available_locales: readonly Locale[];
  readonly graph: MachineGraphFacet | null;
}

/** One workshop across every locale that has a reviewed page. */
export interface MachineWorkshopCatalogEntry {
  readonly slug: string;
  readonly material_count: number;
  readonly available_locales: readonly Locale[];
  readonly localized: Readonly<Partial<Record<Locale, MachineWorkshop>>>;
}

export interface MachineWorkshopCatalogPayload extends MachineSurfaceEnvelope {
  readonly index_url: string;
  readonly locales: readonly Locale[];
  readonly workshops: readonly MachineWorkshopCatalogEntry[];
}

function workshopPath(slug: string): string {
  return `${WORKSHOP_INDEX_PATH}/${slug}`;
}

function machineMaterial(
  material: WorkshopMaterial,
): MachineWorkshopMaterial {
  return {
    label: material.label,
    description: material.description,
    kind: material.kind,
    language: material.language,
    path: material.href,
    url: absoluteUrl(material.href),
  };
}

function machineCase(workshop: Workshop): MachineWorkshopCase {
  const study = workshop.caseStudy;
  return {
    company_name: study.companyName,
    is_fictional: study.isFictional,
    location: study.location,
    sector: study.sector,
    period: study.period,
    narrative: study.narrative,
    metrics: study.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value,
    })),
    decision_question: study.decisionQuestion,
    data_limitations: study.dataLimitations,
  };
}

function machineRealWorldCase(
  workshop: Workshop,
): MachineWorkshopRealWorldCase | null {
  const realWorld = workshop.realWorldCase;
  if (!realWorld) return null;

  return {
    company_name: realWorld.companyName,
    source: realWorld.source,
    source_url: realWorld.sourceHref,
    source_published_at: realWorld.sourcePublishedAt,
    source_reviewed_at: realWorld.sourceReviewedAt,
    source_limitation: realWorld.sourceLimitation,
    narrative: realWorld.narrative,
    metrics: realWorld.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value,
    })),
    decision_question: realWorld.decisionQuestion,
  };
}

function machineWorkshop(workshop: Workshop, locale: Locale): MachineWorkshop {
  const path = workshopPath(workshop.slug);

  return {
    slug: workshop.slug,
    locale,
    title: workshop.title,
    eyebrow: workshop.eyebrow,
    summary: workshop.summary,
    description: workshop.description,
    format: workshop.format,
    duration: workshop.duration,
    access_note: workshop.accessNote,
    audience: workshop.audience,
    url: absoluteLocalizedUrl(path, locale),
    requires_login: isProtectedPlatformPath(path),
    steps: workshop.steps.map((step) => ({
      number: step.n,
      title: step.title,
      description: step.description,
      tool: step.tool,
    })),
    case_study: machineCase(workshop),
    real_world_case: machineRealWorldCase(workshop),
    materials: workshop.materials.map(machineMaterial),
    material_count: workshop.materials.length,
    material_languages: Array.from(
      new Set(workshop.materials.map((material) => material.language)),
    ),
    available_locales: contentLocalesForPath(path),
    graph: machineGraphFacet(`workshop:${workshop.slug}`),
  };
}

/**
 * Reviewed copy for one locale. A locale the parity registry promises but the
 * catalog does not carry is a content bug, so this fails loudly instead of
 * serving German copy under an English key.
 */
function localizedWorkshop(slug: string, locale: Locale): Workshop {
  const workshop = getWorkshopBySlug(slug, locale);
  if (!workshop) {
    throw new Error(`Missing ${locale} workshop copy for "${slug}".`);
  }
  return workshop;
}

/** Every workshop in one locale, in catalog order. */
export function listMachineWorkshops(
  locale: Locale,
): readonly MachineWorkshop[] {
  return WORKSHOPS.map((workshop) =>
    machineWorkshop(localizedWorkshop(workshop.slug, locale), locale),
  );
}

/** One workshop in one locale, or null when the slug is not in the catalog. */
export function getMachineWorkshop(
  slug: string,
  locale: Locale,
): MachineWorkshop | null {
  const workshop = getWorkshopBySlug(slug, locale);
  return workshop ? machineWorkshop(workshop, locale) : null;
}

/** Slugs a machine consumer may address, in catalog order. */
export function listMachineWorkshopSlugs(): readonly string[] {
  return WORKSHOPS.map((workshop) => workshop.slug);
}

function catalogEntry(workshop: Workshop): MachineWorkshopCatalogEntry {
  const locales = contentLocalesForPath(workshopPath(workshop.slug));

  return {
    slug: workshop.slug,
    material_count: workshop.materials.length,
    available_locales: locales,
    localized: Object.fromEntries(
      locales.map((locale) => [
        locale,
        machineWorkshop(localizedWorkshop(workshop.slug, locale), locale),
      ]),
    ),
  };
}

/** The complete `/api/workshops.json` payload. */
export function buildMachineWorkshopCatalog(): MachineWorkshopCatalogPayload {
  return {
    ...machineSurfaceEnvelope({
      name: WORKSHOPS_SURFACE_NAME,
      pagePath: WORKSHOPS_PAGE_PATH,
      count: WORKSHOPS.length,
    }),
    index_url: absoluteUrl(WORKSHOP_INDEX_PATH),
    locales: SUPPORTED_LOCALES,
    workshops: WORKSHOPS.map(catalogEntry),
  };
}
