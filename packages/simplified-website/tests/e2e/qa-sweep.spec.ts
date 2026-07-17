import { test, expect, type Page } from "@playwright/test";

async function gotoAndAssertOk(page: Page, url: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `status for ${url}`).toBe(200);
  await expect(page.locator("text=Application error").first()).toHaveCount(0);

  const meaningful = errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/Cannot update a component/i.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
  expect(meaningful, `console errors on ${url}\n${meaningful.join("\n")}`).toEqual([]);
}

test.describe("QA sweep - public reputation routes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ isMobile }) => Boolean(isMobile), "desktop sweep only");

  for (const route of [
    "/",
    "/ueber-mich",
    "/ueber-die-plattform",
    "/open-source",
    "/kurse",
    "/buecher",
    "/demos",
    "/vorlagen",
    "/impressum",
    "/datenschutz",
    "/hilfe",
  ] as const) {
    test(`${route} renders without login`, async ({ page }) => {
      await gotoAndAssertOk(page, route);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("homepage links to public reputation resources", async ({ page }) => {
    await gotoAndAssertOk(page, "/");
    for (const href of ["/kurse", "/buecher", "/vorlagen", "/demos", "/open-source"] as const) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });
});

test.describe("QA sweep - retired commercial routes", () => {
  for (const [route, target] of [
    ["/leistungen", "/ueber-die-plattform"],
    ["/leistungen/diagnose", "/ueber-die-plattform"],
    ["/daten-audit", "/ueber-die-plattform"],
    ["/kontakt", "/feedback"],
    ["/ki-transformation-check", "/ki-check"],
    ["/foerdermittel", ""],
  ] as const) {
    test(`${route} is not a live commercial page`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      if (route === "/foerdermittel") {
        expect(response.status()).toBe(410);
      } else {
        expect([301, 308]).toContain(response.status());
        expect(response.headers()["location"]).toContain(target);
      }
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
    });
  }
});

test.describe("QA sweep - API and machine-readable resources", () => {
  test("/api/knowledge-graph.json exposes public graph only", async ({ request }) => {
    const response = await request.get("/api/knowledge-graph.json");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.site.url).toBe("https://loehrning.ai");
    expect(body.openSource.organization).toBe("loehrning-ai");
    expect(body.openSource.orgUrl).toBe("https://github.com/loehrning-ai");
  });

  test("old book PDF paths are disabled", async ({ request }) => {
    for (const slug of [
      "ki-landschaft-2026",
      "ki-arbeitsalltag-2026",
      "ki-tools-selbststaendige-2026",
    ]) {
      const response = await request.head(`/downloads/${slug}.pdf`);
      expect(response.status(), slug).toBe(410);
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
    }
  });
});
