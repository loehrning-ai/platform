import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { isUnifiedProgress } from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";
import { COURSE_SLUGS, type CourseSlug } from "@/lib/course/types";
import { readBoundedJson } from "@/lib/http/read-json-body";

const MAX_RESET_PAYLOAD_BYTES = 4 * 1024;

const bodySchema = z.object({
  courseSlug: z.string().refine((v): v is CourseSlug => (COURSE_SLUGS as readonly string[]).includes(v), {
    message: "Invalid course slug",
  }),
});

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const { configured, user } = await getAuthenticatedUser();
  if (!configured) return privateJson({ error: "auth_not_configured" }, { status: 503 });
  if (!user) return privateJson({ error: "unauthorized" }, { status: 401 });

  const supabase = await createAuthServerClient();
  if (!supabase) return privateJson({ error: "auth_not_configured" }, { status: 503 });

  const body = await readBoundedJson(request, MAX_RESET_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }
  const parsed = bodySchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_course_slug" }, { status: 400 });
  }

  const { courseSlug } = parsed.data;

  const { data: existing } = await supabase
    .from("user_course_progress")
    .select("progress")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return privateJson({ ok: true, message: "no_progress_to_reset" });
  }

  if (!isUnifiedProgress(existing.progress)) {
    return privateJson({ error: "invalid_progress_format" }, { status: 500 });
  }

  const current = existing.progress as UnifiedProgress;
  const updatedCourses = { ...current.courses };
  delete updatedCourses[courseSlug];

  const updated: UnifiedProgress = {
    ...current,
    courses: updatedCourses,
  };

  const { error } = await supabase
    .from("user_course_progress")
    .update({ progress: updated, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    return privateJson({ error: "reset_failed" }, { status: 500 });
  }

  return privateJson({ ok: true, resetCourse: courseSlug });
}
