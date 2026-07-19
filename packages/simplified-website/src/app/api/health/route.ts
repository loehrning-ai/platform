/**
 * Public deployment heartbeat.
 *
 * Optional providers are not launch dependencies when disabled. A configured
 * Supabase backend must be reachable; a provider-free learning deployment is
 * healthy and reports the dependency as "disabled".
 */

import { NextResponse } from "next/server";
import { isAnthropicRuntimeReady } from "@/lib/provider-readiness";

export const dynamic = "force-dynamic";

type ProviderHealth = "disabled" | "ok" | "error";

export async function GET() {
  const supabaseExpected = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  let supabase: ProviderHealth = supabaseExpected ? "error" : "disabled";

  if (supabaseExpected) {
    try {
      const { tryCreateServiceClient } = await import("@/lib/supabase/server");
      const client = tryCreateServiceClient();
      if (client) {
        const { error } = await client
          .from("user_course_progress")
          .select("user_id")
          .limit(0);
        supabase =
          !error || error.code === "PGRST116"
            ? "ok"
            : "error";
      }
    } catch {
      supabase = "error";
    }
  }

  const anthropicEnabled =
    isAnthropicRuntimeReady() &&
    supabase === "ok";
  const status = supabase === "error" ? "degraded" : "ok";

  return NextResponse.json(
    {
      status,
      supabase,
      anthropicEnabled,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
