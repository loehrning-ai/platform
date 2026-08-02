import type { SupabaseClient } from "@supabase/supabase-js";
import { trustedRequestOrigin } from "@/lib/auth/origin";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { tryCreateServiceClient } from "@/lib/supabase/server";

const EXPORT_PAGE_SIZE = 1_000;
const EXPORT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const EXPORT_USER_RATE_LIMIT_MAX = 10;
const EXPORT_CLIENT_RATE_LIMIT_MAX = 100;
const EXPORT_REQUEST_BODY_MAX_BYTES = 2_048;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
      ...(status === 429
        ? { "Retry-After": String(EXPORT_RATE_LIMIT_WINDOW_SECONDS) }
        : {}),
    },
  });
}

type BoundExportUser = {
  readonly id: string;
  readonly email?: string | null;
};

type BoundAuthResult =
  | { readonly ok: true; readonly user: BoundExportUser }
  | { readonly ok: false; readonly response: Response };

async function authenticateBoundOwner(
  request: Request,
  expectedOwnerId: string | null | undefined,
): Promise<BoundAuthResult> {
  const normalizedOwnerId = expectedOwnerId?.trim();
  if (!normalizedOwnerId || normalizedOwnerId.length > 256) {
    return { ok: false, response: jsonError("invalid_owner_binding", 400) };
  }

  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "auth-get-user",
      error,
    });
    return { ok: false, response: jsonError("auth_unavailable", 503) };
  }
  const { configured, user, error: authError } = auth;
  if (!configured) {
    return { ok: false, response: jsonError("auth_not_configured", 503) };
  }
  if (authError) {
    reportApiError({
      route: "/api/account/export",
      step: "auth-get-user",
      error: authError,
    });
    return { ok: false, response: jsonError("auth_unavailable", 503) };
  }
  if (!user) {
    return { ok: false, response: jsonError("unauthorized", 401) };
  }
  if (normalizedOwnerId !== user.id) {
    return { ok: false, response: jsonError("account_owner_mismatch", 409) };
  }
  return { ok: true, user };
}

function isSameOriginPost(request: Request): boolean {
  const trustedOrigin = trustedRequestOrigin(new URL(request.url));
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    trustedOrigin !== null &&
    origin === trustedOrigin.origin &&
    (!fetchSite || fetchSite === "same-origin")
  );
}

async function readBoundedRequestText(request: Request): Promise<string> {
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    (!/^\d+$/.test(declaredLength) ||
      Number(declaredLength) > EXPORT_REQUEST_BODY_MAX_BYTES)
  ) {
    throw new Error("oversized_request_body");
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > EXPORT_REQUEST_BODY_MAX_BYTES) {
        throw new Error("oversized_request_body");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

type AssessmentTable = "assessment_runs" | "assessment_answers";

interface AssessmentPage {
  readonly rows: readonly Record<string, unknown>[];
  readonly expectedCount: number;
}

async function fetchAssessmentPage(
  client: SupabaseClient,
  table: AssessmentTable,
  userId: string,
  timestampColumn: "started_at" | "answered_at",
  from: number,
  expectedCount: number | null,
): Promise<AssessmentPage> {
  const { data, error, count } = await client
    .from(table)
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order(timestampColumn, { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + EXPORT_PAGE_SIZE - 1);

  if (error) throw error;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`Invalid ${table} export count`);
  }
  if (expectedCount !== null && count !== expectedCount) {
    throw new Error(`Changed ${table} export count`);
  }

  const rows = data ?? [];
  if (
    !Array.isArray(rows) ||
    rows.some((row) => typeof row !== "object" || row === null)
  ) {
    throw new Error(`Invalid ${table} export page`);
  }
  if (rows.length > EXPORT_PAGE_SIZE || from + rows.length > count) {
    throw new Error(`Oversized ${table} export page`);
  }
  if (rows.length === 0 && from < count) {
    throw new Error(`Incomplete ${table} export`);
  }

  return {
    rows: rows as Record<string, unknown>[],
    expectedCount: count,
  };
}

