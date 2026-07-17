import { NextResponse } from "next/server";
import { getVorlageBySlug } from "@/lib/vorlagen";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const vorlage = getVorlageBySlug(slug);
  if (!vorlage) return new NextResponse("Not found", { status: 404 });

  const header =
    `# ${vorlage.title}\n\n` +
    `> ${vorlage.jobToBeDone}\n>\n` +
    `> Quelle: https://loehrning.ai/vorlagen/${vorlage.slug}\n` +
    `> Lizenz: CC BY 4.0\n` +
    `> Letzte fachliche Prüfung: ${vorlage.lastReviewed}\n\n` +
    `---\n\n`;

  // Strip the original title (first H1) from body to avoid duplication
  const bodyWithoutTitle = vorlage.body.replace(/^\s*#\s+.+\n+/, "");

  const content = header + bodyWithoutTitle;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vorlage.slug}.md"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
