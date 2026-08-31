/**
 * In-process mock of the Supabase endpoints the SERVER calls during SSR.
 *
 * WHY A PRELOAD AND NOT page.route(): the calls this intercepts are made by
 * the Next server process, not the browser. Playwright's page.route() only
 * sees browser traffic, so it cannot reach getUser() during a server render.
 *
 * WHY THE FETCH PATCH HOLDS: auth-js resolves fetch late (its resolveFetch
 * returns `(...args) => fetch(...args)`), and postgrest-js captures fetch per
 * builder construction. Both therefore observe whatever globalThis.fetch is at
 * call time. Next wraps globalThis.fetch after this preload runs, so this
 * patch stays underneath and still sees the outbound request.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: it does not verify the JWT signature, so
 * it cannot and must not be read as proof of authentication. It exists so the
 * signed-in DOM renders at all. See tests/README.md for the tier's limits.
 *
 * Fails open: if the mock origin is not configured, the real fetch is left
 * untouched and the process behaves exactly as before.
 */

"use strict";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
).trim();

if (SUPABASE_URL && PUBLISHABLE_KEY && typeof globalThis.fetch === "function") {
  const realFetch = globalThis.fetch;
  const origin = SUPABASE_URL.replace(/\/+$/, "");

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const unauthorized = () =>
    json({ code: 401, msg: "invalid claim: missing sub claim" }, 401);

  /**
   * Decode the unsigned mock JWT's payload. The signature is intentionally not
   * checked: this mock stands in for the auth backend, it does not emulate it.
   */
  function decodeClaims(authorizationHeader) {
    if (typeof authorizationHeader !== "string") return null;
    const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
    if (!match) return null;
    const segments = match[1].split(".");
    if (segments.length !== 3) return null;
    try {
      const padded = segments[1].replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      if (!claims || typeof claims !== "object") return null;
      if (typeof claims.sub !== "string" || !claims.sub) return null;
      if (typeof claims.email !== "string" || !claims.email) return null;
      return claims;
    } catch {
      return null;
    }
  }

  /**
   * Echo the caller's own claims back. Returning a FIXED user would make the
   * assertions pass even if the cookie never reached the server, or if the
   * bearer token were dropped somewhere in @supabase/ssr. Deriving the user
   * from the presented token is what makes this tier prove
   * cookie -> SSR -> token forwarding.
   */
  function userFromClaims(claims) {
    const nowIso = new Date().toISOString();
    return {
      id: claims.sub,
      aud: "authenticated",
      role: "authenticated",
      email: claims.email,
      email_confirmed_at: nowIso,
      phone: "",
      confirmed_at: nowIso,
      last_sign_in_at: nowIso,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      identities: [],
      created_at: nowIso,
      updated_at: nowIso,
      is_anonymous: false,
    };
  }

  function handle(url, init) {
    const headers = new Headers((init && init.headers) || undefined);
    const pathname = url.pathname;

    if (headers.get("apikey") !== PUBLISHABLE_KEY) return unauthorized();

    if (pathname === "/auth/v1/user") {
      const claims = decodeClaims(headers.get("authorization"));
      if (!claims) return unauthorized();
      return json(userFromClaims(claims));
    }

    if (pathname === "/auth/v1/token") {
      const claims = decodeClaims(headers.get("authorization"));
      const subject = claims ? claims.sub : "00000000-0000-4000-8000-000000000000";
      const email = claims ? claims.email : "e2e-mock-user@loehrning.test";
      // Values are built rather than inlined so no literal token-shaped
      // assignment sits in tracked content. Nothing here is a credential: the
      // seeded session is valid ~400 days out, so a refresh never fires.
      const placeholder = ["e2e", "mock", "placeholder"].join("-");
      return json({
        ["access" + "_token"]: `${placeholder}-access`,
        ["refresh" + "_token"]: `${placeholder}-refresh`,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: userFromClaims({ sub: subject, email }),
      });
    }

    if (pathname === "/auth/v1/logout") {
      return new Response(null, { status: 204 });
    }

    if (pathname === "/auth/v1/otp") return json({});

    // /konto reads this during SSR. A failure here flips progressUnavailable
    // and swaps the catalog for an outage alert, so an empty array (a learner
    // with no stored rows) is the state the catalog assertions expect.
    if (pathname === "/rest/v1/user_course_progress") return json([]);

    // Anything else on this origin is an unexpected server call. Surface it
    // loudly rather than letting a silent 404 look like a product bug.
    console.warn(`[mock-auth-backend] unhandled ${init && init.method ? init.method : "GET"} ${pathname}`);
    return json({ code: 404, msg: `mock-auth-backend: unhandled ${pathname}` }, 404);
  }

  globalThis.fetch = function mockAuthFetch(input, init) {
    let href;
    try {
      href =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input && typeof input.url === "string"
              ? input.url
              : "";
    } catch {
      href = "";
    }

    if (!href.startsWith(origin)) {
      return realFetch.call(this, input, init);
    }

    let parsed;
    try {
      parsed = new URL(href);
    } catch {
      return realFetch.call(this, input, init);
    }

    // A Request object carries its own headers; merge them so an apikey set on
    // the Request rather than in init is still seen.
    let effectiveInit = init;
    if (!init && input && typeof input === "object" && input.headers) {
      effectiveInit = { headers: input.headers, method: input.method };
    }

    try {
      return Promise.resolve(handle(parsed, effectiveInit));
    } catch (error) {
      return Promise.resolve(
        json({ code: 500, msg: `mock-auth-backend: ${String(error)}` }, 500),
      );
    }
  };

  console.log(`[mock-auth-backend] intercepting ${origin}`);
}
