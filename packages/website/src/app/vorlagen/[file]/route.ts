export const runtime = "nodejs";

import {
  VORLAGEN,
  findByDownloadName,
  readVorlageSource,
} from "@/lib/vorlagen/registry";
import { SITE_ORIGIN } from "@/lib/seo/entity";

/**
 * GET /vorlagen/<file>.md
 *
 * Serves one question-sheet template (CC BY 4.0) as a Markdown download. The
 * response body is the content file byte for byte: no rendering, no rewriting,
 * no injected header, so a downloaded copy equals the authored source.
 *
 * Fully static: `generateStaticParams` bakes one response per download name at
 * build time, and `dynamicParams = false` makes any other name a hard 404
 * rather than a runtime filesystem lookup. The handler still refuses unknown
 * names itself, so a direct call can never read outside content/vorlagen.
 *
 * The file is crawlable but never the canonical document: the Link header
 * points search engines at the page that publishes the sheet.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

interface Params {
  readonly params: Promise<{ readonly file: string }>;
}

const CACHE_CONTROL = "public, max-age=3600, s-maxage=3600";

export async function generateStaticParams(): Promise<{ file: string }[]> {
  return VORLAGEN.flatMap((entry) =>
    Object.values(entry.downloadNames).map((file) => ({ file })),
  );
}

export async function GET(
  _request: Request,
  { params }: Params,
): Promise<Response> {
  const { file } = await params;
  const match = findByDownloadName(file);

  if (match === null) {
    return new Response("Unknown template.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const { entry, locale } = match;
  const body = await readVorlageSource(entry.slug, locale);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // The registered name, never the raw request segment.
      "Content-Disposition": `attachment; filename="${entry.downloadNames[locale]}"`,
      "Content-Language": locale,
      "Cache-Control": CACHE_CONTROL,
      Link: `<${SITE_ORIGIN}${entry.hostPaths[locale]}>; rel="canonical"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
