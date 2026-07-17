import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportApiError } from "@/lib/observability/api-error";

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function DELETE() {
  const { configured, user } = await getAuthenticatedUser();
  if (!configured) return privateJson({ error: "auth_not_configured" }, { status: 503 });
  if (!user) return privateJson({ error: "unauthorized" }, { status: 401 });

  // user_course_progress rows are deleted via ON DELETE CASCADE on the user_id FK
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return privateJson({ error: "admin_client_unavailable" }, { status: 503 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    reportApiError({ step: "account_delete", error });
    return privateJson({ error: "delete_failed" }, { status: 500 });
  }

  // Client must clear localStorage and redirect to / on receiving { deleted: true }
  return privateJson({ deleted: true });
}
