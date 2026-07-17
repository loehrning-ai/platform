import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { readBoundedJson } from "@/lib/http/read-json-body";
import { isUnifiedProgress, mergeUnifiedProgress } from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";

const MAX_PROGRESS_PAYLOAD_BYTES = 262_144;

const payloadSchema = z.object({
  progress: z.unknown().refine(isUnifiedProgress, "Invalid progress payload"),
});

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

async function requireUser() {
  const { configured, user } = await getAuthenticatedUser();
  if (!configured) {
    return { error: privateJson({ error: "auth_not_configured" }, { status: 503 }) };
  }
  if (!user) {
    return { error: privateJson({ error: "unauthorized" }, { status: 401 }) };
  }
  const supabase = await createAuthServerClient();
  if (!supabase) {
    return { error: privateJson({ error: "auth_not_configured" }, { status: 503 }) };
  }
  return { user, supabase };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("user_course_progress")
    .select("progress, updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }

  return privateJson({
    progress: isUnifiedProgress(data?.progress) ? data.progress : null,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await readBoundedJson(request, MAX_PROGRESS_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }

  const parsed = payloadSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_progress" }, { status: 400 });
  }

  let incoming: UnifiedProgress = parsed.data.progress;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: existing, error: readError } = await auth.supabase
      .from("user_course_progress")
      .select("progress, updated_at")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (readError) {
      return privateJson({ error: "progress_read_failed" }, { status: 500 });
    }

    const progress = isUnifiedProgress(existing?.progress)
      ? mergeUnifiedProgress(incoming, existing.progress)
      : incoming;
    const updatedAt = new Date().toISOString();

    if (existing?.updated_at) {
      const { data, error } = await auth.supabase
        .from("user_course_progress")
        .update({ progress, updated_at: updatedAt })
        .eq("user_id", auth.user.id)
        .eq("updated_at", existing.updated_at)
        .select("progress, updated_at")
        .maybeSingle();

      if (error) {
        return privateJson({ error: "progress_write_failed" }, { status: 500 });
      }
      if (data) {
        return privateJson({ ok: true, progress: data.progress, updatedAt: data.updated_at });
      }
      incoming = progress;
      continue;
    }

    const { data, error } = await auth.supabase
      .from("user_course_progress")
      .insert({
        user_id: auth.user.id,
        progress,
        updated_at: updatedAt,
      })
      .select("progress, updated_at")
      .maybeSingle();

    if (!error && data) {
      return privateJson({ ok: true, progress: data.progress, updatedAt: data.updated_at });
    }
    incoming = progress;
  }

  const { data: latest } = await auth.supabase
    .from("user_course_progress")
    .select("progress, updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return privateJson(
    {
      error: "progress_conflict",
      progress: isUnifiedProgress(latest?.progress) ? latest.progress : null,
      updatedAt: latest?.updated_at ?? null,
    },
    { status: 409 },
  );
}
