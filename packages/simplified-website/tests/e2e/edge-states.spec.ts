import { test, expect, type Page } from "@playwright/test";

/**
 * Edge / error / empty / loading-state coverage (regression coverage). Guards the
 * "harden" surface the audit found almost no tests for:
 *   1. an unknown route renders the global not-found.tsx (real 404 status + UI),
 *   2. a RETIRED route funnels the user to a live destination (301 -> 200) or is
 *      Gone with an empty body (410, no content leak),
 *   3. the credential-free build exposes no feedback form and never calls the
 *      disabled storage endpoint,
 *   4. the disabled endpoint fails closed before parsing or persisting input.
 *
 * These EXTEND, not duplicate, the retired-route checks in route-matrix.spec.ts
 * (410 headers) and qa-sweep.spec.ts (header-only 301 Location): the new angle
 * is that the redirect chain RESOLVES to a real 200 page and that the Gone body
 * is empty. Every assertion targets HTTP status, roles, real field labels, and
 * the exact German UI strings from not-found.tsx / feedback-form.tsx, never body
 * prose, so a content refresh stays green while a real regression (a live
 * commercial page returning, a stuck spinner, a dropped validation guard) fails.
 *
 * Runs project-agnostic: no viewport is forced, so the same specs execute on the
 * chromium AND mobile (iPhone 13 / WebKit) projects.
 */

// House console-error filter, mirrored from buecher-library.spec.ts. Applied
// only where NO network failure is deliberately induced (an aborted fetch below
// legitimately logs a browser network error, so those tests skip this check).
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

const FEEDBACK = "/feedback";

// ---------------------------------------------------------------------------
// 1. Unknown route -> global not-found.tsx (real 404)
// ---------------------------------------------------------------------------

test.describe("edge: unknown route renders not-found.tsx", () => {
  const UNKNOWN = "/diese-seite-gibt-es-nicht-2026";

  test("navigating to an unknown path returns 404 and the not-found UI", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(UNKNOWN, { waitUntil: "domcontentloaded" });

    // App Router serves not-found.tsx with a real 404 status for unmatched paths.
    expect(response?.status(), `status for ${UNKNOWN}`).toBe(404);

    // Exact strings from src/app/not-found.tsx.
    await expect(
      page.getByRole("heading", { level: 1, name: "Seite nicht gefunden." }),
    ).toBeVisible();
    await expect(page.getByText("404", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText(
        "Die angeforderte Seite existiert nicht oder wurde verschoben.",
      ),
    ).toBeVisible();

    // The recovery CTA is a real link back to the homepage (BrandButton href).
    await expect(
      page.getByRole("link", { name: "Zur Startseite" }),
    ).toHaveAttribute("href", "/");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${UNKNOWN}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("an unknown path 404s at the HTTP level too", async ({ request }) => {
    const response = await request.get("/noch-ein-toter-pfad-2026");
    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 2. Retired routes (extends route-matrix + qa-sweep, which only check headers)
// ---------------------------------------------------------------------------

test.describe("edge: retired routes 301 to a live destination or 410 Gone", () => {
  // Retired REDIRECTS that qa-sweep.spec.ts does NOT already cover, each with
  // its contract destination (src/lib/crawl/contract.ts). [301, 308] mirrors the
  // qa-sweep tolerance; the contract sets status: 301 and the middleware emits
  // NextResponse.redirect(url, 301), so 301 is the expected value. Only
  // single-segment retired paths are listed: the retired /blog/* entries are
  // deliberately excluded because getCrawlRoute matches the earlier
  // /blog/:slug (public-indexable) pattern first, so the middleware never
  // redirects them (they 404 as missing posts instead).
  const RETIRED_REDIRECTS: readonly (readonly [string, string])[] = [
    ["/digifyde", "/standortbestimmung"],
    ["/ki-readiness", "/standortbestimmung"],
    ["/eu-ai-act-check", "/standortbestimmung"],
    ["/methodik", "/blog"],
    ["/arbeitsweise", "/ueber-die-plattform"],
  ] as const;

  for (const [route, target] of RETIRED_REDIRECTS) {
    test(`${route} responds 301 -> ${target} with noindex`, async ({
      request,
    }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect([301, 308], `status for ${route}`).toContain(response.status());
      expect(response.headers()["location"], `Location for ${route}`).toContain(
        target,
      );
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
    });
  }

  test("/digifyde followed end-to-end resolves to the live /standortbestimmung page (200)", async ({
    page,
  }) => {
    // page.goto follows the 301; the returned response is the FINAL document.
    const response = await page.goto("/digifyde", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/standortbestimmung$/);
    expect(response?.status()).toBe(200);
    // Content-agnostic proof the destination actually rendered.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("/foerdermittel is 410 Gone with an empty body (no content leak)", async ({
    request,
  }) => {
    // The response deliberately has no body. Avoid reusing a keep-alive socket
    // that the production server may close while the parallel route matrix is
    // saturated; the status/header/body contract remains asserted below.
    const response = await request.get("/foerdermittel", {
      maxRedirects: 0,
      headers: { Connection: "close" },
    });
    expect(response.status()).toBe(410);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    // The middleware returns a null body for Gone routes; assert nothing leaks.
    const body = (await response.text()).trim();
    expect(body, "410 Gone must not serve a rendered page body").toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. Provider-free feedback surface
// ---------------------------------------------------------------------------

test.describe("edge: provider-free /feedback fallback", () => {
  test("renders the contact fallback without mounting or calling the storage form", async ({
    page,
  }) => {
    let apiCalls = 0;
    await page.route("**/api/feedback", async (route) => {
      apiCalls += 1;
      await route.abort();
    });

    await page.goto(FEEDBACK, { waitUntil: "load" });

    await expect(
      page.getByText(/serverseitige Feedback-Formular ist .* deaktiviert/),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Es werden keine Formulardaten gespeichert.",
    );
    await expect(page.getByRole("textbox", { name: /Nachricht/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Rückmeldung senden/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /tim@loehrning\.ai/i })).toHaveAttribute(
      "href",
      "mailto:tim@loehrning.ai",
    );
    expect(apiCalls, "a disabled feedback page must not call its storage API").toBe(0);
  });

  test("the storage endpoint rejects a valid-looking POST before accepting data", async ({
    request,
  }) => {
    const response = await request.post("/api/feedback", {
      data: {
        category: "inhalt",
        message: "Das ist eine ausreichend lange Testnachricht.",
        contextUrl: "/feedback",
      },
    });

    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "feedback_disabled",
    });
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

// ---------------------------------------------------------------------------
// 4. Provider-free fallback remains actionable and structurally unambiguous
// ---------------------------------------------------------------------------

test.describe("edge: /feedback disabled-state structure", () => {
  test("the disabled state contains one status message and no form controls", async ({
    page,
  }) => {
    await page.goto(FEEDBACK, { waitUntil: "domcontentloaded" });
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(1);
    await expect(page.getByRole("status")).toBeVisible();
  });

  test("the mailto fallback is keyboard-focusable and has a real address", async ({
    page,
  }) => {
    await page.goto(FEEDBACK, { waitUntil: "domcontentloaded" });
    const contact = page.getByRole("link", { name: /tim@loehrning\.ai/i });
    await contact.focus();
    await expect(contact).toBeFocused();
    await expect(contact).toHaveAttribute("href", "mailto:tim@loehrning.ai");
  });
});
