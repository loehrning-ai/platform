import type { SupabaseClient } from "@supabase/supabase-js";
import { externalRequestUrl, trustedRequestOrigin } from "@/lib/auth/origin";
import { isLocale, localizeHref, type Locale } from "@/lib/i18n/locale";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import { isCvEngineHostedReady } from "@/lib/provider-readiness";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import {
  fetchOwnedRowsPage,
  streamOwnedRowFragments,
  type OwnedRowsPage,
  type OwnedRowsSource,
} from "./owned-rows";

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
  const trustedOrigin = trustedRequestOrigin(externalRequestUrl(request));
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

/**
 * Every table this account reads, in the order the exported document lists it.
 *
 * A DSGVO export that quietly omits a table is indistinguishable from an
 * account that never stored anything there, so each surface the signed-in
 * account reads gets a section here. `documents` belongs to the hosted
 * cv-engine and only exists where `isCvEngineHostedReady()` is true; in every
 * other deployment its section is marked `not_enabled` instead of dropped.
 */
const ASSESSMENT_RUNS: OwnedRowsSource = {
  table: "assessment_runs",
  orderColumns: ["started_at", "id"],
  reportStep: "assessment-read",
};
const ASSESSMENT_ANSWERS: OwnedRowsSource = {
  table: "assessment_answers",
  orderColumns: ["answered_at", "id"],
  reportStep: "assessment-read",
};
const CV_ENGINE_DOCUMENTS: OwnedRowsSource = {
  table: "documents",
  orderColumns: ["updated_at", "id"],
  reportStep: "supabase-read",
};

/**
 * What happened to one section of the exported document.
 *
 * An empty JSON array cannot say on its own whether the learner stored
 * nothing or whether the read failed. The manifest answers that for every
 * section, which is why a failing table is marked here instead of silently
 * exported as `[]`.
 *
 * - `complete`: every row of that table is in this file.
 * - `incomplete`: the read failed part-way; the rows already written are kept.
 * - `unavailable`: the table could not be read at all; `[]` is not evidence.
 * - `not_attempted`: skipped because an earlier section failed first.
 * - `not_enabled`: the capability behind the table is off in this deployment,
 *   so the account holds no rows there.
 * - `derived_from_progress`: computed from `progress`, never stored as rows.
 */
type ExportSectionStatus =
  | "complete"
  | "incomplete"
  | "unavailable"
  | "not_attempted"
  | "not_enabled"
  | "derived_from_progress";

interface ExportSection {
  readonly name: string;
  readonly status: ExportSectionStatus;
  readonly error?: string;
}

const SECTION_STATUSES_WITHOUT_MISSING_DATA: readonly ExportSectionStatus[] = [
  "complete",
  "not_enabled",
  "derived_from_progress",
];


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

function reportStreamFailure(error: unknown, step: string): void {
  try {
    reportApiError({
      route: "/api/account/export",
      step,
      error,
    });
  } catch {
    // Observability must never prevent the stream from closing as valid JSON.
  }
}

function serializeSections(sections: readonly ExportSection[]): string {
  return [
    "[",
    sections
      .map((section) => `    ${serializeJsonValue(section)}`)
      .join(",\n"),
    "  ]",
  ].join("\n");
}

/**
 * Stream one owned table as JSON array members and report how it went.
 *
 * `firstPage` is supplied for tables whose first page was already read before
 * the response started, so a total failure there could still answer with a
 * clean HTTP error. Pass `null` for a table that must never abort the export:
 * its first read happens here, and a failure becomes a marked section instead
 * of a lost export of everything else.
 */
async function* streamOwnedSection(
  client: SupabaseClient,
  source: OwnedRowsSource,
  userId: string,
  firstPage: OwnedRowsPage | null,
): AsyncGenerator<string, ExportSection, undefined> {
  let wroteRow = false;
  try {
    const page =
      firstPage ?? (await fetchOwnedRowsPage(client, source, userId, 0, null));
    for await (const fragment of streamOwnedRowFragments(
      client,
      source,
      userId,
      page,
    )) {
      wroteRow = true;
      yield fragment;
    }
    return { name: source.table, status: "complete" };
  } catch (error) {
    reportStreamFailure(error, source.reportStep);
    return {
      name: source.table,
      status: wroteRow ? "incomplete" : "unavailable",
      error: `${source.table}_read_failed`,
    };
  }
}

