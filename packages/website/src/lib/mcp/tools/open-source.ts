/**
 * Open-source tool and project catalogue.
 *
 * `get_open_source_tool` returns exactly what an agent needs to run the thing:
 * the pinned source revision, prerequisites, installation and usage commands,
 * the integration procedure, the license record, and the hosted or in-platform
 * launch URL when one exists. Every value comes from the artifact registry,
 * which already validates each record at import time.
 */

import { absoluteUrl } from "@/lib/seo/entity";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import type { Locale } from "@/lib/i18n/locale";
import type { SoftwareArtifactProcedure } from "@/lib/open-source/artifacts";
import {
  artifactUrl,
  softwareArtifactBySlug,
  softwareArtifacts,
  type SoftwareArtifact,
} from "../catalog";
import { notFound } from "../errors";

function procedure(value: SoftwareArtifactProcedure) {
  return {
    summary: value.summary,
    steps: value.steps.map((step) => ({
      title: step.title,
      detail: step.detail,
      command: step.command ?? null,
    })),
  };
}

function launchUrl(artifact: SoftwareArtifact): string | null {
  return artifact.delivery === "source-only"
    ? null
    : artifact.launchHref.startsWith("http")
      ? artifact.launchHref
      : absoluteUrl(artifact.launchHref);
}

export function listOpenSourceTools(locale: Locale) {
  const artifacts = softwareArtifacts();
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    count: artifacts.length,
    tools: artifacts.map((artifact) => ({
      slug: artifact.slug,
      kind: artifact.kind,
      title: artifact.title,
      eyebrow: artifact.eyebrow,
      description: artifact.description,
      language: artifact.language,
      status: artifact.guide.status,
      delivery: artifact.delivery,
      url: artifactUrl(artifact, locale),
      source_url: artifact.source.href,
      source_revision: artifact.source.revision,
      launch_url: launchUrl(artifact),
    })),
  };
}

export function getOpenSourceTool(slug: string, locale: Locale) {
  const artifact = softwareArtifactBySlug(slug);
  if (!artifact) {
    notFound("unknown_tool_slug", "open-source tool", "list_open_source_tools");
  }
  const guide = artifact.guide;

  return {
    stand: SITE_CONTENT_DATE,
    locale,
    slug: artifact.slug,
    kind: artifact.kind,
    title: artifact.title,
    eyebrow: artifact.eyebrow,
    description: artifact.description,
    language: artifact.language,
    url: artifactUrl(artifact, locale),
    status: guide.status,
    status_note: guide.statusNote,
    data_flow: guide.dataFlow,
    delivery: artifact.delivery,
    launch_url: launchUrl(artifact),
    source: {
      url: artifact.source.href,
      revision: artifact.source.revision,
      revision_url: artifact.source.revisionHref,
      clone_command: `git clone ${artifact.source.href}.git`,
      checkout_command: `git checkout ${artifact.source.revision}`,
    },
    license: {
      url: absoluteUrl(artifact.license.href),
      license_id: artifact.license.licenseId ?? null,
      sha256: artifact.license.sha256,
      size_bytes: artifact.license.sizeBytes,
    },
    prerequisites: guide.prerequisites.map((prerequisite) => ({
      label: prerequisite.label,
      detail: prerequisite.detail,
      url: prerequisite.href ?? null,
    })),
    installation: procedure(guide.installation),
    usage: procedure(guide.usage),
    integration: {
      ...procedure(guide.integration),
      targets: guide.integration.targets,
    },
    documentation: {
      label: guide.documentation.label,
      url: guide.documentation.href.startsWith("http")
        ? guide.documentation.href
        : absoluteUrl(guide.documentation.href),
    },
    related_learning: guide.relatedLearning.map((entry) => ({
      title: entry.title,
      description: entry.description,
      url: absoluteUrl(entry.href),
    })),
  };
}
