export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { getBookById } from "@/lib/books";
import { generateBookPdf } from "@/lib/pdf/book-pdf";

interface Params {
  readonly params: Promise<{ readonly slug: string }>;
}

/**
 * GET /api/buecher/:slug/download.pdf
 *
 * Real PDF, generated on request from the same chapter content as the
 * browser reader. Gated to logged-in users — a guessed URL without a valid
 * session gets 401, same as any other authenticated API route.
 */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const book = getBookById(slug);
  if (!book) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { configured, user, error } = await getAuthenticatedUser();
  if (!configured) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }
  if (error) {
    // Auth backend outage — distinct from "logged out", so callers don't
    // wrongly report this as an anonymous request.
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pdfBuffer = await generateBookPdf(book, slug);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
