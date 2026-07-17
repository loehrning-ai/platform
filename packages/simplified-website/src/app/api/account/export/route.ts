import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { isUnifiedProgress } from "@/lib/progress/server-sync";

export async function GET() {
  const { configured, user } = await getAuthenticatedUser();
  if (!configured) {
    return new Response(JSON.stringify({ error: "auth_not_configured" }), { status: 503 });
  }
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = await createAuthServerClient();
  if (!supabase) {
    return new Response(JSON.stringify({ error: "auth_not_configured" }), { status: 503 });
  }

  const { data } = await supabase
    .from("user_course_progress")
    .select("progress, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

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
