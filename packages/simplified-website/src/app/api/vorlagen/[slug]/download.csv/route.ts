import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getVorlageBySlug } from "@/lib/vorlagen";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  if (slug !== "ki-inventarliste") return new NextResponse("Not found", { status: 404 });
  const vorlage = getVorlageBySlug(slug);
  if (!vorlage) return new NextResponse("Not found", { status: 404 });

  const file = path.join(process.cwd(), "content", "vorlagen", "ki-inventarliste.csv");
  const content = fs.readFileSync(file, "utf8");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vorlage.slug}.csv"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
