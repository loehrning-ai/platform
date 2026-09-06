import { NextResponse } from "next/server";
import {
  buildMachineCourseCatalog,
  MACHINE_SURFACE_HEADERS,
} from "@/lib/machine-surfaces";

/**
 * GET /api/courses.json
 *
 * Public, machine-readable catalog of every course on the platform.
 * Built from the canonical registries by `@/lib/machine-surfaces` (the same
 * builder the agent tools use), CORS `*`, cached 1h, freshness from
 * SITE_CONTENT_DATE.
 *
 * Each course carries its reviewed copy per locale, its structure, whether
 * its reader needs a login, and the pinned source commit of the courses that
 * came from an open-source repository.
 */
export async function GET() {
  return NextResponse.json(buildMachineCourseCatalog(), {
    headers: { ...MACHINE_SURFACE_HEADERS },
  });
}