async function* generateExportBody({
  prefix,
  serviceClient,
  documentsClient,
  userId,
  firstRunsPage,
  firstAnswersPage,
}: {
  readonly prefix: string;
  readonly serviceClient: SupabaseClient;
  /** Cookie-bound RLS client, or null when the hosted tool is not enabled. */
  readonly documentsClient: SupabaseClient | null;
  readonly userId: string;
  readonly firstRunsPage: OwnedRowsPage;
  readonly firstAnswersPage: OwnedRowsPage;
}): AsyncGenerator<string, void, undefined> {
  yield prefix;

  // The progress read finished before the response started and answers 500 on
  // failure, so it is always complete by the time this document exists.
  let sections: readonly ExportSection[] = [
    { name: "user_course_progress", status: "complete" },
  ];

  const runs = yield* streamOwnedSection(
    serviceClient,
    ASSESSMENT_RUNS,
    userId,
    firstRunsPage,
  );
  sections = [...sections, runs];

  yield '\n  ],\n  "assessment_answers": [';
  // A failed table stops the remaining reads: the export is already known to
  // be incomplete, and each skipped section says so rather than closing as an
  // empty array that reads like "nothing stored".
  let answers: ExportSection = {
    name: ASSESSMENT_ANSWERS.table,
    status: "not_attempted",
    error: "earlier_section_failed",
  };
  if (runs.status === "complete") {
    answers = yield* streamOwnedSection(
      serviceClient,
      ASSESSMENT_ANSWERS,
      userId,
      firstAnswersPage,
    );
  }
  sections = [...sections, answers];

  // Hosted cv-engine documents are read through the cookie-bound client, so
  // row-level security decides ownership for a table this project does not
  // own. A missing or renamed column can then only fail the read, never widen
  // it. The table lives outside this project's migrations, so a read failure
  // marks its section and leaves the rest of the export intact.
  yield '\n  ],\n  "documents": [';
  let documents: ExportSection = { name: CV_ENGINE_DOCUMENTS.table, status: "not_enabled" };
  if (documentsClient && answers.status !== "complete") {
    documents = {
      name: CV_ENGINE_DOCUMENTS.table,
      status: "not_attempted",
      error: "earlier_section_failed",
    };
  } else if (documentsClient) {
    documents = yield* streamOwnedSection(
      documentsClient,
      CV_ENGINE_DOCUMENTS,
      userId,
      null,
    );
  }
  sections = [
    ...sections,
    documents,
    { name: "certificates", status: "derived_from_progress" },
  ];

  const complete = sections.every((section) =>
    SECTION_STATUSES_WITHOUT_MISSING_DATA.includes(section.status),
  );
  yield `\n  ],\n  "certificates": [],\n  "sections": ${serializeSections(sections)},\n`;
  if (!complete) {
    yield '  "export_error": "export_failed",\n';
  }
  yield `  "export_complete": ${complete}\n}\n`;
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
      fetchOwnedRowsPage(serviceClient, ASSESSMENT_RUNS, user.id, 0, null),
      fetchOwnedRowsPage(serviceClient, ASSESSMENT_ANSWERS, user.id, 0, null),
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
    documentsClient: isCvEngineHostedReady() ? supabase : null,
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

const FORM_EXPORT_ERROR_MESSAGES_EN: Readonly<Record<string, string>> = {
  account_owner_mismatch:
    "The confirmed account assignment changed. Restart the export from the privacy page.",
  auth_not_configured: "Data export is not configured in this environment.",
  auth_unavailable: "The sign-in could not be verified at present.",
  export_failed: "The stored account data could not be read completely.",
  export_store_unavailable:
    "The protected export data store is temporarily unavailable.",
  invalid_owner_binding: "The account assignment for the export is invalid.",
  rate_limit_exceeded:
    "Too many export requests were started for this account. Wait up to one hour before trying again.",
  rate_limit_unavailable:
    "The data export abuse-prevention control is temporarily unavailable.",
  unauthorized:
    "The sign-in is no longer valid. Sign in again and restart the export.",
};

async function formExportErrorResponse(
  response: Response,
  locale: Locale,
): Promise<Response> {
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
  const messages =
    locale === "en"
      ? FORM_EXPORT_ERROR_MESSAGES_EN
      : FORM_EXPORT_ERROR_MESSAGES;
  const mappedMessage = messages[errorCode];
  const message =
    typeof mappedMessage === "string"
      ? mappedMessage
      : locale === "en"
        ? "The export request could not be completed."
        : "Der Exportauftrag konnte nicht abgeschlossen werden.";
  const documentCopy =
    locale === "en"
      ? {
          title: "Data export failed · Loehrning",
          heading: "Data export failed",
          incomplete: "No complete export file was provided.",
          errorCode: "Error code",
          back: "Back to privacy and data management",
        }
      : {
          title: "Datenexport fehlgeschlagen · Loehrning",
          heading: "Datenexport fehlgeschlagen",
          incomplete: "Es wurde keine vollständige Exportdatei bereitgestellt.",
          errorCode: "Fehlercode",
          back: "Zurück zu Datenschutz und Datenverwaltung",
        };
  const backHref = localizeHref("/konto/datenschutz", locale);

  return new Response(
    [
      "<!doctype html>",
      `<html lang="${locale}">`,
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="robots" content="noindex,nofollow,noarchive">',
      `<title>${documentCopy.title}</title>`,
      "</head>",
      "<body>",
      "<main>",
      `<h1>${documentCopy.heading}</h1>`,
      `<p>${message}</p>`,
      `<p>${documentCopy.incomplete}</p>`,
      `<p>${documentCopy.errorCode}: <code>${errorCode}</code></p>`,
      `<p><a href="${backHref}">${documentCopy.back}</a></p>`,
      "</main>",
      "</body>",
      "</html>",
    ].join(""),
    {
      status: response.status >= 400 ? response.status : 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Language": locale,
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
    [...form.keys()].some(
      (key) => key !== "expectedOwnerId" && key !== "locale",
    ) ||
    form.getAll("expectedOwnerId").length !== 1 ||
    form.getAll("locale").length > 1
  ) {
    return jsonError("invalid_export_request", 400);
  }
  const requestedLocale = form.get("locale");
  if (requestedLocale !== null && !isLocale(requestedLocale)) {
    return jsonError("invalid_export_request", 400);
  }
  const response = await exportBoundAccount(
    request,
    form.get("expectedOwnerId"),
  );
  return response.ok
    ? response
    : formExportErrorResponse(response, requestedLocale ?? "de");
}
