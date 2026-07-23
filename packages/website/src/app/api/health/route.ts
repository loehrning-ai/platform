/** Public deployment heartbeat.
 *
 * This is deliberately a shallow liveness probe. It confirms that the
 * deployment and routing layer can serve the application without turning a
 * public request into a privileged database query. Provider reachability
 * belongs in private monitoring.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 60;

export function GET() {
  return NextResponse.json(
    { status: "ok" },
    {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
