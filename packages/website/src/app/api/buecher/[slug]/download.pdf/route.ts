export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { getBookById } from "@/lib/books";
import { generateBookPdf } from "@/lib/pdf/book-pdf";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";

interface Params {
  readonly params: Promise<{ readonly slug: string }>;
}

const USER_RATE_LIMIT = { windowSeconds: 60 * 60, max: 6 } as const;
const IP_RATE_LIMIT = { windowSeconds: 60 * 60, max: 30 } as const;
const ROUTE = "/api/buecher/[slug]/download.pdf";
const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  Vary: "Cookie",
} as const;
const pdfCache = new Map<string, Promise<Buffer>>();

function jsonError(
  error: string,
  status: number,
  extraHeaders: Readonly<Record<string, string>> = {},
): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        ...PRIVATE_RESPONSE_HEADERS,
        ...extraHeaders,
      },
    },
  );
}

function cachedBookPdf(
  book: NonNullable<ReturnType<typeof getBookById>>,
  slug: string,
): Promise<Buffer> {
  const existing = pdfCache.get(slug);
  if (existing) return existing;
  const generated = generateBookPdf(book, slug).catch((error) => {
    pdfCache.delete(slug);
    throw error;
  });
  pdfCache.set(slug, generated);
  return generated;
}

/**
 * GET /api/buecher/:slug/download.pdf
 *
 * Real PDF, generated on request from the same chapter content as the
 * browser reader. Only the canonical PDF path of a published book reaches
 * authentication: unknown, unpublished, and non-downloadable books get 404;
 * an anonymous request for the canonical PDF gets 401.
 */
export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const book = getBookById(slug);
  if (
    !book ||
    book.id !== slug ||
    book.pdfPath !== `/api/buecher/${slug}/download.pdf`
  ) {
    return jsonError("not_found", 404);
  }

  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({
      route: ROUTE,
      step: "auth-get-user",
      error,
      request,
    });
    return jsonError("auth_unavailable", 503);
  }
  const { configured, user, error } = auth;
  if (!configured) {
    return jsonError("auth_not_configured", 503);
  }
  if (error) {
    // Auth backend outage — distinct from "logged out", so callers don't
    // wrongly report this as an anonymous request.
    reportApiError({
      route: ROUTE,
      step: "auth-get-user",
      error,
      request,
    });
    return jsonError("auth_unavailable", 503);
  }
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  let withinUserBudget: boolean;
  try {
    withinUserBudget = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "book-pdf",
        request,
        user.id,
      ),
      ...USER_RATE_LIMIT,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return jsonError("rate_limit_unavailable", 503);
  }
  if (!withinUserBudget) {
    return jsonError(
      "rate_limit_exceeded",
      429,
      { "Retry-After": String(USER_RATE_LIMIT.windowSeconds) },
    );
  }
  let withinIpBudget: boolean;
  try {
    withinIpBudget = await consumeRateLimit({
      key: await hashedClientRateLimitKey("book-pdf-ip", request),
      ...IP_RATE_LIMIT,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return jsonError("rate_limit_unavailable", 503);
  }
  if (!withinIpBudget) {
    return jsonError(
      "rate_limit_exceeded",
      429,
      { "Retry-After": String(IP_RATE_LIMIT.windowSeconds) },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await cachedBookPdf(book, book.id);
  } catch (error) {
    reportApiError({
      route: ROUTE,
      step: "pdf-generate",
      error,
      request,
    });
    return jsonError("pdf_generation_failed", 500);
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      ...PRIVATE_RESPONSE_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${book.id}.pdf"`,
    },
  });
}
