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

test("blog: eu-ai-act-grundlagen states the enacted Omnibus and revised application dates", async ({ page }) => {
  await page.goto("/blog/eu-ai-act-grundlagen");
  const article = page.locator("article.post-shell");
  // The route can initially stream the shared blog loading shell. Wait for
  // the article landmark itself instead of sampling that fallback.
  await expect(article).toBeVisible({ timeout: 15_000 });
  await expect(article).toContainText("veröffentlicht und in Kraft", {
    timeout: 15_000,
  });
  // WebKit can collapse layout whitespace around the styled inline <span>
  // differently in innerText. textContent reflects the actual accessible DOM
  // phrase that toContainText above has already waited for.
  const text = (await article.textContent()) ?? "";
  // The post must not regress to the superseded pre-publication status.
  expect(text).toMatch(/veröffentlicht und in Kraft/);
  expect(text).toMatch(/27\. Juli 2026/);
  expect(text).toMatch(/2\. Dezember 2027/);
  expect(text).toMatch(/2\. August 2028/);
  expect(text).not.toMatch(/noch nicht in Kraft/);
});

test.describe("blog without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps substantive article sections visible and section navigation native", async ({
    page,
  }) => {
    const response = await page.goto("/blog/eu-ai-act-grundlagen", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    const timelineSteps = page.locator(".pipeline__step");
    const riskSteps = page.locator(".ladder__step");
    await expect(timelineSteps.first()).toBeVisible();
    await expect(riskSteps.first()).toBeVisible();
    await expect(timelineSteps.first()).toContainText(/2024|2025|2026/);
    await expect(riskSteps.first()).not.toHaveCSS("opacity", "0");

    const timelineLink = page.locator('.railbar__item[href="#zeitplan"]');
    await expect(timelineLink).toBeVisible();
    await timelineLink.click();
    await expect(page).toHaveURL(/#zeitplan$/);
    await expect(page.locator("#zeitplan")).toBeVisible();
  });
});
