/**
 * Session handoff into the hosted cv-engine.
 *
 * POST /konto/werkzeuge/cv-engine/oeffnen
 *
 * The Werkzeuge card submits an ordinary same-origin HTML form here:
 *
 *   <form method="post" action="/konto/werkzeuge/cv-engine/oeffnen">
 *     <button type="submit">Öffnen</button>
 *   </form>
 *
 * No fields, no JavaScript, no request body. A form POST is used rather than a
 * link because the request mints a one-time sign-in token, and a GET would let
 * a prefetch, a crawler, or a shared URL burn that token silently.
 *
 * What happens on the happy path: the cookie-bound session is verified, a
 * per-account budget is charged, the Auth admin API mints a one-time magic-link
 * token for the signed-in address, and the browser is sent to the hosted tool's
 * handoff bridge with that token in the URL fragment. The fragment never
 * reaches any server, so the credential cannot land in an access log.
 *
 * What happens otherwise: every failure that is not a security refusal ends in
 * the same place, the hosted tool's own sign-in with a short notice. The admin
 * API may decline to mint a magic link for an account that only ever signed in
 * through an identity provider; it may time out; it may answer with a payload
 * this route refuses to trust. None of those are worth an error page, because
 * the learner can simply sign in on the hosted tool, so the handoff is an
 * accelerator and never a requirement.
 *
 * Security refusals are different and answer with a status, not a redirect: a
 * cross-origin submission (403), a body this route does not accept (415), a
 * request while the capability is off (404), an exhausted budget (429), and an
 * authentication backend that is down (503). Handing a redirect to those would
 * turn the refusal into a usable side effect.
 *
 * The token is never logged, never reported, and never returned in a body.
 */
import { NextResponse, type NextRequest } from "next/server";
import { externalRequestUrl, trustedRequestOrigin } from "@/lib/auth/origin";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
// Route handlers are the sanctioned context for the privileged Supabase
// client. This file is a route handler, never a page or a component, and the
// client it constructs is used for exactly one call.
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { cvEngineHandoffUrl, cvEngineSignInUrl } from "../handoff-url";
import { cvEngineHandoffOrigin } from "../hosted-readiness";

const ROUTE = "/konto/werkzeuge/cv-engine/oeffnen";

/**
 * Five handoffs per account per minute. One deliberate click needs one, and a
 * learner who double submits or reloads needs a couple more; beyond that the
 * requests are automated, and every one of them mints a live credential. The
 * independent client ceiling keeps cheap account creation from multiplying the
 * per-account budget.
 */
const RATE_LIMIT_WINDOW_SECONDS = 60;
const USER_RATE_LIMIT_MAX = 5;
const CLIENT_RATE_LIMIT_MAX = 30;

/**
 * The Auth admin call is a single round trip in front of a waiting learner.
 * Waiting out a stalled connection would hold the request open with nothing to
 * show for it, so an unanswered mint becomes the sign-in fallback instead.
 */
const GENERATE_LINK_TIMEOUT_MS = 5_000;

/** Content types an HTML form is able to send. Anything else is refused. */
const ACCEPTED_CONTENT_TYPES = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
] as const;

/** Longest address the Auth API accepts, per RFC 5321 path length. */
const MAX_EMAIL_LENGTH = 320;

class CvEngineHandoffTimeoutError extends Error {
  readonly code = "CV_ENGINE_HANDOFF_TIMEOUT";

  constructor() {
    super("Hosted cv-engine link generation exceeded its time budget");
    this.name = "CvEngineHandoffTimeoutError";
  }
}

class CvEngineHandoffPayloadError extends Error {
  readonly code = "CV_ENGINE_HANDOFF_PAYLOAD";

  constructor() {
    // Deliberately says nothing about the payload it rejected: that payload
    // carries the one-time token.
    super("Hosted cv-engine link generation returned no usable token");
    this.name = "CvEngineHandoffPayloadError";
  }
}

function privateHeaders(extra?: Record<string, string>): Headers {
  return new Headers({
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    ...extra,
  });
}

function plainText(body: string, status: number, extra?: Record<string, string>) {
  const headers = privateHeaders(extra);
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new NextResponse(body, { status, headers });
}

/**
 * A 303 rather than the default 307: the browser must follow the destination
 * with a GET. A 307 would replay this POST against the hosted tool.
 *
 * `Referrer-Policy: no-referrer` keeps the account URL the learner came from
 * out of the request to the hosted host. The token itself is already safe from
 * a Referer header, which never carries a fragment.
 */
function seeOther(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: privateHeaders({
      Location: location,
      "Referrer-Policy": "no-referrer",
    }),
  });
}

function hasAcceptedContentType(request: Request): boolean {
  const header = request.headers.get("content-type");
  if (!header) return false;
  const mediaType = header.split(";")[0]?.trim().toLowerCase() ?? "";
  return (ACCEPTED_CONTENT_TYPES as readonly string[]).includes(mediaType);
}

