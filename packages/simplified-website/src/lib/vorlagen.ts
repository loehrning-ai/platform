import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  type Vorlage,
  type VorlageCategory,
  type VorlageDownload,
  type VorlageMeta,
  type VorlageSource,
} from "@/lib/vorlagen-shared";

export type {
  Vorlage,
  VorlageCategory,
  VorlageDownload,
  VorlageMeta,
  VorlageSource,
};
export { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS };

const CONTENT_DIR = path.join(process.cwd(), "content", "vorlagen");
const TEMPLATE_ORDER = [
  "ki-nutzungsrichtlinie",
  "risikoklassifizierung",
  "schulungsrahmen-art4",
  "dsfa-fuer-ki-systeme",
  "ki-anbieter-due-diligence",
  "ki-inventarliste",
  "pilot-charter",
  "use-case-bewertungsmatrix",
] as const;

let cache: readonly Vorlage[] | undefined;

function readAll(): readonly Vorlage[] {
  // Only cache in production. In dev, re-read on every request so content
  // edits show up without restarting the server.
  if (cache && process.env.NODE_ENV === "production") return cache;

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const items = files.map<Vorlage>((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);

    const downloads: VorlageDownload[] = [
      {
        format: "md",
        label: "Markdown (.md)",
        href: `/api/vorlagen/${slug}/download.md`,
      },
      {
        format: "pdf",
        label: "PDF (.pdf)",
        href: `/api/vorlagen/${slug}/download.pdf`,
      },
    ];

    if (slug === "ki-inventarliste") {
      downloads.push({
        format: "csv",
        label: "CSV-Vorlage (Excel-fähig)",
        href: `/api/vorlagen/${slug}/download.csv`,
      });
    }

    return {
      slug,
      title: String(data.title ?? slug),
      category: (data.category as VorlageCategory) ?? "werkzeug",
      pflicht: Boolean(data.pflicht),
      articleRefs: Array.isArray(data.articleRefs) ? data.articleRefs.map(String) : [],
      pages: Number(data.pages ?? 0),
      jobToBeDone: String(data.jobToBeDone ?? ""),
      audience: Array.isArray(data.audience) ? data.audience.map(String) : [],
      estReadMinutes: Number(data.estReadMinutes ?? 0),
      estCompleteMinutes: Number(data.estCompleteMinutes ?? 0),
      relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs.map(String) : [],
      editorNotes: Array.isArray(data.editorNotes) ? data.editorNotes.map(String) : [],
      sources: Array.isArray(data.sources)
        ? (data.sources as { title?: unknown; url?: unknown }[]).map((s) => ({
            title: String(s.title ?? ""),
            url: String(s.url ?? ""),
          }))
        : [],
      lastReviewed: String(data.lastReviewed ?? ""),
      nextReview: String(data.nextReview ?? ""),
      riskClass: String(data.riskClass ?? "legal"),
      downloads,
      body: content,
    };
  });

  const order: ReadonlyMap<string, number> = new Map(
    TEMPLATE_ORDER.map((slug, index) => [slug, index]),
  );
  const sorted = [...items].sort((a, b) => {
    const aOrder = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title, "de");
  });

  cache = sorted;
  return cache;
}

export function getAllVorlagen(): readonly Vorlage[] {
  return readAll();
}

export function getAllVorlagenMeta(): readonly VorlageMeta[] {
  return readAll().map(({ body: _body, ...meta }) => meta);
}

export function getVorlageBySlug(slug: string): Vorlage | null {
  return readAll().find((v) => v.slug === slug) ?? null;
}

export function getVorlagenByCategory(category: VorlageCategory): readonly Vorlage[] {
  return readAll().filter((v) => v.category === category);
}

export function getVorlagenSlugs(): readonly string[] {
  return readAll().map((v) => v.slug);
}

export function getRelatedVorlagen(slug: string): readonly VorlageMeta[] {
  const v = getVorlageBySlug(slug);
  if (!v) return [];
  const allMeta = getAllVorlagenMeta();
  return v.relatedSlugs
    .map((s) => allMeta.find((m) => m.slug === s))
    .filter((m): m is VorlageMeta => m !== undefined);
}
