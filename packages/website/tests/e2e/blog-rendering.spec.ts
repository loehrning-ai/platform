import { test, expect } from "@playwright/test";

const OLD_BLOG_COPY =
  /(Ich hatte genug|Nicken im Meeting|Beratungslücke|harte Zahlen|Scan starten|Jetzt KI|Ergebnis per E-Mail|Verkaufsprospekt|höfliche Lüge|verdammt|schreiben Sie mir|verkauft sich besser)/i;

async function expectNoOldBlogCopy(page: import("@playwright/test").Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(OLD_BLOG_COPY);
}

test("blog: index lists the single definitive EU AI Act article", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator("h1")).toContainText(/Blog/);
  await expect(
    page.locator('a[href="/blog/eu-ai-act-grundlagen"]').first(),
  ).toBeVisible();
  for (const retired of [
    "/blog/digify",
    "/blog/ki-beratungsluecke",
    "/blog/deepfake-erkennen",
    "/blog/eu-ai-act-update-2026-06",
  ] as const) {
    await expect(page.locator(`a[href="${retired}"]`)).toHaveCount(0);
  }
  await expectNoOldBlogCopy(page);
});

test("blog: eu-ai-act-grundlagen renders BlogPosting JSON-LD + canonical", async ({ page }) => {
  const res = await page.goto("/blog/eu-ai-act-grundlagen");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: /EU AI Act/ }),
  ).toBeVisible();
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toMatch(/\/blog\/eu-ai-act-grundlagen$/);
  const jsonLdBlocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(jsonLdBlocks.some((s) => /BlogPosting/.test(s))).toBe(true);
  await expectNoOldBlogCopy(page);
});

test("blog: eu-ai-act-grundlagen separates in-force law from adopted amendments", async ({ page }) => {
  await page.goto("/blog/eu-ai-act-grundlagen");
  const text = await page.locator("body").innerText();
  // The post must carry the load-bearing status distinction (in-force vs adopted).
  expect(text).toMatch(/noch nicht in Kraft/);
  expect(text).toMatch(/2\. August 2026/);
  expect(text).toMatch(/2\. Dezember 2027/);
});