async function* streamAssessmentRows(
  client: SupabaseClient,
  table: AssessmentTable,
  userId: string,
  timestampColumn: "started_at" | "answered_at",
  firstPage: AssessmentPage,
): AsyncGenerator<string, void, undefined> {
  let offset = 0;
  let page = firstPage;
  let wroteRow = false;

  while (offset < page.expectedCount) {
    for (const row of page.rows) {
      const serialized = JSON.stringify(row);
      if (serialized === undefined) {
        throw new Error(`Invalid ${table} export row`);
      }
      yield `${wroteRow ? "," : ""}\n    ${serialized}`;
      wroteRow = true;
    }

    offset += page.rows.length;
    if (offset < page.expectedCount) {
      page = await fetchAssessmentPage(
        client,
        table,
        userId,
        timestampColumn,
        offset,
        page.expectedCount,
      );
    }
  }
}

function serializeJsonValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Invalid export payload");
  }
  return serialized;
}

function buildExportPrefix({
  ownerId,
  email,
  exportedAt,
  progress,
  progressUpdatedAt,
  courseResetMarkers,
  rawProgressRows,
}: {
  readonly ownerId: string;
  readonly email: string | null;
  readonly exportedAt: string;
  readonly progress: unknown;
  readonly progressUpdatedAt: unknown;
  readonly courseResetMarkers: unknown;
  readonly rawProgressRows: unknown;
}): string {
  return [
    "{",
    `  "owner_id": ${serializeJsonValue(ownerId)},`,
    `  "email": ${serializeJsonValue(email)},`,
    `  "exported_at": ${serializeJsonValue(exportedAt)},`,
    `  "progress": ${serializeJsonValue(progress)},`,
    `  "progress_updated_at": ${serializeJsonValue(progressUpdatedAt)},`,
    `  "course_reset_markers": ${serializeJsonValue(courseResetMarkers)},`,
    `  "user_course_progress_rows": ${serializeJsonValue(rawProgressRows)},`,
    '  "assessment_runs": [',
  ].join("\n");
}

function reportStreamFailure(error: unknown): void {
  try {
    reportApiError({
      route: "/api/account/export",
      step: "assessment-read",
      error,
    });
  } catch {
    // Observability must never prevent the stream from closing as valid JSON.
  }
}

async function* generateExportBody({
  prefix,
  serviceClient,
  userId,
  firstRunsPage,
  firstAnswersPage,
}: {
  readonly prefix: string;
  readonly serviceClient: SupabaseClient;
  readonly userId: string;
  readonly firstRunsPage: AssessmentPage;
  readonly firstAnswersPage: AssessmentPage;
}): AsyncGenerator<string, void, undefined> {
  yield prefix;

  let phase: AssessmentTable = "assessment_runs";
  try {
    yield* streamAssessmentRows(
      serviceClient,
      "assessment_runs",
      userId,
      "started_at",
      firstRunsPage,
    );
    phase = "assessment_answers";
    yield '\n  ],\n  "assessment_answers": [';
    yield* streamAssessmentRows(
      serviceClient,
      "assessment_answers",
      userId,
      "answered_at",
      firstAnswersPage,
    );
    yield '\n  ],\n  "certificates": [],\n  "export_complete": true\n}\n';
  } catch (error) {
    reportStreamFailure(error);
    if (phase === "assessment_runs") {
      yield '\n  ],\n  "assessment_answers": [],';
    } else {
      yield "\n  ],";
    }
    yield '\n  "certificates": [],\n  "export_error": "export_failed",\n  "export_complete": false\n}\n';
  }
}

function createJsonStream(
  chunks: AsyncGenerator<string, void, undefined>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await chunks.next();
        if (next.done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });
}

