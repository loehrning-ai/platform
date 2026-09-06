/**
 * get_knowledge_graph.
 *
 * Reads the same `LEARNING_NODES` / `LEARNING_EDGES` registry the public
 * knowledge-graph endpoint is built from, so there is no second graph to keep
 * in sync. The full JSON document, with every localized page and catalogue
 * cross-reference, stays at its own URL and is named in the response.
 */

import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { LEARNING_EDGES, LEARNING_NODES } from "@/lib/learning-graph";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { absoluteUrl, SITE_ENTITY } from "@/lib/seo/entity";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

export const KNOWLEDGE_GRAPH_DOCUMENT_URL = absoluteUrl(
  "/api/knowledge-graph.json",
);

export function getKnowledgeGraph(locale: Locale) {
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    site: {
      name: SITE_ENTITY.name,
      url: SITE_ENTITY.origin,
      languages: ["de-DE", "en-GB"],
    },
    full_document_url: KNOWLEDGE_GRAPH_DOCUMENT_URL,
    node_count: LEARNING_NODES.length,
    edge_count: LEARNING_EDGES.length,
    nodes: LEARNING_NODES.map((node) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      summary: node.summary ?? null,
      url: absoluteUrl(localizeHref(node.route, locale)),
      canonical_language: node.language,
      access: node.access,
      level: node.level,
      stage: node.stage,
      evidence_mode: node.evidenceMode,
      source_owner: node.sourceOwner,
      course_slug: node.courseSlug ?? null,
      crawl_class: getCrawlRoute(node.route).routeClass,
    })),
    edges: LEARNING_EDGES.map((edge) => ({
      from: edge.from,
      to: edge.to,
      type: edge.type,
    })),
  };
}
