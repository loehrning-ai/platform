export const runtime = "nodejs";

import {
  listSkillNames,
  readSkillDocument,
} from "@/app/skills/_lib/registry";

/**
 * GET /skills/<name>/SKILL.md
 *
 * Serves one authored skill document as `text/markdown`. Agent tooling reads
 * these directly, and the public mirror repository is a copy of the same files,
 * so the response body is the content file byte for byte: no rendering, no
 * rewriting, no injected header.
 *
 * Fully static: `generateStaticParams` bakes one response per authored skill at
 * build time, and `dynamicParams = false` makes any other name a hard 404
 * rather than a runtime filesystem lookup.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

interface Params {
  readonly params: Promise<{ readonly name: string }>;
}

const CACHE_CONTROL = "public, max-age=3600, s-maxage=3600";

export async function generateStaticParams(): Promise<{ name: string }[]> {
  const names = await listSkillNames();
  return names.map((name) => ({ name }));
}

export async function GET(
  _request: Request,
  { params }: Params,
): Promise<Response> {
  const { name } = await params;
  const document = await readSkillDocument(name);

  if (document === null) {
    return new Response("Unknown skill.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(document, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Language": "de, en",
      "Cache-Control": CACHE_CONTROL,
      // Agent tooling fetches these cross-origin while installing a skill.
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
