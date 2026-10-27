export const runtime = "nodejs";

import { listSkillNames, readSkillDocument } from "@/app/skills/_lib/registry";
import { skillNameFromZipSegment, skillZip, SKILL_ZIP_SUFFIX } from "@/app/skills/_lib/skill-zip";

/**
 * GET /skills/<name>.zip
 *
 * The one-tap download of a skill for claude.ai, the desktop app or Claude
 * Code: a zip holding exactly `<name>/SKILL.md`, the authored bytes of
 * content/skills/<name>/SKILL.md. Built at build time with the site's one
 * STORE zip writer, so the archive is deterministic and the mirror check can
 * compare its SKILL.md byte for byte.
 *
 * Fully static: one response per authored skill, any other segment is a 404.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

interface Params {
  readonly params: Promise<{ readonly name: string }>;
}

const CACHE_CONTROL = "public, max-age=3600, s-maxage=3600";

export async function generateStaticParams(): Promise<{ name: string }[]> {
  const names = await listSkillNames();
  return names.map((name) => ({ name: `${name}${SKILL_ZIP_SUFFIX}` }));
}

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { name: segment } = await params;
  const name = skillNameFromZipSegment(segment);
  const document = name === null ? null : await readSkillDocument(name);

  if (name === null || document === null) {
    return new Response("Unknown skill.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const bytes = skillZip(name, document);
  return new Response(bytes.slice().buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}${SKILL_ZIP_SUFFIX}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
