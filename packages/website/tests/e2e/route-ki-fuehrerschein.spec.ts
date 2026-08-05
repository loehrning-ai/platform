import { test, expect, type Page } from "@playwright/test";

/**
 * /ki-fuehrerschein course track smoke + interaction (regression coverage).
 * Landing (indexable) -> CTA into the /kurs hub, which now requires login
 * (exception to policy D1 — see src/lib/crawl/contract.ts PROTECTED_PATHS).
 * Real block ids come from KI_FUEHRERSCHEIN_CONFIG.blockIds
 * (src/lib/course/config.ts): block_1..block_5. The reader is `protected` in
 * the crawl contract, so an anonymous visitor is redirected by
 * src/middleware.ts to /login?next=<path>&reason=auth-not-configured in the
 * provider-free suite before ever reaching the reader shell. These tests
 * assert that explicit fallback, not the reader content itself (which needs a live session; see
 * tests/e2e/authenticated-routes.authed.spec.ts).
 */

const ROUTE = "/ki-fuehrerschein";
const COURSE_PATH = "/ki-fuehrerschein/kurs";
const BLOCK_ROUTE = "/ki-fuehrerschein/kurs/block_1";

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

test.describe("/ki-fuehrerschein landing", () => {
  test("loads, shows the h1, and logs no console error", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI im Alltag");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the getBlocks-driven curriculum list", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /Was du lernst/i }),
    ).toBeVisible();
    // Block titles come from the course-data single source; assert the first
    // one renders so a broken getBlocks() (empty list) is caught.
    await expect(page.getByText("KI ist schon da").first()).toBeVisible();
  });

  test("primary CTA leads to the login-gated course hub", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const startCta = page
      .getByRole("link", { name: "Kostenlos mit Lernkonto starten" })
      .first();
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", COURSE_PATH);

    await startCta.click();
    // The course hub requires login; middleware redirects anonymous
    // visitors to /login with next= pointing back at the hub.
    await page.waitForURL(/\/login/);
    const url = new URL(page.url());
    expect(url.pathname, "CTA must land on /login for an anonymous visitor").toBe(
      "/login",
    );
    expect(url.searchParams.get("next")).toBe(COURSE_PATH);
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
  });
});

test.describe("/ki-fuehrerschein course reader (login-gated)", () => {
  test("anonymous visit to the course hub redirects to /login", async ({
    page,
  }) => {
    await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    const url = new URL(page.url());
    expect(url.pathname, `${COURSE_PATH} must redirect to /login`).toBe(
      "/login",
    );
    expect(url.searchParams.get("next")).toBe(COURSE_PATH);
    expect(url.searchParams.get("reason")).toBe("auth-not-configured");
  });

  test("anonymous request to a block reader gets a 307 to /login", async ({
    request,
  }) => {
    const response = await request.get(BLOCK_ROUTE, { maxRedirects: 0 });
    expect(response.status(), `status for ${BLOCK_ROUTE}`).toBe(307);

    const location = response.headers()["location"];
    expect(location, `${BLOCK_ROUTE} must set a Location header`).toBeTruthy();
    const redirectUrl = new URL(location ?? "", "http://localhost");
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe(BLOCK_ROUTE);
    expect(redirectUrl.searchParams.get("reason")).toBe("auth-not-configured");
  });
});

test.describe("/ki-fuehrerschein mobile", () => {
  test("has no horizontal overflow at 390px and keeps the hero visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kostenlos mit Lernkonto starten" }).first(),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
