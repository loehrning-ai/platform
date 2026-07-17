import { NextResponse } from "next/server";
import { books } from "@/lib/books";
import { STAND_DATE, LAST_UPDATED } from "@/lib/content-meta";

/**
 * GET /api/books.json
 *
 * Public, machine-readable catalog of the open book library.
 * Single in-repo source (`@/lib/books`), CORS `*`, cached 1h.
 * Journalists, LLM crawlers, and readers can consume this to list
 * free book metadata. All three readers are open — no login required.
 */
export async function GET() {
  const payload = {
    schema: "https://loehrning.ai/schema/books/v1",
    stand: STAND_DATE,
    last_updated: LAST_UPDATED,
    count: books.length,
    page_url: "https://loehrning.ai/api/books.json",
    library_url: "https://loehrning.ai/buecher",
    library_requires_login: false,
    books: books.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      author: b.author,
      edition: b.edition,
      language: b.language,
      audience: b.audience,
      chapters: b.chapters,
      page_count: b.pageCount,
      reading_time_minutes: b.readingTimeMinutes,
      resource_type: b.resourceType,
      access: b.accessLabel,
      access_policy: b.accessPolicy,
      status: b.statusLabel,
      description: b.description,
      highlights: b.highlights,
      pdf: b.pdfPath,
      pdf_available: Boolean(b.pdfPath),
      preview_pages: [],
      preview_note:
        "Readers are open to the public — no login required. This API exposes metadata; the reader itself is at reader_url.",
      overview_url: "https://loehrning.ai/api/books.json",
      preview_url: `https://loehrning.ai/api/books.json#${b.id}`,
      resource_url: `https://loehrning.ai/api/books.json#${b.id}`,
      reader_url: `https://loehrning.ai${b.readerHref}`,
      reader_requires_login: false,
      related_resource: {
        label: b.relatedResourceLabel,
        href: `https://loehrning.ai${b.relatedResourceHref}`,
      },
      source_owner: b.sourceOwner,
      last_reviewed: b.lastReviewed,
      next_review: b.nextReview,
      source_inputs: b.sourceInputs,
      license_policy: b.licensePolicy,
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
