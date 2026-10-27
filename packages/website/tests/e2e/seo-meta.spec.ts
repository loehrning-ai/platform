import { test, expect, type Page } from "@playwright/test";
import { chapterPath, chapters } from "./fixtures/book";

const ROUTES = [
  "/",
  "/blog",
  "/open-source",
  "/ueber-mich",
  "/impressum",
  "/datenschutz",
  "/bot",
] as const;

const SOCIAL_METADATA_ROUTES = [
  "/",
  "/blog",
  "/buecher/ki-landschaft",
  chapterPath(chapters()[1]!.slug),
  "/open-source/lizenzrichtlinie",
  "/neuigkeiten",
  "/hilfe",
  "/impressum",
  "/datenschutz",
] as const;

/** Every indexable page shares exactly one card. */
async function expectOneSocialImage(page: Page): Promise<void> {
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
}

for (const route of ROUTES) {
  test(`seo: ${route} has valid JSON-LD + canonical + title`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href").catch(() => null);
    expect(canonical, `${route} should declare a canonical link`).not.toBeNull();

    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.length, `${route} should ship at least one JSON-LD block`).toBeGreaterThan(0);
    for (const s of scripts) {
      expect(() => JSON.parse(s), `${route}: JSON-LD must parse`).not.toThrow();
    }
  });
}

for (const route of SOCIAL_METADATA_ROUTES) {
  test(`seo: ${route} keeps canonical and social route identity aligned`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    const openGraphUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    const openGraphTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    const twitterTitle = await page
      .locator('meta[name="twitter:title"]')
      .getAttribute("content");

    expect(canonical).not.toBeNull();
    expect(openGraphUrl).not.toBeNull();
    expect(new URL(openGraphUrl ?? "").href).toBe(
      new URL(canonical ?? "").href,
    );
    expect(new URL(openGraphUrl ?? "").pathname).toBe(route);
    expect(openGraphTitle?.trim().length).toBeGreaterThan(4);
    expect(openGraphTitle).not.toBe("loehrning.ai");
    expect(twitterTitle).toBe(openGraphTitle);
    await expectOneSocialImage(page);
  });
}

// Pages that set their own openGraph without a route card and are not
// covered above. Setting openGraph drops the layout's, so each names an image.
for (const route of ["/demos", "/buecher", "/open-source", "/en/impressum"] as const) {
  test(`seo: ${route} declares one social image`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expectOneSocialImage(page);
  });
}

test("seo: a route card wins over the default card", async ({ page }) => {
  await page.goto("/einstieg", { waitUntil: "domcontentloaded" });

  const images = page.locator('meta[property="og:image"]');
  await expect(images).toHaveCount(1);
  expect(await images.getAttribute("content")).toContain(
    "/einstieg/opengraph-image",
  );
});

for (const route of ["/login", "/feedback"] as const) {
  test(`seo: ${route} is noindex without inherited homepage identity`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });
}

test("seo: /llms.txt returns markdown for the public/private split", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/text\/markdown/);
  const body = await res.text();
  expect(body).toMatch(/Öffentlicher Bereich/);
  expect(body).toMatch(/Private Zustände/);
  expect(body).toMatch(/Blog/);
  for (const path of ["/kurse", "/ki-fuehrerschein", "/eu-ai-act-kurs", "/ai-native", "/buecher", "/demos", "/open-source"] as const) {
    expect(body).toMatch(new RegExp(`https://loehrning\\.ai${path}`));
  }
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ki-transformation-check/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ai-native\/kurs/);
  expect(body).not.toMatch(/\bApple\b|\bRed Bull\b|\bAmazon\b|Meta Platforms/);
});

test("seo: robots.txt contains AI crawler directives", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/OAI-SearchBot/);
  expect(body).toMatch(/PerplexityBot/);
  expect(body).toMatch(/ClaudeBot/);
});

test("seo: sitemap.xml lists key public routes and omits retired/private routes", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();
  for (const path of [
    "/blog",
    "/datenschutz",
    "/kurse",
    "/ki-fuehrerschein",
    "/eu-ai-act-kurs",
    "/ai-native",
    "/buecher",
    "/demos",
    "/open-source",
    "/ueber-mich",
  ] as const) {
    expect(body).toMatch(new RegExp(`https://loehrning\\.ai${path}`));
  }
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ki-transformation-check/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ki-fuehrerschein\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/eu-ai-act-kurs\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ai-native\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/blog\/digify/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/blog\/ki-beratungsluecke/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/wie-ki-funktioniert/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/bekannte-grenzen/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ueber-die-plattform/);
  expect(body).not.toMatch(/\/kurse\/open-source\/(?:claude|codex)/);
});
