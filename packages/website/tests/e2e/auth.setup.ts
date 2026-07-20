/**
 * Auth setup project (regression coverage): seed an AUTHENTICATED storageState.
 *
 * This is the login-once step of Playwright's project-dependency pattern: the
 * an auth setup project (see playwright.config.ts) runs this file before its
 * matching auth project and writes the storageState that authed specs load.
 *
 * WHAT IT SEEDS: the exact cookie the app reads on BOTH sides of the Supabase
 * boundary - `sb-<project-ref>-auth-token`, value `base64-<base64url(session)>`
 * (see fixtures/session-mock.ts for the byte-level derivation, verified against
 * the installed @supabase/ssr + supabase-js). The ssr browser client
 * (src/lib/supabase/browser.ts) and the ssr server client
 * (src/lib/supabase/middleware.ts, auth-server.ts) both persist/read the session
 * in this cookie, NOT localStorage; seeding it is the correct offline artifact.
 *
 * DEFAULT = OFFLINE MOCK (no external Supabase): a fabricated session valid ~400
 * days out. The setup only writes cookies + storageState (no navigation, no
 * network), so it cannot fail for lack of credentials and never blocks the
 * default public projects do NOT depend on `setup`.
 *
 * LIVE VARIANT: only `auth-live-setup` may request a real password-grant token.
 * It requires SIMPLIFIED_SUPABASE_TEST_URL, _PUBLISHABLE_KEY, _EMAIL and
 * _PASSWORD plus matching NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Missing or mismatched values fail; the
 * live path never falls back to the mock.
 *
 * SCOPE LIMIT (see fixtures/session-mock.ts header): the middleware/RSC gate
 * revalidates via a SERVER-side supabase.auth.getUser() that browser page.route
 * cannot mock, and the browser client only exists when NEXT_PUBLIC_SUPABASE_*
 * was inlined at build time. So this storageState makes the CLIENT-side auth
 * affordance render logged-in offline (asserted in *.authed.spec.ts) and is the
 * correct cookie for the real/server-mocked path; protected-PAGE round-trips
 * (/konto, /api/account/*) go green once that server piece lands.
 */

import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  authCookieName,
  buildAuthCookie,
  buildMockSession,
  resolveSeedSupabaseUrl,
  signInWithRealTestSupabase,
} from "./fixtures/session-mock";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// Must resolve to the same location as STORAGE_STATE in playwright.config.ts
// (tests/e2e/.auth/user.json, relative to the package root). Gitignored.
const STORAGE_STATE = path.join(currentDirectory, ".auth", "user.json");

setup("seed auth storageState", async ({ page, baseURL }, testInfo) => {
  const origin = baseURL ?? `http://localhost:${process.env.E2E_PORT ?? 3000}`;
  const supabaseUrl = resolveSeedSupabaseUrl();
  const live = testInfo.project.name === "auth-live-setup";

  // Live setup is strict. Scaffold setup is always deterministic and offline.
  const session = live
    ? await signInWithRealTestSupabase()
    : buildMockSession(supabaseUrl);

  const context = page.context();
  await context.addCookies([buildAuthCookie(origin, session, supabaseUrl)]);

  mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  // storageState({ path }) both writes the file and returns the captured state.
  const state = await context.storageState({ path: STORAGE_STATE });

  // Fail loudly if the cookie did not persist into the storageState - a silent
  // anonymous placeholder would make every authed spec meaningless.
  const seeded = state.cookies.some((c) => c.name === authCookieName(supabaseUrl));
  if (!seeded) {
    throw new Error(
      `auth.setup: expected the Supabase auth cookie in storageState but it was absent`,
    );
  }
});