async function exportBoundAccount(
  request: Request,
  expectedOwnerId: string | null | undefined,
): Promise<Response> {
  const authentication = await authenticateBoundOwner(
    request,
    expectedOwnerId,
  );
  if (!authentication.ok) return authentication.response;
  const { user } = authentication;

  // A complete export can force multiple ordered scans over historical
  // assessment data. Bind the budget to both the authenticated account and the
  // trusted Vercel client address before creating clients or reading any rows.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "account-export",
        request,
        user.id,
      ),
      windowSeconds: EXPORT_RATE_LIMIT_WINDOW_SECONDS,
      max: EXPORT_USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return jsonError("rate_limit_exceeded", 429);
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("account-export-ip", request),
      windowSeconds: EXPORT_RATE_LIMIT_WINDOW_SECONDS,
      max: EXPORT_CLIENT_RATE_LIMIT_MAX,
    });
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "rate-limit",
      error,
      request,
    });
    return jsonError("rate_limit_unavailable", 503);
  }
  if (!clientAllowed) {
    return jsonError("rate_limit_exceeded", 429);
  }

  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "auth-create-client",
      error,
    });
    return jsonError("auth_unavailable", 503);
  }
  if (!supabase) {
    return jsonError("auth_not_configured", 503);
  }

  let fetched;
  try {
    fetched = await fetchUnifiedProgressForUser(supabase, user.id);
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "supabase-read",
      error,
    });
    return jsonError("export_failed", 500);
  }

  // A failed read must not silently export progress: null — that would look
  // like "no data stored" in a DSGVO data export. Fail loudly instead.
  if (!fetched.ok) {
    reportApiError({ route: "/api/account/export", step: "supabase-read", error: fetched.error });
    return jsonError("export_failed", 500);
  }

  // Dormant assessment tables may contain historical browser-written attempts.
  // They remain account-linked personal data even though no current route
  // writes them, so a complete export must include them or fail loudly.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return jsonError("export_store_unavailable", 503);
  }
  let firstRunsPage;
  let firstAnswersPage;
  try {
    [firstRunsPage, firstAnswersPage] = await Promise.all([
      fetchAssessmentPage(
        serviceClient,
        "assessment_runs",
        user.id,
        "started_at",
        0,
        null,
      ),
      fetchAssessmentPage(
        serviceClient,
        "assessment_answers",
        user.id,
        "answered_at",
        0,
        null,
      ),
    ]);
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "assessment-read",
      error,
    });
    return jsonError("export_failed", 500);
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `loehrning-export-${today}.json`;
  let prefix;
  try {
    prefix = buildExportPrefix({
      ownerId: user.id,
      email: user.email ?? null,
      exportedAt: new Date().toISOString(),
      progress: fetched.result.progress,
      progressUpdatedAt: fetched.result.updatedAt,
      courseResetMarkers: fetched.result.courseResetAt,
      rawProgressRows: fetched.result.rawRows,
    });
  } catch (error) {
    reportApiError({
      route: "/api/account/export",
      step: "export-serialize",
      error,
    });
    return jsonError("export_failed", 500);
  }

  const body = generateExportBody({
    prefix,
    serviceClient,
    userId: user.id,
    firstRunsPage,
    firstAnswersPage,
  });

  return new Response(createJsonStream(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

export function GET(request: Request): Promise<Response> {
  return exportBoundAccount(
    request,
    request.headers.get("x-loehrning-expected-owner-id"),
  );
}

const FORM_EXPORT_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  account_owner_mismatch:
    "Die bestätigte Kontozuordnung hat sich geändert. Starte den Export erneut von der Datenschutzseite.",
  auth_not_configured:
    "Der Datenexport ist in dieser Umgebung nicht eingerichtet.",
  auth_unavailable:
    "Die Anmeldung konnte vorübergehend nicht geprüft werden.",
  export_failed:
    "Die gespeicherten Kontodaten konnten nicht vollständig gelesen werden.",
  export_store_unavailable:
    "Der geschützte Export-Datenspeicher ist vorübergehend nicht verfügbar.",
  invalid_owner_binding:
    "Die Kontozuordnung des Exportauftrags ist ungültig.",
  rate_limit_exceeded:
    "Für dieses Konto wurden zu viele Exportaufträge gestartet. Warte bis zu einer Stunde vor einem neuen Versuch.",
  rate_limit_unavailable:
    "Der Missbrauchsschutz des Datenexports ist vorübergehend nicht verfügbar.",
  unauthorized:
    "Die Anmeldung ist nicht mehr gültig. Melde dich erneut an und starte den Export noch einmal.",
};

async function formExportErrorResponse(response: Response): Promise<Response> {
  let errorCode = "export_failed";
  try {
    const payload = (await response.json()) as { readonly error?: unknown };
    if (
      typeof payload.error === "string" &&
      /^[a-z0-9_]{1,80}$/.test(payload.error)
    ) {
      errorCode = payload.error;
    }
  } catch {
    // The standalone error document still uses a bounded generic code.
  }
  const mappedMessage = FORM_EXPORT_ERROR_MESSAGES[errorCode];
  const message =
    typeof mappedMessage === "string"
      ? mappedMessage
      : "Der Exportauftrag konnte nicht abgeschlossen werden.";

  return new Response(
    [
      "<!doctype html>",
      '<html lang="de">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="robots" content="noindex,nofollow,noarchive">',
      "<title>Datenexport fehlgeschlagen · Loehrning</title>",
      "</head>",
      "<body>",
      "<main>",
      "<h1>Datenexport fehlgeschlagen</h1>",
      `<p>${message}</p>`,
      "<p>Es wurde keine vollständige Exportdatei bereitgestellt.</p>",
      `<p>Fehlercode: <code>${errorCode}</code></p>`,
      '<p><a href="/konto/datenschutz">Zurück zu Datenschutz und Datenverwaltung</a></p>',
      "</main>",
      "</body>",
      "</html>",
    ].join(""),
    {
      status: response.status >= 400 ? response.status : 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Language": "de",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        ...(errorCode === "rate_limit_exceeded"
          ? { "Retry-After": String(EXPORT_RATE_LIMIT_WINDOW_SECONDS) }
          : {}),
      },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginPost(request)) {
    return jsonError("cross_origin_request_rejected", 403);
  }

  let body: string;
  try {
    body = await readBoundedRequestText(request);
  } catch {
    return jsonError("invalid_export_request", 400);
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType === "application/json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return jsonError("invalid_export_request", 400);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonError("invalid_export_request", 400);
    }
    const record = parsed as Record<string, unknown>;
    if (
      Object.keys(record).sort().join(",") !==
        "expectedOwnerId,preflight" ||
      record.preflight !== true ||
      typeof record.expectedOwnerId !== "string"
    ) {
      return jsonError("invalid_export_request", 400);
    }
    const authentication = await authenticateBoundOwner(
      request,
      record.expectedOwnerId,
    );
    if (!authentication.ok) return authentication.response;
    // Do the cheap, deterministic service-store readiness check while the
    // client is still using fetch(). "Ready" must never mean that a required
    // exporter client is already known to be absent.
    if (!tryCreateServiceClient()) {
      return jsonError("export_store_unavailable", 503);
    }
    return new Response(
      JSON.stringify({
        ready: true,
        ownerId: authentication.user.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Cross-Origin-Resource-Policy": "same-origin",
        },
      },
    );
  }

  if (contentType !== "application/x-www-form-urlencoded") {
    return jsonError("invalid_export_request", 415);
  }
  const form = new URLSearchParams(body);
  if (
    [...form.keys()].some((key) => key !== "expectedOwnerId") ||
    form.getAll("expectedOwnerId").length !== 1
  ) {
    return jsonError("invalid_export_request", 400);
  }
  const response = await exportBoundAccount(
    request,
    form.get("expectedOwnerId"),
  );
  return response.ok ? response : formExportErrorResponse(response);
}
