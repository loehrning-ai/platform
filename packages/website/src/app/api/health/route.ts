/** Public deployment heartbeat.
 *
 * This is deliberately a shallow liveness probe. It confirms that the
 * deployment and routing layer can serve the application without turning a
 * public request into a privileged database query. Provider reachability
 * belongs in private monitoring.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    { status: "ok" },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
