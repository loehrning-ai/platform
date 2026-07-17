import { NextResponse } from "next/server";
import { getVorlageBySlug } from "@/lib/vorlagen";
import { generateVorlagePdf } from "@/lib/pdf/vorlage-pdf";
import { reportApiError } from "@/lib/observability/api-error";

interface Params {
  params: Promise<{ slug: string }>;
}

// PDF generation can take a few seconds for longer templates.
export const maxDuration = 30;

export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const vorlage = getVorlageBySlug(slug);
  if (!vorlage) return new NextResponse("Not found", { status: 404 });

  try {
    const buffer = await generateVorlagePdf(vorlage);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${vorlage.slug}.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (err) {
    reportApiError({ request: req, step: "pdf-generate", error: err, extra: { slug } });
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
