import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { isUnifiedProgress } from "@/lib/progress/server-sync";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  const { configured, user, error: authError } = await getAuthenticatedUser();
  if (!configured) {
    return jsonError("auth_not_configured", 503);
  }
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: "/api/account/export", step: "auth-get-user", error: authError });
    return jsonError("auth_unavailable", 503);
  }
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  const supabase = await createAuthServerClient();
  if (!supabase) {
    return jsonError("auth_not_configured", 503);
  }

  const { data, error } = await supabase
    .from("user_course_progress")
    .select("progress, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // A failed read must not silently export progress: null — that would look
  // like "no data stored" in a DSGVO data export. Fail loudly instead.
  if (error) {
    reportApiError({ route: "/api/account/export", step: "supabase-read", error });
    return jsonError("export_failed", 500);
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `loehrning-export-${today}.json`;

  const payload = {
    email: user.email ?? null,
    exported_at: new Date().toISOString(),
    progress: isUnifiedProgress(data?.progress) ? data.progress : null,
    progress_updated_at: data?.updated_at ?? null,
    // certificates array is empty until ADR 004 server-signed certificates ship
    certificates: [] as unknown[],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
