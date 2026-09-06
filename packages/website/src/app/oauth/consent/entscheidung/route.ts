import { NextResponse, type NextRequest } from "next/server";
import { externalRequestUrl, trustedRequestOrigin } from "@/lib/auth/origin";
import { isLocale, localizeHref, type Locale } from "@/lib/i18n/locale";
import { reportApiError } from "@/lib/observability/api-error";
import { isOAuthServerReady } from "@/lib/provider-readiness";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import {
  readAuthorizationId,
  submitConsentDecision,
  type ConsentDecision,
} from "../authorization";
import type { ConsentErrorKind } from "../consent-copy";
import { hasFormContentType, readBoundedForm } from "../form-body";

const MAX_FORM_BYTES = 2_048;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const USER_RATE_LIMIT_MAX = 20;
const CLIENT_RATE_LIMIT_MAX = 60;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function textResponse(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

function privateRedirect(url: URL | string): NextResponse {
  // 303 so the browser follows with GET: the decision has been recorded, and
  // a reload must never replay the POST against a consumed authorization.
  const response = NextResponse.redirect(url, 303);
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function readLocale(value: string | null): Locale {
  return isLocale(value) ? value : "de";
}

function readDecision(value: string | null): ConsentDecision | null {
  if (value === "zustimmen") return "approve";
  if (value === "ablehnen") return "deny";
  return null;
}

/**
 * Back to our own consent page, never onward to the OAuth client. An
 * authorization that could not be recorded must not be able to steer the
 * browser to a third party, so every failure lands on a page we render.
 */
function consentPageUrl(
  origin: URL,
  locale: Locale,
  authorizationId: string,
  error: ConsentErrorKind | null,
): URL {
  const url = new URL(localizeHref("/oauth/consent", locale), origin);
  url.searchParams.set("authorization_id", authorizationId);
  if (error) url.searchParams.set("fehler", error);
  return url;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Fail closed before anything else: with the OAuth server unconfirmed the
  // platform has no authorization surface at all, so this path does not exist.
  if (!isOAuthServerReady()) {
    return textResponse("Nicht gefunden.", 404);
  }

  const trustedOrigin = trustedRequestOrigin(externalRequestUrl(request));
  const suppliedOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    !trustedOrigin ||
    suppliedOrigin !== trustedOrigin.origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    return textResponse(
      "Diese Entscheidung muss von der Freigabeseite selbst kommen.",
      403,
    );
  }

  if (!hasFormContentType(request)) {
    return textResponse("Unerwartetes Format der Anfrage.", 415);
  }

  const body = await readBoundedForm(request, MAX_FORM_BYTES);
  if (!body.ok) {
    return textResponse(
      body.error === "body_too_large"
        ? "Die Anfrage ist zu groß."
        : "Die Anfrage konnte nicht gelesen werden.",
      body.error === "body_too_large" ? 413 : 400,
    );
  }

  const locale = readLocale(body.value.get("sprache"));
  const decision = readDecision(body.value.get("entscheidung"));
  const identifier = readAuthorizationId(
    body.value.get("authorization_id") ?? undefined,
  );
  if (!decision || !identifier.ok) {
    return textResponse("Unvollständige Entscheidung.", 400);
  }

  const auth = await getAuthenticatedUser();
  if (auth.error) {
    reportApiError({ step: "auth-get-user", error: auth.error, request });
    return privateRedirect(
      consentPageUrl(
        trustedOrigin,
        locale,
        identifier.authorizationId,
        "backend-unavailable",
      ),
    );
  }
  // Signed out, or the account backend is not configured: the consent page
  // owns both answers, including the sign-in redirect that preserves the
  // request. Sending the learner there keeps one place responsible for it.
  if (!auth.configured || !auth.user) {
    return privateRedirect(
      consentPageUrl(trustedOrigin, locale, identifier.authorizationId, null),
    );
  }

  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "oauth-consent",
        request,
        auth.user.id,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    const clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("oauth-consent-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
    if (!userAllowed || !clientAllowed) {
      return textResponse(
        "Zu viele Entscheidungen in kurzer Zeit. Versuche es gleich noch einmal.",
        429,
      );
    }
  } catch (rateLimitError) {
    reportApiError({ step: "rate-limit", error: rateLimitError, request });
    return textResponse(
      "Die Freigabe ist gerade nicht erreichbar. Versuche es später noch einmal.",
      503,
    );
  }

  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({ step: "auth-create-client", error, request });
    supabase = null;
  }
  if (!supabase) {
    return privateRedirect(
      consentPageUrl(
        trustedOrigin,
        locale,
        identifier.authorizationId,
        "backend-unavailable",
      ),
    );
  }

  const result = await submitConsentDecision(
    supabase,
    identifier.authorizationId,
    decision,
  );
  if (result.kind === "error") {
    return privateRedirect(
      consentPageUrl(
        trustedOrigin,
        locale,
        identifier.authorizationId,
        result.error,
      ),
    );
  }
  return privateRedirect(result.url);
}

export function GET(): NextResponse {
  const response = textResponse(
    "Diese Adresse nimmt nur die Entscheidung von der Freigabeseite entgegen.",
    405,
  );
  response.headers.set("Allow", "POST");
  return response;
}
