import { test, expect } from "@playwright/test";

/**
 * /ki-und-gesellschaft/kurs reader (regression coverage, wave 2, updated
 * : login-gated). route-matrix.spec.ts covers the course landing.
 * The reader — /kurs overview and every /kurs/[blockId] lesson page — now
 * requires login (exception to policy D1 — see src/lib/crawl/contract.ts
 * PROTECTED_PATHS). An anonymous visitor is redirected by src/middleware.ts
 * to /login?next=<path>&reason=kurs-login before ever reaching the reader
 * shell, so these tests assert that redirect. The reader-content and
 * mobile-overflow coverage this file used to carry only applies to a logged-in
 * session; see tests/e2e/authenticated-routes.authed.spec.ts for the
 * authenticated-session test tier.
 */

const KURS = "/ki-und-gesellschaft/kurs";
const BLOCK = "/ki-und-gesellschaft/kurs/block_1";

test.describe("/ki-und-gesellschaft/kurs reader (login-gated)", () => {
  test("anonymous visit to the overview redirects to /login", async ({
    page,
  }) => {
    await page.goto(KURS, { waitUntil: "domcontentloaded" });
    const url = new URL(page.url());
    expect(url.pathname, `${KURS} must redirect to /login`).toBe("/login");
    expect(url.searchParams.get("next")).toBe(KURS);
    expect(url.searchParams.get("reason")).toBe("kurs-login");
  });

  test("anonymous request to a block route gets a 307 to /login", async ({
    request,
  }) => {
    const response = await request.get(BLOCK, { maxRedirects: 0 });
    expect(response.status(), `status for ${BLOCK}`).toBe(307);

    const location = response.headers()["location"];
    expect(location, `${BLOCK} must set a Location header`).toBeTruthy();
    const redirectUrl = new URL(location ?? "", "http://localhost");
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe(BLOCK);
    expect(redirectUrl.searchParams.get("reason")).toBe("kurs-login");
  });
});