/**
 * Same-origin gate, identical in shape to the sign-out endpoint's.
 *
 * A form POST is a CORS simple request, so a page on any origin can submit one
 * with the learner's cookies attached. Without this check that page could burn
 * the account's budget and drive the learner's browser to the hosted tool at a
 * moment of its choosing.
 */
function isSameOriginSubmission(
  request: NextRequest,
  trustedOrigin: URL | null,
): boolean {
  const suppliedOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(
    trustedOrigin &&
      suppliedOrigin === trustedOrigin.origin &&
      (fetchSite === null || fetchSite === "same-origin"),
  );
}

/**
 * Resolves the mint or rejects with a named timeout.
 *
 * The losing promise stays attached to this race, so a later rejection from the
 * abandoned request is still handled. A mint that lands after the deadline
 * simply produces an unused one-time token, which expires on its own.
 */
async function withTimeBudget<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new CvEngineHandoffTimeoutError()), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function signedInEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LENGTH) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  const requestUrl = externalRequestUrl(request);
  const trustedOrigin = trustedRequestOrigin(requestUrl);
  if (!isSameOriginSubmission(request, trustedOrigin)) {
    return plainText(
      "Diese Anfrage stammt nicht von loehrning.ai und wurde abgelehnt.",
      403,
    );
  }
  if (!hasAcceptedContentType(request)) {
    return plainText(
      "Dieser Endpunkt nimmt nur ein abgesendetes Formular entgegen.",
      415,
    );
  }

  // Fail closed before anything else is touched. Without a reviewed hosted
  // origin there is no destination to send anyone to, so the capability does
  // not exist rather than degrading to a redirect.
  const hostedOrigin = cvEngineHandoffOrigin();
  if (!hostedOrigin) {
    return plainText(
      "Der gehostete Lebenslauf-Editor ist in dieser Umgebung nicht eingerichtet.",
      404,
    );
  }

  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({ route: ROUTE, step: "auth-get-user", error });
    return plainText(
      "Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es gleich erneut.",
      503,
      { "Retry-After": "30" },
    );
  }
  if (!auth.configured || auth.error) {
    if (auth.error) {
      reportApiError({ route: ROUTE, step: "auth-get-user", error: auth.error });
    }
    return plainText(
      "Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es gleich erneut.",
      503,
      { "Retry-After": "30" },
    );
  }
  if (!auth.user) {
    // Middleware normally redirects an anonymous request to this path before it
    // reaches the handler. Keep the same answer here so a direct submission
    // cannot reach the mint without a session.
    const loginUrl = new URL("/login", trustedOrigin ?? requestUrl.origin);
    loginUrl.searchParams.set("next", "/konto");
    return seeOther(loginUrl.toString());
  }

  const email = signedInEmail(auth.user.email);
  if (!email) {
    // An account without a usable address can never receive a magic link. That
    // is not a failure worth reporting, it is a permanent property of the
    // account, so it takes the sign-in fallback directly.
    return seeOther(cvEngineSignInUrl(hostedOrigin));
  }

  // The per-account budget is charged first, then the independent client
  // ceiling. A refused budget is a refusal, never a fallback redirect: a
  // fallback would make the limit free to bypass by simply following it.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "cv-engine-handoff",
        request,
        auth.user.id,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return plainText(
        "Zu viele Versuche. Bitte warte eine Minute und öffne den Editor dann erneut.",
        429,
        { "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS) },
      );
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("cv-engine-handoff-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return plainText(
      "Der Schutz vor zu vielen Anfragen ist gerade nicht verfügbar. Bitte versuche es gleich erneut.",
      503,
      { "Retry-After": "30" },
    );
  }
  if (!clientAllowed) {
    return plainText(
      "Zu viele Versuche. Bitte warte eine Minute und öffne den Editor dann erneut.",
      429,
      { "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS) },
    );
  }

  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    reportApiError({ route: ROUTE, step: "auth-create-client", error });
    return seeOther(cvEngineSignInUrl(hostedOrigin));
  }

  let handoffUrl: string;
  try {
    // No `redirectTo` is requested. Only the hashed token is used, so the
    // action link the Auth API builds around it is irrelevant, and asking for a
    // redirect target would add an allowlist dependency that can only fail.
    const generated = await withTimeBudget(
      adminClient.auth.admin.generateLink({ type: "magiclink", email }),
      GENERATE_LINK_TIMEOUT_MS,
    );
    if (generated.error) throw generated.error;
    const destination = cvEngineHandoffUrl(
      hostedOrigin,
      generated.data?.properties?.hashed_token,
    );
    if (!destination) throw new CvEngineHandoffPayloadError();
    handoffUrl = destination;
  } catch (error) {
    // The caught value is an Auth error, a transport rejection, or one of this
    // route's own named errors. None of them is ever the response payload, so
    // no token can reach the reporter.
    reportApiError({ route: ROUTE, step: "auth-generate-link", error });
    return seeOther(cvEngineSignInUrl(hostedOrigin));
  }

  return seeOther(handoffUrl);
}

export function GET() {
  return plainText("Nutze POST, um den Editor zu öffnen.", 405, {
    Allow: "POST",
  });
}
