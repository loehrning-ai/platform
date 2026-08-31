/**
 * Authenticated storageState proof (regression coverage). Runs ONLY under the
 * provider-free `auth-scaffold` or explicit `authenticated-live` Playwright
 * project. Both load storageState written by tests/e2e/auth.setup.ts. This file
 * does not run under any public browser project.
 *
 * Two proofs:
 *  A) The loaded storageState actually carries the seeded Supabase auth cookie
 *     and it decodes to a real session (access_token + user.email). This is the
 *     offline-deterministic scaffold proof, or live storage-state proof in the
 *     fail-closed live project. No build config is required for the scaffold.
 *  B) The CLIENT-side logged-in affordance (nav AuthStatus flips Login -> Konto).
 *     This needs the browser Supabase client, which only exists when the build
 *     inlined NEXT_PUBLIC_SUPABASE_* (src/lib/supabase/browser.ts). Skipped when
 *     that public config is absent (pure offline CI), so it is never red; it runs
 *     green once the build carries public config or the real-Supabase variant is
 *     used. The SERVER-gated /konto page cannot be asserted here: middleware
 *     revalidates via a server-side getUser() that browser page.route cannot mock
 *     (see fixtures/session-mock.ts header) - that round-trip lands with the
 *     server-mock/real-Supabase piece, not this cookie alone.
 */

import { test, expect } from "@playwright/test";
import {
  authCookieName,
  decodeAuthCookieValue,
  hasPublicSupabaseConfig,
  resolveSeedSupabaseUrl,
  routeSupabaseAuthBoundary,
} from "./fixtures/session-mock";

/**
 * Projects where the SERVER resolves a real session, so the signed-in DOM is
 * expected to render: the credentialed live tier, and the mocked-session tier
 * whose Supabase endpoints are served in-process. The provider-free
 * `auth-scaffold` project is deliberately absent - it is always signed out.
 */
const SERVER_SESSION_PROJECTS = new Set([
  "authenticated-live",
  "konto-dom-mocked",
]);


test.describe("auth storageState contract", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(
      !(
        testInfo.project.name === "auth-scaffold" ||
        SERVER_SESSION_PROJECTS.has(testInfo.project.name)
      ),
      "runs only under an auth project with setup storageState",
    );
  });

  test("A: storageState carries a decodable Supabase session cookie", async ({
    page,
    baseURL,
  }) => {
    const expectedName = authCookieName(resolveSeedSupabaseUrl());
    const cookies = await page.context().cookies(baseURL ?? undefined);
    const authCookie = cookies.find((c) => c.name === expectedName);

    expect(
      authCookie,
      `expected the ${expectedName} cookie from the setup storageState`,
    ).toBeTruthy();

    const session = decodeAuthCookieValue(authCookie!.value);
    expect(session.access_token, "session has an access_token").toBeTruthy();
    expect(typeof session.user.email, "session carries a user email").toBe("string");
    expect(session.user.email.length).toBeGreaterThan(0);
    // Far-future expiry so the client recovers the session without a refresh.
    expect(session.expires_at * 1000).toBeGreaterThan(Date.now());
  });

  test("B: nav shows the signed-in affordance (Login -> Konto)", async ({ page }, testInfo) => {
    test.skip(
      !hasPublicSupabaseConfig(),
      "browser Supabase client needs NEXT_PUBLIC_SUPABASE_* inlined at build; " +
        "skipped on offline builds with no public config",
    );

    // The scaffold resolves the browser boundary locally. The live project
    // must use the real dedicated test session and therefore receives no mock.
    if (testInfo.project.name === "auth-scaffold") {
      await routeSupabaseAuthBoundary(page);
    }
    await page.goto("/");

    const kontoLink = page.locator("nav").getByRole("link", { name: "Konto" });
    await expect(kontoLink).toBeVisible();
    await expect(kontoLink).toHaveAttribute("href", "/konto");
  });
});
