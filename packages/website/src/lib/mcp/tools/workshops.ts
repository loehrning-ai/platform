/**
 * Workshop tools. The material list comes from the workshop's own
 * `materials[]` array, never from a second inventory, so a workshop that ships
 * five files reports five and one that ships two reports two.
 */

import { absoluteUrl } from "@/lib/seo/entity";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import type { Locale } from "@/lib/i18n/locale";
import type { Workshop } from "@/lib/workshops";
import { allWorkshops, workshopBySlug, workshopUrl } from "../catalog";
import { notFound } from "../errors";
import { workshopUri } from "../uris";

function materials(workshop: Workshop) {
  return workshop.materials.map((material) => ({
    label: material.label,
    description: material.description,
    kind: material.kind,
    language: material.language,
    url: absoluteUrl(material.href),
  }));
}

export function listWorkshops(locale: Locale) {
  const workshops = allWorkshops(locale);
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    count: workshops.length,
    workshops: workshops.map((workshop) => ({
      slug: workshop.slug,
      title: workshop.title,
      eyebrow: workshop.eyebrow,
      summary: workshop.summary,
      format: workshop.format,
      duration: workshop.duration,
      material_count: workshop.materials.length,
      url: workshopUrl(workshop, locale),
      resource_uri: workshopUri(workshop.slug, locale),
    })),
  };
}

export function getWorkshop(slug: string, locale: Locale) {
  const workshop = workshopBySlug(slug, locale);
  if (!workshop) notFound("unknown_workshop", "workshop", "list_workshops");

  return {
    stand: SITE_CONTENT_DATE,
    locale,
    slug: workshop.slug,
    title: workshop.title,
    eyebrow: workshop.eyebrow,
    summary: workshop.summary,
    description: workshop.description,
    format: workshop.format,
    duration: workshop.duration,
    access_note: workshop.accessNote,
    audience: workshop.audience,
    url: workshopUrl(workshop, locale),
    resource_uri: workshopUri(workshop.slug, locale),
    steps: workshop.steps.map((step) => ({
      n: step.n,
      title: step.title,
      description: step.description,
      tool: step.tool,
    })),
    case_study: {
      company_name: workshop.caseStudy.companyName,
      is_fictional: workshop.caseStudy.isFictional,
      location: workshop.caseStudy.location,
      sector: workshop.caseStudy.sector,
      period: workshop.caseStudy.period,
      narrative: workshop.caseStudy.narrative,
      metrics: workshop.caseStudy.metrics,
      decision_question: workshop.caseStudy.decisionQuestion,
      data_limitations: workshop.caseStudy.dataLimitations,
    },
    real_world_case: workshop.realWorldCase
      ? {
          company_name: workshop.realWorldCase.companyName,
          source: workshop.realWorldCase.source,
          source_url: workshop.realWorldCase.sourceHref,
          source_published_at: workshop.realWorldCase.sourcePublishedAt,
          source_reviewed_at: workshop.realWorldCase.sourceReviewedAt,
          source_limitation: workshop.realWorldCase.sourceLimitation,
          narrative: workshop.realWorldCase.narrative,
          metrics: workshop.realWorldCase.metrics,
          decision_question: workshop.realWorldCase.decisionQuestion,
        }
      : null,
    materials: materials(workshop),
  };
}

/** Markdown rendering of one workshop, used by the workshop:// resource. */
export function workshopMarkdown(slug: string, locale: Locale): string {
  const workshop = getWorkshop(slug, locale);
  const steps = workshop.steps
    .map((step) => `${step.n}. ${step.title} (${step.tool})\n   ${step.description}`)
    .join("\n");
  const files = workshop.materials
    .map((material) => `- ${material.label} (${material.kind}): ${material.url}`)
    .join("\n");
  return [
    `# ${workshop.title}`,
    "",
    workshop.description,
    "",
    `Format: ${workshop.format}  `,
    `Duration: ${workshop.duration}  `,
    `Source: ${workshop.url}`,
    "",
    "## Steps",
    "",
    steps,
    "",
    "## Practice case",
    "",
    `${workshop.case_study.company_name} (${workshop.case_study.sector}, ${workshop.case_study.location}, ${workshop.case_study.period})`,
    workshop.case_study.is_fictional
      ? "These figures are invented teaching data."
      : "These figures come from published reporting.",
    "",
    workshop.case_study.narrative,
    "",
    `Decision: ${workshop.case_study.decision_question}`,
    "",
    "## Materials",
    "",
    files,
    "",
  ].join("\n");
}
