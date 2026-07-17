/**
 * Offline Supabase session mock (regression coverage).
 *
 * The app authenticates through @supabase/ssr. Both the browser client
 * (src/lib/supabase/browser.ts -> createBrowserClient) and the server client
 * (src/lib/supabase/middleware.ts + auth-server.ts -> createServerClient) read
 * the session from a COOKIE, not localStorage. This helper seeds that exact
 * cookie so the `setup` project can write an AUTHENTICATED storageState with NO
 * external Supabase, and gives authed specs a browser-boundary route mock.
 *
 * VERIFIED against the installed libs (do not "simplify" without re-checking):
 *   - Storage key:  supabase-js SupabaseClient builds
 *       `sb-${new URL(url).hostname.split(".")[0]}-auth-token`
 *     (dist/umd/supabase.js: `sb-${r.hostname.split(".")[0]}-auth-token`).
 *   - Cookie value: @supabase/ssr writes `base64-` + base64url(JSON.stringify(session))
 *     (ssr/dist/module/cookies.js: BASE64_PREFIX + stringToBase64URL(value);
 *     auth-js _saveSession JSON-stringifies the full session incl. `user`).
 *   - Single cookie while encodeURIComponent(value).length <= MAX_CHUNK_SIZE
 *     (3180); a small mock session stays one cookie named exactly the key above.
 *   - Cookie opts:  path "/", sameSite "lax", httpOnly false
 *     (ssr/dist/module/utils/constants.js DEFAULT_COOKIE_OPTIONS). No `secure`,
 *     so it rides http://localhost.
 *
 * SERVER-SIDE LIMIT (documented, not a bug here): middleware and RSC revalidate
 * via supabase.auth.getUser(), a SERVER fetch to /auth/v1/user that Playwright's
 * page.route (browser only) cannot intercept, and the browser client only exists
 * when NEXT_PUBLIC_SUPABASE_* was inlined at build time. So this cookie makes the
 * CLIENT-side auth affordance (nav AuthStatus) show a logged-in state offline
 * (when the build carries public config), while a fully-green protected-PAGE run
 * additionally needs the server to answer getUser offline (test env + a
 * server-reachable mock, or the real-Supabase variant). See the setup file.
 */

import type { BrowserContext, Page } from "@playwright/test";

// `Cookie` (the return type of context.cookies()) is not exported from
// @playwright/test; the element type accepted by addCookies() is, via the
// method signature. Use it so buildAuthCookie stays byte-compatible.
type SeedCookie = Parameters<BrowserContext["addCookies"]>[0][number];

const MOCK_SUPABASE_URL = "https://e2e-mock-ref.supabase.co";
const MOCK_EMAIL = "e2e-mock-user@loehrning.test";
const MOCK_USER_ID = "00000000-0000-4000-8000-000000000000";
// ssr/utils/chunker.js MAX_CHUNK_SIZE. A mock session must stay a single cookie.
const MAX_CHUNK_SIZE = 3180;
const BASE64_PREFIX = "base64-";

export interface MockSession {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly token_type: "bearer";
  readonly expires_in: number;
  readonly expires_at: number;
  readonly user: {
    readonly id: string;
    readonly aud: string;
    readonly role: string;
    readonly email: string;
    readonly app_metadata: Record<string, unknown>;
    readonly user_metadata: Record<string, unknown>;
    readonly [key: string]: unknown;
  };
}

/**
 * The Supabase URL the seeded session targets. Mirrors getSupabasePublicConfig()
 * ordering so the seeded cookie's project-ref matches whatever the app was built
 * with (NEXT_PUBLIC_SUPABASE_URL), else the dedicated test project, else the
 * mock host used by the provider-free auth scaffold.
 */
export function resolveSeedSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SIMPLIFIED_SUPABASE_TEST_URL?.trim() ||
    MOCK_SUPABASE_URL
  );
}

/** True when the browser Supabase client can initialise (build-time inlined). */
export function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

const LIVE_AUTH_ENV_NAMES = [
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function requireLiveAuthEnv(
  name: (typeof LIVE_AUTH_ENV_NAMES)[number],
): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`session-mock: live auth requires ${name}.`);
  }
  return value;
}

/**
 * Fail-closed defense for direct Playwright invocation. The command-level
 * validator runs before the build; this second check prevents a manually
 * selected live setup project from silently falling back to scaffold data.
 */
export function assertLiveSupabaseTestConfig(): {
  readonly url: string;
  readonly publishableKey: string;
  readonly email: string;
  readonly password: string;
} {
  const values = Object.fromEntries(
    LIVE_AUTH_ENV_NAMES.map((name) => [name, requireLiveAuthEnv(name)]),
  ) as Record<(typeof LIVE_AUTH_ENV_NAMES)[number], string>;

  const testUrl = new URL(values.SIMPLIFIED_SUPABASE_TEST_URL);
  const publicUrl = new URL(values.NEXT_PUBLIC_SUPABASE_URL);
  const testHost = testUrl.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  const publicHost = publicUrl.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  const testRef = testHost?.[1];
  const publicRef = publicHost?.[1];
  if (
    testUrl.protocol !== "https:" ||
    publicUrl.protocol !== "https:" ||
    testUrl.pathname !== "/" ||
    publicUrl.pathname !== "/" ||
    testUrl.username ||
    testUrl.password ||
    testUrl.search ||
    testUrl.hash ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash ||
    !testRef ||
    !publicRef ||
    testRef !== publicRef ||
    testUrl.origin !== publicUrl.origin
  ) {
    throw new Error(
      "session-mock: SIMPLIFIED_SUPABASE_TEST_URL and NEXT_PUBLIC_SUPABASE_URL must identify the same HTTPS project origin.",
    );
  }
  if (
    values.SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY !==
    values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error(
      "session-mock: test and browser publishable keys must identify the same project.",
    );
  }

  return {
    url: values.SIMPLIFIED_SUPABASE_TEST_URL,
    publishableKey: values.SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY,
    email: values.SIMPLIFIED_SUPABASE_TEST_EMAIL,
    password: values.SIMPLIFIED_SUPABASE_TEST_PASSWORD,
  };
}

