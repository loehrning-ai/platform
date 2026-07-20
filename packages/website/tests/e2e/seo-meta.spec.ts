import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/blog",
  "/open-source",
  "/ueber-mich",
  "/ueber-die-plattform",
  "/impressum",
  "/datenschutz",
] as const;

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
    "/ueber-die-plattform",
  ] as const) {
    expect(body).toMatch(new RegExp(`https://loehrning\\.ai${path}`));
  }
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ki-transformation-check/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ki-fuehrerschein\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/eu-ai-act-kurs\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/ai-native\/kurs/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/blog\/digify/);
  expect(body).not.toMatch(/https:\/\/loehrning\.ai\/blog\/ki-beratungsluecke/);
});
