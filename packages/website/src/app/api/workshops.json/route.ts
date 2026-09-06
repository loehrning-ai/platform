import { NextResponse } from "next/server";
import {
  buildMachineWorkshopCatalog,
  MACHINE_SURFACE_HEADERS,
} from "@/lib/machine-surfaces";

/**
 * GET /api/workshops.json
 *
 * Public, machine-readable catalog of the self-study workshops, including the
 * materials manifest: every downloadable file a workshop ships, with an
 * absolute URL, its kind and the language of the file itself.
 *
 * Built from the canonical registries by `@/lib/machine-surfaces` (the same
 * builder the agent tools use), CORS `*`, cached 1h, freshness from
 * SITE_CONTENT_DATE.
 */
export async function GET() {
  return NextResponse.json(buildMachineWorkshopCatalog(), {
    headers: { ...MACHINE_SURFACE_HEADERS },
  });
}