/** `sb-<project-ref>-auth-token`, byte-identical to supabase-js's derivation. */
export function authCookieName(
  supabaseUrl: string = resolveSeedSupabaseUrl(),
): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

/** A structurally valid, unsigned JWT. auth-js trusts the stored session on
 *  recover and does not verify the signature locally, so a fixed signature is
 *  fine for the offline mock. */
function mockAccessToken(
  supabaseUrl: string,
  expiresAtSeconds: number,
): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: `${supabaseUrl}/auth/v1`,
    sub: MOCK_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: MOCK_EMAIL,
    iat: nowSeconds,
    exp: expiresAtSeconds,
    session_id: "e2e-mock-session",
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}.e2e-mock-signature`;
}

/** Build a mock session valid ~400 days out (past auth-js's refresh margin, so
 *  recover emits INITIAL_SESSION without any network refresh). */
export function buildMockSession(
  supabaseUrl: string = resolveSeedSupabaseUrl(),
  email: string = MOCK_EMAIL,
): MockSession {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + 400 * 24 * 60 * 60;
  const nowIso = new Date(nowSeconds * 1000).toISOString();
  return {
    access_token: mockAccessToken(supabaseUrl, expiresAt),
    refresh_token: "e2e-mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user: {
      id: MOCK_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email,
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
    },
  };
}

/** Encode a session exactly as @supabase/ssr stores it in the cookie. */
export function encodeAuthCookieValue(session: MockSession): string {
  const value = `${BASE64_PREFIX}${base64UrlEncode(JSON.stringify(session))}`;
  if (encodeURIComponent(value).length > MAX_CHUNK_SIZE) {
    throw new Error(
      "session-mock: encoded session exceeds MAX_CHUNK_SIZE; the mock must stay a single cookie",
    );
  }
  return value;
}

/** Decode a `sb-<ref>-auth-token` cookie value back to the session (for specs). */
export function decodeAuthCookieValue(cookieValue: string): MockSession {
  const raw = cookieValue.startsWith(BASE64_PREFIX)
    ? base64UrlDecode(cookieValue.slice(BASE64_PREFIX.length))
    : cookieValue;
  return JSON.parse(raw) as MockSession;
}

/** A Playwright cookie carrying the seeded session, scoped to the app origin. */
export function buildAuthCookie(
  baseURL: string,
  session: MockSession,
  supabaseUrl: string = resolveSeedSupabaseUrl(),
): SeedCookie {
  return {
    name: authCookieName(supabaseUrl),
    value: encodeAuthCookieValue(session),
    domain: new URL(baseURL).hostname,
    path: "/",
    expires: session.expires_at,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  };
}

/**
 * Fulfil the browser-visible Supabase auth endpoints so a CLIENT-side call
 * (AuthStatus getUser, an OTP send, a token refresh) resolves offline. This
 * only affects browser-originated requests; the server-side middleware getUser
 * is out of reach (see file header).
 */
export async function routeSupabaseAuthBoundary(
  target: Page | BrowserContext,
  session: MockSession = buildMockSession(),
): Promise<void> {
  const jsonHeaders = { "content-type": "application/json" };

  await target.route(/\/auth\/v1\/user/, (route) =>
    route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(session.user),
    }),
  );

  await target.route(/\/auth\/v1\/token/, (route) =>
    route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(session),
    }),
  );

  await target.route(/\/auth\/v1\/otp/, (route) =>
    route.fulfill({ status: 200, headers: jsonHeaders, body: "{}" }),
  );

  await target.route(/\/auth\/v1\/logout/, (route) =>
    route.fulfill({ status: 204, headers: jsonHeaders, body: "" }),
  );
}

/**
 * Live-only variant: exchange a dedicated test user's email + password for a
 * session the server can revalidate. Missing or mismatched configuration is an
 * error; this function never falls back to mock credentials.
 */
export async function signInWithRealTestSupabase(): Promise<MockSession> {
  const { url, email, password, publishableKey } =
    assertLiveSupabaseTestConfig();

  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: publishableKey },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(
      "session-mock: real Supabase password grant failed before a response. The request is capped at 15 seconds.",
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(
      `session-mock: real Supabase password grant failed (${response.status}). ` +
        "Check the dedicated SIMPLIFIED_SUPABASE_TEST_* project and that password auth is enabled.",
    );
  }
  const body = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expires_at?: number;
    user: MockSession["user"];
  };
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    token_type: "bearer",
    expires_in: body.expires_in,
    expires_at:
      body.expires_at ?? Math.floor(Date.now() / 1000) + body.expires_in,
    user: body.user,
  };
}
