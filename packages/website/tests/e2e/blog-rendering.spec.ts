import { test, expect } from "@playwright/test";

const OLD_BLOG_COPY =
  /(Ich hatte genug|Nicken im Meeting|Beratungslücke|harte Zahlen|Scan starten|Jetzt KI|Ergebnis per E-Mail|Verkaufsprospekt|höfliche Lüge|verdammt|schreiben Sie mir|verkauft sich besser)/i;

function isExpectedWebKitRscPrefetchCancellation(message: string): boolean {
  return /^\/localhost:\d+\/[^\s]+[?&]_rsc=[A-Za-z0-9_-]+ due to access control checks\.$/u.test(
    message,
  );
}

async function expectNoOldBlogCopy(page: import("@playwright/test").Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(OLD_BLOG_COPY);
}

const LOCALES = [
  {
    locale: "de",
    prefix: "",
    articleTitle: /EU AI Act/,
    indexIntro: /Öffentliche Texte/,
  },
  {
    locale: "en",
    prefix: "/en",
    articleTitle: /The EU AI Act/,
    indexIntro: /Public articles/,
  },
] as const;

for (const variant of LOCALES) {
  test(`blog: ${variant.locale} index lists the definitive article`, async ({
    page,
  }) => {
    await page.goto(`${variant.prefix}/blog`);
    await expect(page.locator("html")).toHaveAttribute("lang", variant.locale);
    await expect(page.locator("h1")).toContainText(/Blog/i);
    await expect(page.locator("main")).toContainText(variant.indexIntro);
    await expect(
      page
        .locator(`a[href="${variant.prefix}/blog/eu-ai-act-grundlagen"]`)
        .first(),
    ).toBeVisible();
    for (const retired of [
      "/blog/digify",
      "/blog/ki-beratungsluecke",
      "/blog/deepfake-erkennen",
      "/blog/eu-ai-act-update-2026-06",
    ] as const) {
      await expect(
        page.locator(`a[href="${variant.prefix}${retired}"]`),
      ).toHaveCount(0);
    }
    await expectNoOldBlogCopy(page);
  });

  test(`blog: ${variant.locale} article renders localized metadata and JSON-LD`, async ({
    page,
  }) => {
    const path = `${variant.prefix}/blog/eu-ai-act-grundlagen`;
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", variant.locale);
    await expect(
      page.getByRole("heading", { level: 1, name: variant.articleTitle }),
    ).toBeVisible();
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toMatch(new RegExp(`${path}$`));
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", /\/blog\/eu-ai-act-grundlagen$/);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/blog\/eu-ai-act-grundlagen$/);
    const jsonLdBlocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLdBlocks.some((s) => /BlogPosting/.test(s))).toBe(true);
    const graph = jsonLdBlocks
      .map((block) => JSON.parse(block) as { "@graph"?: unknown[] })
      .find(
        (block) =>
          Array.isArray(block["@graph"]) &&
          block["@graph"].some(
            (entry) =>
              typeof entry === "object" &&
              entry !== null &&
              "@type" in entry &&
              entry["@type"] === "BlogPosting",
          ),
      );
    expect(JSON.stringify(graph)).toContain(
      variant.locale === "de" ? '"inLanguage":"de-DE"' : '"inLanguage":"en-GB"',
    );
    await expectNoOldBlogCopy(page);
  });
}

test("blog: eu-ai-act-grundlagen states the enacted Omnibus and revised application dates", async ({
  page,
}) => {
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

test("blog: English article states the enacted Omnibus and revised application dates", async ({
  page,
}) => {
  await page.goto("/en/blog/eu-ai-act-grundlagen");
  const article = page.locator("article.post-shell");
  await expect(article).toBeVisible({ timeout: 15_000 });
  await expect(article).toContainText("published and in force", {
    timeout: 15_000,
  });
  const text = (await article.textContent()) ?? "";
  expect(text).toMatch(/27 July 2026/);
  expect(text).toMatch(/2 December 2027/);
  expect(text).toMatch(/2 August 2028/);
  expect(text).not.toMatch(/not yet in force/i);
});

for (const variant of LOCALES) {
  for (const width of [320, 390, 768, 1024, 1440] as const) {
    test(`blog: ${variant.locale} routes reflow at ${width}px without runtime errors`, async ({
      browserName,
      page,
    }) => {
      test.setTimeout(45_000);
      const runtimeErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => {
        if (
          browserName === "webkit" &&
          isExpectedWebKitRscPrefetchCancellation(error.message)
        ) {
          return;
        }
        runtimeErrors.push(error.message);
      });
      await page.setViewportSize({ width, height: 844 });

      for (const suffix of ["/blog", "/blog/eu-ai-act-grundlagen"] as const) {
        const response = await page.goto(`${variant.prefix}${suffix}`, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toBeVisible();
        await expect
          .poll(
            () =>
              page.evaluate(() => ({
                clientWidth: document.documentElement.clientWidth,
                scrollWidth: document.documentElement.scrollWidth,
              })),
            { timeout: 10_000 },
          )
          .toEqual({ clientWidth: width, scrollWidth: width });
      }

      expect(runtimeErrors).toEqual([]);
    });
  }
}

test.describe("blog without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const variant of LOCALES) {
    test(`keeps ${variant.locale} article sections and native navigation available`, async ({
      page,
    }) => {
      const response = await page.goto(
        `${variant.prefix}/blog/eu-ai-act-grundlagen`,
        { waitUntil: "domcontentloaded" },
      );
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
  }
});
